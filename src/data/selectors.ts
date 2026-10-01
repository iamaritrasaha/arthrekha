/**
 * Financial Data Selectors
 *
 * Reusable functions for querying financial observations from the dataset.
 * Handles missing data explicitly - never returns 0 for missing observations.
 */

import type { FinancialObservation, EstimateType, DerivedMetric, ComparisonEligibility, ObservationComparison } from '@/types/financial';
import { loadBudgetDataset, loadHistoricalDataset, loadHistoricalIndex, getLoadedHistoricalDatasets, getDatasetMetadata } from './budgetData';
import { getMetricDefinition, type FinancialDomain, type MetricId } from './metricDefinitions';
import { periodOrder } from '@/lib/fiscalPeriods';

export { getDatasetMetadata };
export type { MetricId } from './metricDefinitions';

/**
 * Get all observations from the dataset
 */
export function getAllObservations(): FinancialObservation[] {
  const dataset = loadBudgetDataset();
  return [...dataset.observations, ...getLoadedHistoricalDatasets().flatMap(historical => historical.observations)];
}

/**
 * Get all derived metrics
 */
export function getAllDerivedMetrics(): DerivedMetric[] {
  const dataset = loadBudgetDataset();
  return [...dataset.derivedMetrics, ...getLoadedHistoricalDatasets().flatMap(historical => historical.derivedMetrics)];
}

/** Pure selector primitive shared by the loaded-data API and release-collision tests. */
export function selectUniqueObservation(
  observations: readonly FinancialObservation[],
  metric: string,
  financialYear: string,
  estimateType: EstimateType,
  releaseId?: string,
): FinancialObservation | null {
  const matches = observations.filter(observation =>
    observation.metric === metric &&
    observation.financialYear === financialYear &&
    observation.estimateType === estimateType &&
    (releaseId === undefined || observation.source.releaseId === releaseId)
  );
  return matches.length === 1 ? matches[0] ?? null : null;
}

/**
 * Get Budget Estimate observation for a metric
 */
export function getMetric(
  metricId: string,
  predicate?: (observation: FinancialObservation) => boolean,
  financialYear = getDatasetMetadata().financialYear,
): FinancialObservation | null {
  return getAllObservations().find(obs => obs.metric === metricId && obs.financialYear === financialYear && (!predicate || predicate(obs))) ?? null;
}

/** Select a unique observation by its full semantic identity. Ambiguity fails closed. */
export function getObservation(
  metric: string,
  financialYear: string,
  estimateType: EstimateType,
  releaseId?: string,
): FinancialObservation | null {
  return selectUniqueObservation(getAllObservations(), metric, financialYear, estimateType, releaseId);
}

/** Load one explicitly requested historical FY, then select only within that dataset. */
export async function getObservationAsync(
  metric: string,
  financialYear: string,
  estimateType: EstimateType,
  releaseId?: string,
): Promise<FinancialObservation | null> {
  if (financialYear === getDatasetMetadata().financialYear) {
    return getObservation(metric, financialYear, estimateType, releaseId);
  }
  const dataset = await loadHistoricalDataset(financialYear);
  return selectUniqueObservation(dataset.observations, metric, financialYear, estimateType, releaseId);
}

/** Return only fiscal years represented by loaded observations. */
export function getAvailableYears(metric?: string, estimateType?: EstimateType): string[] {
  return [...new Set(getAllObservations()
    .filter(observation => (!metric || observation.metric === metric) &&
      (!estimateType || observation.estimateType === estimateType))
    .map(observation => observation.financialYear))]
    .sort((left, right) => right.localeCompare(left));
}

/** Get current plus published historical years from the small static index. */
export async function getAvailableYearsAsync(): Promise<string[]> {
  const index = await loadHistoricalIndex();
  return [...new Set([getDatasetMetadata().financialYear, ...index.datasets.map(dataset => dataset.financialYear)])]
    .sort((left, right) => right.localeCompare(left));
}

export function getAvailableEstimateStates(metric: string, financialYear: string): EstimateType[] {
  const stateOrder: EstimateType[] = ['BE', 'RE', 'provisional', 'actual', 'audited_actual', 'final_actual'];
  const available = new Set(getAllObservations()
    .filter(observation => observation.metric === metric && observation.financialYear === financialYear)
    .map(observation => observation.estimateType));
  return stateOrder.filter(state => available.has(state));
}

