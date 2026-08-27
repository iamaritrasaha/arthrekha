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
    expect(metadata.latestPeriod).toBe('apr-jun');
    expect(metadata.totalObservations).toBe(40);
  });
});

describe('Data Selectors', () => {
  it('looks up a metric without exposing source-format details', () => {
    expect(getMetric('capital_expenditure')?.amount).toBe(1160000);
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
    expect(actual?.period).toBe('apr-jun');
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
    expect(monthly.length).toBe(3); // Apr, May, Jun
    expect(monthly[0]?.period).toBe('apr');
    expect(monthly[2]?.period).toBe('apr-jun');
  });

  it('lists all available metrics', () => {
    const metrics = getAvailableMetrics();
    expect(metrics).toContain('total_expenditure');
    expect(metrics).toContain('revenue_receipts');
    expect(metrics).toContain('fiscal_deficit');
    expect(metrics.length).toBe(10);
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
});
