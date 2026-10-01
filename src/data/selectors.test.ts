/**
 * Data Access Layer Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { loadBudgetDataset, getDatasetMetadata } from '@/data/budgetData';
import historical2021_22 from '@/../datasets/processed/union/history/2021-22.json';
import historical2022_23 from '@/../datasets/processed/union/history/2022-23.json';
import historical2023_24 from '@/../datasets/processed/union/history/2023-24.json';
import historical2024_25 from '@/../datasets/processed/union/history/2024-25.json';
import historical2025_26 from '@/../datasets/processed/union/history/2025-26.json';
import {
  getBudgetEstimate,
  getMetric,
  getLatestActual,
  getExecutionRate,
  getMonthlyProgression,
  getMetricProvenance,
  getAvailableMetrics,
  getDerivedMetric,
  getMetricRatio,
  getMetricsForDomain,
  getObservation,
  getObservationAsync,
  getAvailableYears,
  getAvailableYearsAsync,
  getAvailableEstimateStates,
  getAvailableEstimateStatesAsync,
  selectUniqueObservation,
  createObservationComparison,
} from '@/data/selectors';

describe('Budget Data Loader', () => {
  it('loads the dataset successfully', () => {
    const dataset = loadBudgetDataset();
    expect(dataset).toBeDefined();
    expect(dataset.financialYear).toBe('2026-27');
    expect(dataset.observations).toBeInstanceOf(Array);
    expect(dataset.observations.length).toBeGreaterThan(0);
  });

  it('provides correct metadata', () => {
    const metadata = getDatasetMetadata();
    expect(metadata.financialYear).toBe('2026-27');
    expect(metadata.latestPeriod).toMatch(/^apr(?:-[a-z]{3})?$/);
    expect(metadata.totalObservations).toBeGreaterThan(0);
  });
});

describe('Data Selectors', () => {
  const baseline = () => getObservation('fiscal_deficit', '2026-27', 'BE')!;

  it('keeps two BE releases in one FY distinct and refuses an ambiguous release-less lookup', () => {
    const first = baseline();
    const releaseA = { ...first, source: { ...first.source, sourceId: 'union-budget', releaseId: 'be-interim' } };
    const releaseB = { ...first, source: { ...first.source, sourceId: 'union-budget', releaseId: 'be-full' } };

    expect(selectUniqueObservation([releaseA, releaseB], first.metric, first.financialYear, 'BE')).toBeNull();
    expect(selectUniqueObservation([releaseA, releaseB], first.metric, first.financialYear, 'BE', 'be-interim')).toBe(releaseA);
    expect(releaseA.source.releaseId).not.toBe(releaseB.source.releaseId);
  });

  it('selects BE and RE separately and keeps provisional and final actual states distinct', () => {
    const be = baseline();
    const observations = [
      be,
      { ...be, id: 're-id', estimateType: 'RE' as const, source: { ...be.source, releaseId: 're-release' } },
      { ...be, id: 'provisional-id', estimateType: 'provisional' as const, source: { ...be.source, releaseId: 'provisional-close' } },
      { ...be, id: 'final-id', estimateType: 'final_actual' as const, source: { ...be.source, releaseId: 'finance-accounts' } },
    ];

    expect(selectUniqueObservation(observations, be.metric, be.financialYear, 'BE')).toBe(be);
    expect(selectUniqueObservation(observations, be.metric, be.financialYear, 'RE')?.id).toBe('re-id');
    expect(selectUniqueObservation(observations, be.metric, be.financialYear, 'provisional')?.id).toBe('provisional-id');
    expect(selectUniqueObservation(observations, be.metric, be.financialYear, 'final_actual')?.id).toBe('final-id');
  });

  it('preserves comparison inputs and never exposes percentage change for not-comparable pairs', () => {
    const left = baseline();
    const right = { ...left, financialYear: '2025-26', estimateType: 'RE' as const, source: { ...left.source, sourceId: 'budget', releaseId: 're-2026' } };
    const comparison = createObservationComparison(left, right);

    expect(comparison.left).toBe(left);
    expect(comparison.right).toBe(right);
    expect(comparison.leftFinancialYear).toBe('2026-27');
    expect(comparison.rightFinancialYear).toBe('2025-26');
    expect(comparison.leftEstimateType).toBe('BE');
    expect(comparison.rightEstimateType).toBe('RE');
    expect(comparison.rightSourceId).toBe('budget');
    expect(comparison.rightReleaseId).toBe('re-2026');
    expect(comparison.status).toBe('not_comparable');
    expect(comparison.percentageChangePermitted).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(comparison, 'percentageChange')).toBe(false);
  });

  it('preserves the rationale for comparable_with_note pairs and permits their percentage change', () => {
    const left = { ...baseline(), definitionVersion: '1', canonicalDefinition: 'Fiscal deficit as defined by Arthrekha' };
    const rationale = 'Historical source labels were reconciled to the same canonical definition.';
    const right = {
      ...left,
      financialYear: '2025-26',
      amount: left.amount * 1.1,
      source: { ...left.source, sourceId: 'union-budget', releaseId: 're-2026' },
      comparisonEligibility: { status: 'comparable_with_note' as const, rationale },
    };
    const comparison = createObservationComparison(left, right);

    expect(comparison.status).toBe('comparable_with_note');
    expect(comparison.rationale).toContain(rationale);
    expect(comparison.percentageChangePermitted).toBe(true);
    expect(comparison.percentageChange).toBeCloseTo(10);
  });

  it('keeps missing observations missing instead of treating them as zero', () => {
    const comparison = createObservationComparison(null, baseline());

    expect(getObservation('not_a_metric', '2026-27', 'BE')).toBeNull();
    expect(comparison.left).toBeNull();
    expect(comparison.status).toBe('not_comparable');
    expect(comparison.percentageChangePermitted).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(comparison, 'percentageChange')).toBe(false);
    expect(comparison.rationale).toContain('missing data is not zero');
  });

  it('exposes only loaded years/states and keeps legacy selectors on the dataset FY', () => {
    const dataset = loadBudgetDataset();
    const expectedBE = dataset.observations.find(obs => obs.metric === 'fiscal_deficit' && obs.financialYear === '2026-27' && obs.estimateType === 'BE');
    const expectedLatestActual = dataset.observations
      .find(obs => obs.metric === 'fiscal_deficit' && obs.financialYear === '2026-27' && obs.period === dataset.metadata.latestPeriod && (obs.estimateType === 'actual' || obs.estimateType === 'provisional'));

    expect(getAvailableYears()).toEqual(['2026-27']);
    expect(getAvailableYears('fiscal_deficit', 'BE')).toEqual(['2026-27']);
    expect(getAvailableEstimateStates('fiscal_deficit', '2026-27')).toEqual(['BE', 'provisional']);
    expect(getBudgetEstimate('fiscal_deficit')).toEqual(expectedBE);
    expect(getLatestActual('fiscal_deficit')).toEqual(expectedLatestActual);
  });

  it('keeps current-year selectors immediate and network-free', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    try {
      expect(getBudgetEstimate('fiscal_deficit')).toEqual(baseline());
      expect(getObservation('fiscal_deficit', '2026-27', 'BE')).toEqual(baseline());
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('loads requested historical years independently and preserves exact release comparison semantics', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith('/index.json')) return { ok: true, status: 200, json: async () => ({ schemaVersion: 1, datasets: [
        { financialYear: '2021-22', path: '2021-22.json', sourceManifestPath: 'manifests/2021-22.json' },
        { financialYear: '2022-23', path: '2022-23.json', sourceManifestPath: 'manifests/2022-23.json' },
        { financialYear: '2023-24', path: '2023-24.json', sourceManifestPath: 'manifests/2023-24.json' },
        { financialYear: '2024-25', path: '2024-25.json', sourceManifestPath: 'manifests/2024-25.json' },
        { financialYear: '2025-26', path: '2025-26.json', sourceManifestPath: 'manifests/2025-26.json' },
      ] }) } as Response;
      if (url.endsWith('/2021-22.json')) return { ok: true, status: 200, json: async () => historical2021_22 } as Response;
      if (url.endsWith('/2022-23.json')) return { ok: true, status: 200, json: async () => historical2022_23 } as Response;
      if (url.endsWith('/2023-24.json')) return { ok: true, status: 200, json: async () => historical2023_24 } as Response;
      if (url.endsWith('/2024-25.json')) return { ok: true, status: 200, json: async () => historical2024_25 } as Response;
      if (url.endsWith('/2025-26.json')) return { ok: true, status: 200, json: async () => historical2025_26 } as Response;
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    }));

    try {
      const interim = await getObservationAsync('fiscal_deficit', '2024-25', 'BE', 'union-interim-budget-2024-25-be-2024-02-01');
      const full = await getObservationAsync('fiscal_deficit', '2024-25', 'BE', 'union-full-budget-2024-25-be-2024-07-23');
      expect(interim?.amount).toBe(1685494);
      expect(full?.amount).toBe(1613312);
      expect(interim?.id).not.toBe(full?.id);
      expect(await getObservationAsync('fiscal_deficit', '2024-25', 'BE')).toBeNull();
      expect((await getObservationAsync('fiscal_deficit', '2024-25', 'RE'))?.amount).toBe(1569527);
      expect((await getObservationAsync('revenue_receipts', '2024-25', 'final_actual'))?.amount).toBe(3422438.19);
      expect(await getObservationAsync('fiscal_deficit', '2024-25', 'final_actual')).toBeNull();
      expect(await getAvailableEstimateStatesAsync('fiscal_deficit', '2024-25')).toEqual(['BE', 'RE']);
      const fullBudgetBe = await getObservationAsync('fiscal_deficit', '2024-25', 'BE', 'union-full-budget-2024-25-be-2024-07-23');
      const fy25Be = await getObservationAsync('fiscal_deficit', '2025-26', 'BE', 'union-budget-2025-26-original-be-2025-02-01');
      const estimateComparison = createObservationComparison(fullBudgetBe, fy25Be);
      expect(estimateComparison.status).toBe('comparable');
      expect(estimateComparison.percentageChangePermitted).toBe(true);
      const re24 = await getObservationAsync('fiscal_deficit', '2024-25', 'RE');
      const re25 = await getObservationAsync('fiscal_deficit', '2025-26', 'RE');
      expect(createObservationComparison(re24, re25).status).toBe('comparable');
      const re23 = await getObservationAsync('fiscal_deficit', '2023-24', 'RE');
      const re23to24 = createObservationComparison(re23, re24);
      expect(re23to24.status).toBe('comparable_with_note');
      expect(re23to24.rationale).toContain('Interim Budget 2024-25');
      const final = await getObservationAsync('revenue_receipts', '2024-25', 'final_actual');
      const provisional = await getObservationAsync('revenue_receipts', '2025-26', 'provisional');
      const actualComparison = createObservationComparison(final, provisional);
      expect(actualComparison.status).toBe('not_comparable');
      expect(actualComparison.rationale).toContain('Estimate states differ');
      expect(actualComparison.percentageChangePermitted).toBe(false);
      const interim23 = await getObservationAsync('revenue_receipts', '2023-24', 'RE', 'union-interim-budget-2024-25-be-2024-02-01');
      const be22 = await getObservationAsync('revenue_receipts', '2022-23', 'BE', 'union-budget-2022-23-original-2022-02-01');
      const be21 = await getObservationAsync('revenue_receipts', '2021-22', 'BE', 'union-budget-2021-22-original-be-2021-02-01');
      expect(interim23?.amount).toBe(2699713);
      expect(be22?.amount).toBe(2204422);
      expect(be21?.amount).toBe(1788424);
      expect(await getObservationAsync('fiscal_deficit', '2023-24', 'final_actual')).toBeNull();
      expect(await getObservationAsync('revenue_receipts', '2021-22', 'final_actual')).toMatchObject({
        amount: 2436421.48,
        identityVersion: 2,
      });
      const actual21 = await getObservationAsync('revenue_receipts', '2021-22', 'final_actual');
      const actual22 = await getObservationAsync('revenue_receipts', '2022-23', 'final_actual');
      const finalComparison = createObservationComparison(actual21, actual22);
      expect(finalComparison.status).toBe('comparable_with_note');
      expect(finalComparison.rationale).toContain('separately reported grants-in-aid');
      expect(finalComparison.percentageChangePermitted).toBe(true);
      const actual23 = await getObservationAsync('revenue_receipts', '2023-24', 'final_actual');
      const actual24 = await getObservationAsync('revenue_receipts', '2024-25', 'final_actual');
      expect(createObservationComparison(actual23, actual24).status).toBe('comparable_with_note');
      const fullBe23 = await getObservationAsync('fiscal_deficit', '2023-24', 'BE');
      const interimBe24 = await getObservationAsync('fiscal_deficit', '2024-25', 'BE', 'union-interim-budget-2024-25-be-2024-02-01');
      const interimBeComparison = createObservationComparison(fullBe23, interimBe24);
      expect(interimBeComparison.status).toBe('comparable_with_note');
      expect(interimBeComparison.rationale).toContain('Interim Budget vintage');
      const notComparable = createObservationComparison(actual21, await getObservationAsync('revenue_receipts', '2022-23', 'BE'));
      expect(notComparable.status).toBe('not_comparable');
      expect(notComparable.percentageChangePermitted).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(notComparable, 'percentageChange')).toBe(false);
      expect(await getAvailableYearsAsync()).toEqual(['2026-27', '2025-26', '2024-25', '2023-24', '2022-23', '2021-22']);
      expect(urls).toEqual([
        '/data/history/index.json', '/data/history/2024-25.json', '/data/history/2025-26.json',
        '/data/history/2023-24.json', '/data/history/2022-23.json', '/data/history/2021-22.json',
      ]);
      await expect(getObservationAsync('fiscal_deficit', '2020-21', 'BE')).rejects.toThrow('No historical dataset is published for FY 2020-21.');
      expect(urls).not.toContain('/data/history/2020-21.json');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('looks up a metric without exposing source-format details', () => {
    expect(getMetric('capital_expenditure')?.amount).toBe(1221821);
    expect(getMetric('not_a_metric')).toBeNull();
  });

  it('retrieves Budget Estimate for total expenditure', () => {
    const be = getBudgetEstimate('total_expenditure');
    expect(be).toBeDefined();
    expect(be?.estimateType).toBe('BE');
    expect(be?.metric).toBe('total_expenditure');
    expect(be?.amount).toBeGreaterThan(0);
  });

  it('retrieves latest actual for total expenditure', () => {
    const actual = getLatestActual('total_expenditure');
    expect(actual).toBeDefined();
    expect(actual?.estimateType).toBe('provisional');
    expect(actual?.period).toBe(getDatasetMetadata().latestPeriod);
    expect(actual?.amount).toBeGreaterThan(0);
  });

  it('retrieves execution rate', () => {
    const rate = getExecutionRate('total_expenditure');
    expect(rate).toBeDefined();
    expect(rate?.metric).toBe('total_expenditure_execution_rate');
    expect(rate?.value).toBeGreaterThan(0);
    expect(rate?.value).toBeLessThan(100);
  });

  it('retrieves monthly progression', () => {
    const monthly = getMonthlyProgression('revenue_receipts');
    expect(monthly).toBeInstanceOf(Array);
    expect(monthly.length).toBeGreaterThanOrEqual(1);
    expect(monthly[0]?.period).toBe('apr');
    expect(monthly[monthly.length - 1]?.period).toBe(getDatasetMetadata().latestPeriod);
  });

  it('lists all available metrics', () => {
    const metrics = getAvailableMetrics();
    expect(metrics).toContain('total_expenditure');
    expect(metrics).toContain('revenue_receipts');
    expect(metrics).toContain('fiscal_deficit');
    expect(metrics).toContain('primary_deficit');
    expect(metrics).toContain('market_borrowings_net');
    expect(metrics.length).toBe(44);
  });

  it('returns null for non-existent metric', () => {
    const be = getBudgetEstimate('non_existent_metric');
    expect(be).toBeNull();
    expect(getLatestActual('non_existent_metric')).toBeNull();
  });

  it('resolves provenance from the normalized observation', () => {
    const actual = getLatestActual('capital_expenditure');
    const provenance = getMetricProvenance(actual);
    expect(provenance?.source.organization).toContain('Controller General');
    expect(provenance?.estimateType).toBe('provisional');
    expect(getMetricProvenance(null)).toBeNull();
  });

  it('keeps total receipts distinct from non-borrowed receipts', () => {
    expect(getBudgetEstimate('total_receipts')?.amount).toBe(5347315);
    expect(getBudgetEstimate('non_borrowed_receipts')?.amount).toBe(3651547);
    expect(getBudgetEstimate('non_borrowed_receipts')?.source.dataStatus).toBe('derived');
  });

  it('retrieves only registered compatible ratios', () => {
    const ratio = getMetricRatio('fiscal_deficit', 'fiscal_deficit_gdp_ratio');
    expect(ratio?.value).toBeGreaterThan(4.3);
    expect(ratio?.value).toBeLessThan(4.4);
    expect(getMetricRatio('fiscal_deficit', 'interest_revenue_receipts_ratio')).toBeNull();
    expect(getDerivedMetric('interest_revenue_receipts_ratio')?.unit).toBe('percentage');
  });

  it('groups available observations by explicit financial domain', () => {
    expect(getMetricsForDomain('deficit')).toEqual(expect.arrayContaining(['fiscal_deficit', 'revenue_deficit', 'primary_deficit']));
    expect(getMetricsForDomain('federal')).toContain('total_transfers_states_uts');
  });

  it('enforces canonical DataStatus contract on all observations', () => {
    const dataset = loadBudgetDataset();
    const validDataStatuses = new Set(['final', 'provisional', 'estimated', 'derived', 'audited']);
    for (const obs of dataset.observations) {
      expect(validDataStatuses.has(obs.source.dataStatus)).toBe(true);
      expect(obs.source.dataStatus).not.toBe('BE');
    }
  });
});