export async function getAvailableEstimateStatesAsync(metric: string, financialYear: string): Promise<EstimateType[]> {
  if (financialYear === getDatasetMetadata().financialYear) return getAvailableEstimateStates(metric, financialYear);
  const dataset = await loadHistoricalDataset(financialYear);
  const available = new Set(dataset.observations.filter(observation => observation.metric === metric).map(observation => observation.estimateType));
  const stateOrder: EstimateType[] = ['BE', 'RE', 'provisional', 'actual', 'audited_actual', 'final_actual'];
  return stateOrder.filter(state => available.has(state));
}

/** Conservative pairwise comparison gate. Explicit source mappings can add a note or reject. */
export function getComparisonEligibility(
  left: FinancialObservation | null,
  right: FinancialObservation | null,
): ComparisonEligibility {
  if (!left || !right) return { status: 'not_comparable', rationale: 'Both observations are required; missing data is not zero.' };
  if (left.metric !== right.metric) return { status: 'not_comparable', rationale: 'The observations use different metric IDs.' };
  if (left.estimateType !== right.estimateType) return { status: 'not_comparable', rationale: 'Estimate states differ; compare the same state.' };
  if (left.periodType !== right.periodType) return { status: 'not_comparable', rationale: 'The observations cover different period types.' };
  if ((left.period || right.period) && left.period !== right.period) {
    return { status: 'not_comparable', rationale: 'The observations cover different reporting periods.' };
  }
  if (left.unit !== right.unit || left.currency !== right.currency) return { status: 'not_comparable', rationale: 'Units or currencies differ.' };
  if (left.definitionVersion && right.definitionVersion && left.definitionVersion !== right.definitionVersion) {
    return { status: 'not_comparable', rationale: `Canonical definition versions differ (${left.definitionVersion} vs ${right.definitionVersion}).` };
  }
  if (left.canonicalDefinition && right.canonicalDefinition && left.canonicalDefinition !== right.canonicalDefinition) {
    return { status: 'not_comparable', rationale: 'Canonical definitions differ despite matching metric IDs.' };
  }

  const declared = [left.comparisonEligibility, right.comparisonEligibility].filter(Boolean) as ComparisonEligibility[];
  const rejected = declared.find(item => item.status === 'not_comparable');
  if (rejected) return { status: 'not_comparable', rationale: rejected.rationale ?? 'A source mapping marks this observation as not comparable.' };

  const notes = declared
    .filter(item => item.status === 'comparable_with_note')
    .map(item => item.rationale)
    .filter((note): note is string => Boolean(note));
  if (!left.definitionVersion || !right.definitionVersion) {
    notes.push('At least one observation has no recorded canonical definition version.');
  }
  if (notes.length) return { status: 'comparable_with_note', rationale: [...new Set(notes)].join(' ') };
  return { status: 'comparable', rationale: 'Metric, estimate state, units, and canonical definition version match.' };
}

/** Build a provenance-preserving comparison; rejected pairs never get a percentage change. */
export function createObservationComparison(
  left: FinancialObservation | null,
  right: FinancialObservation | null,
): ObservationComparison {
  const eligibility = getComparisonEligibility(left, right);
  const percentageChangePermitted = eligibility.status !== 'not_comparable' &&
    left !== null && right !== null && left.amount !== 0;
  const rationale = left && right && eligibility.status !== 'not_comparable' && left.amount === 0
    ? `${eligibility.rationale} Percentage change is undefined because the left value is zero.`
    : eligibility.rationale;
  const result: ObservationComparison = {
    left,
    right,
    metric: left?.metric ?? right?.metric ?? '',
    leftFinancialYear: left?.financialYear ?? null,
    rightFinancialYear: right?.financialYear ?? null,
    leftEstimateType: left?.estimateType ?? null,
    rightEstimateType: right?.estimateType ?? null,
    leftSourceId: left?.source.sourceId ?? null,
    rightSourceId: right?.source.sourceId ?? null,
    leftReleaseId: left?.source.releaseId ?? null,
    rightReleaseId: right?.source.releaseId ?? null,
    status: eligibility.status,
    rationale: rationale ?? 'Comparison eligibility is unspecified.',
    percentageChangePermitted,
  };
  if (percentageChangePermitted && left && right) {
    result.percentageChange = (right.amount - left.amount) / left.amount * 100;
  }
  return result;
}

export function getBudgetEstimate(metricId: string): FinancialObservation | null {
  return getObservation(metricId, getDatasetMetadata().financialYear, 'BE');
}

/**
 * Get latest actual/provisional observation for a metric
 * Returns the most recent period available in the dataset.
 */
