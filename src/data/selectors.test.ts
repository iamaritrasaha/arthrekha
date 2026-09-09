/**
 * Data Access Layer Tests
 */

import { describe, it, expect } from 'vitest';
import { loadBudgetDataset, getDatasetMetadata } from '@/data/budgetData';
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
    expect(metadata.totalObservations).toBe(74);
  });
});

describe('Data Selectors', () => {
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
});
