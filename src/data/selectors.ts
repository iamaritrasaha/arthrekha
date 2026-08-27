/**
 * Financial Data Selectors
 *
 * Reusable functions for querying financial observations from the dataset.
 * Handles missing data explicitly - never returns 0 for missing observations.
 */

import type { FinancialObservation, EstimateType, DerivedMetric } from '@/types/financial';
import { loadBudgetDataset, getDatasetMetadata } from './budgetData';
import { getMetricDefinition, type FinancialDomain, type MetricId } from './metricDefinitions';

export { getDatasetMetadata };
export type { MetricId } from './metricDefinitions';

/**
 * Get all observations from the dataset
 */
export function getAllObservations(): FinancialObservation[] {
  const dataset = loadBudgetDataset();
  return dataset.observations;
}

/**
 * Get all derived metrics
 */
export function getAllDerivedMetrics(): DerivedMetric[] {
  const dataset = loadBudgetDataset();
  return dataset.derivedMetrics;
}

/**
 * Get Budget Estimate observation for a metric
 */
export function getMetric(metricId: string, predicate?: (observation: FinancialObservation) => boolean): FinancialObservation | null {
  return getAllObservations().find(obs => obs.metric === metricId && (!predicate || predicate(obs))) ?? null;
}

export function getBudgetEstimate(metricId: string): FinancialObservation | null {
  const observations = getAllObservations();
  return observations.find(
    obs => obs.metric === metricId && obs.estimateType === 'BE'
  ) ?? null;
}

/**
 * Get latest actual/provisional observation for a metric
 * Returns the most recent period (apr-jun in current dataset)
 */
export function getLatestActual(metricId: string): FinancialObservation | null {
  const observations = getAllObservations();

  // Get all actuals for this metric
  const actuals = observations.filter(
    obs => obs.metric === metricId &&
    (obs.estimateType === 'actual' || obs.estimateType === 'provisional')
  );

  if (actuals.length === 0) return null;

  const periodOrder = ['apr', 'apr-may', 'apr-jun'];
  return [...actuals].sort((a, b) => periodOrder.indexOf(b.period ?? '') - periodOrder.indexOf(a.period ?? ''))[0] ?? null;
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
  return observations.find(
    obs => obs.metric === metricId &&
           obs.period === period &&
           obs.estimateType === estimateType
  ) ?? null;
}

/**
 * Get all observations for a metric (all periods and estimate types)
 */
export function getMetricObservations(metricId: string): FinancialObservation[] {
  const observations = getAllObservations();
  return observations.filter(obs => obs.metric === metricId);
}

/**
 * Get monthly progression for a metric (Apr, May, Jun)
 */
export function getMonthlyProgression(metricId: string): FinancialObservation[] {
  const observations = getAllObservations();

  const periods = ['apr', 'apr-may', 'apr-jun'];
  const monthly = periods
    .map(period => observations.find(
      obs => obs.metric === metricId &&
             obs.period === period &&
             obs.estimateType === 'provisional'
    ))
    .filter((obs): obs is FinancialObservation => obs !== undefined);

  return monthly;
}

/**
 * Get execution rate for a metric
 */
export function getExecutionRate(metricId: string): DerivedMetric | null {
  const derived = getAllDerivedMetrics();
  const rateMetric = `${metricId}_execution_rate`;
  return derived.find(d => d.metric === rateMetric) ?? null;
}

export function getDerivedMetric(metricId: string): DerivedMetric | null {
  return getAllDerivedMetrics().find(derivedMetric => derivedMetric.metric === metricId) ?? null;
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
  const actuals = getAllObservations().filter(obs => obs.estimateType === 'actual' || obs.estimateType === 'provisional');
  const periodOrder = ['apr', 'apr-may', 'apr-jun'];
  return [...actuals].sort((a, b) => periodOrder.indexOf(b.period ?? '') - periodOrder.indexOf(a.period ?? ''))[0]?.period ?? null;
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