export function getLatestActual(metricId: string): FinancialObservation | null {
  const observations = getAllObservations();
  const currentFinancialYear = getDatasetMetadata().financialYear;

  // Get all actuals for this metric
  const actuals = observations.filter(
    obs => obs.metric === metricId &&
    obs.financialYear === currentFinancialYear &&
    (obs.estimateType === 'actual' || obs.estimateType === 'provisional')
  );

  if (actuals.length === 0) return null;

  return [...actuals].sort((a, b) => periodOrder(b.period) - periodOrder(a.period))[0] ?? null;
}

/**
 * Get observation by specific period
 */
export function getObservationByPeriod(
  metricId: string,
  period: string,
  estimateType: EstimateType
): FinancialObservation | null {
  const observations = getAllObservations();
  const currentFinancialYear = getDatasetMetadata().financialYear;
  return observations.find(
    obs => obs.metric === metricId &&
           obs.financialYear === currentFinancialYear &&
           obs.period === period &&
           obs.estimateType === estimateType
  ) ?? null;
}

/**
 * Get all observations for a metric in the active dataset fiscal year.
 */
export function getMetricObservations(metricId: string): FinancialObservation[] {
  const observations = getAllObservations();
  const currentFinancialYear = getDatasetMetadata().financialYear;
  return observations.filter(obs => obs.metric === metricId && obs.financialYear === currentFinancialYear);
}

/**
 * Get cumulative fiscal-year progression for a metric.
 */
export function getMonthlyProgression(metricId: string): FinancialObservation[] {
  const observations = getAllObservations();
  const currentFinancialYear = getDatasetMetadata().financialYear;

  return observations
    .filter(obs => obs.metric === metricId && obs.financialYear === currentFinancialYear && obs.estimateType === 'provisional')
    .sort((a, b) => periodOrder(a.period) - periodOrder(b.period));
}

/**
 * Get execution rate for a metric
 */
export function getExecutionRate(metricId: string, financialYear = getDatasetMetadata().financialYear): DerivedMetric | null {
  const derived = getAllDerivedMetrics();
  const rateMetric = `${metricId}_execution_rate`;
  return derived.find(d => d.metric === rateMetric &&
    (d.financialYear === financialYear || (!d.financialYear && financialYear === getDatasetMetadata().financialYear))) ?? null;
}

export function getDerivedMetric(metricId: string, financialYear = getDatasetMetadata().financialYear): DerivedMetric | null {
  return getAllDerivedMetrics().find(derivedMetric => derivedMetric.metric === metricId &&
    (derivedMetric.financialYear === financialYear || (!derivedMetric.financialYear && financialYear === getDatasetMetadata().financialYear))) ?? null;
}

export function getMetricRatio(metricId: string, ratioId: string): DerivedMetric | null {
  const definition = getMetricDefinition(metricId);
  if (!definition?.compatibleRatios.includes(ratioId)) return null;
  return getDerivedMetric(ratioId);
}

export function getMetricsForDomain(domain: FinancialDomain): MetricId[] {
  return getAvailableMetrics().filter(metricId => getMetricDefinition(metricId)?.domain === domain) as MetricId[];
}

export function getMetricProvenance(observation: FinancialObservation | null) {
  if (!observation) return null;
  return getProvenance(observation);
}

export function getLatestPeriod(): string | null {
  const currentFinancialYear = getDatasetMetadata().financialYear;
  const actuals = getAllObservations().filter(obs => obs.financialYear === currentFinancialYear && (obs.estimateType === 'actual' || obs.estimateType === 'provisional'));
  return [...actuals].sort((a, b) => periodOrder(b.period) - periodOrder(a.period))[0]?.period ?? null;
}

/**
 * Calculate execution rate manually (for verification or when derived metric not available)
 */
export function calculateExecutionRate(metricId: string): number | null {
  const be = getBudgetEstimate(metricId);
  const actual = getLatestActual(metricId);

  if (!be || !actual || be.amount === 0) return null;

  return (actual.amount / be.amount) * 100;
}

/**
 * Get provenance information for an observation
 */
export function getProvenance(observation: FinancialObservation) {
  return {
    metric: observation.metric,
    jurisdiction: observation.jurisdiction,
    financialYear: observation.financialYear,
    period: observation.period,
    estimateType: observation.estimateType,
    source: observation.source,
    amount: observation.amount,
    unit: observation.unit,
  };
}

/**
 * Check if a metric has actual data available
 */
export function hasActualData(metricId: string): boolean {
  return getLatestActual(metricId) !== null;
}

/**
 * Get all available metric IDs in the dataset
 */
export function getAvailableMetrics(): string[] {
  const observations = getAllObservations();
  const metrics = new Set(observations.map(obs => obs.metric));
  return Array.from(metrics);
}
