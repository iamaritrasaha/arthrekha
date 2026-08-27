/**
 * Budget Dataset Loader
 *
 * Imports and provides access to the processed Union Budget FY 2026-27 dataset.
 * This is the single source of truth for all financial data displayed in the app.
 */

import type { FinancialObservation, DerivedMetric } from '@/types/financial';
import budgetDataset from '@/../datasets/processed/union/budget-summary-2026-27.json';

/**
 * Processed dataset structure from pipeline output
 */
export interface ProcessedDataset {
  financialYear: string;
  asOfDate: string;
  observations: FinancialObservation[];
  derivedMetrics: DerivedMetric[];
  metadata: {
    generated: string;
    totalObservations: number;
    sources: string[];
    latestPeriod: string;
    dataStatus: string;
  };
}

/**
 * Load the processed budget dataset
 */
export function loadBudgetDataset(): ProcessedDataset {
  return budgetDataset as ProcessedDataset;
}

/**
 * Get dataset metadata
 */
export function getDatasetMetadata() {
  const dataset = loadBudgetDataset();
  return {
    financialYear: dataset.financialYear,
    asOfDate: dataset.asOfDate,
    latestPeriod: dataset.metadata.latestPeriod,
    totalObservations: dataset.metadata.totalObservations,
    dataStatus: dataset.metadata.dataStatus,
  };
}
