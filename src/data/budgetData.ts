/**
 * Budget Dataset Loader
 *
 * Imports and provides access to the processed Union Budget FY 2026-27 dataset.
 * This is the single source of truth for all financial data displayed in the app.
 */

import type { FinancialObservation, DerivedMetric } from '@/types/financial';
import budgetDataset from '@/../datasets/processed/union/budget-summary-2026-27.json';
import type { HistoricalDatasetIndex } from '@/types/financial';

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

export type HistoricalProcessedDataset = Pick<ProcessedDataset, 'financialYear' | 'observations' | 'derivedMetrics'> & {
  schemaVersion: number;
  availableEstimateStates: string[];
  [key: string]: unknown;
};

export interface HistoricalAssetIndex extends HistoricalDatasetIndex {
  datasets: Array<HistoricalDatasetIndex['datasets'][number] & { path: string; sourceManifestPath: string }>;
}

export class UnknownHistoricalFiscalYearError extends Error {
  constructor(financialYear: string) {
    super(`No historical dataset is published for FY ${financialYear}.`);
    this.name = 'UnknownHistoricalFiscalYearError';
  }
}

export class HistoricalDataLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HistoricalDataLoadError';
  }
}

type FetchAsset = (input: RequestInfo | URL) => Promise<Response>;

/** Create a cached, explicit-FY loader; each call fetches only its selected dataset. */
export function createHistoricalDatasetLoader(fetchAsset: FetchAsset, baseUrl: string) {
  const assetRoot = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}data/history/`;
  const loaded = new Map<string, HistoricalProcessedDataset>();
  const pending = new Map<string, Promise<HistoricalProcessedDataset>>();
  let indexRequest: Promise<HistoricalAssetIndex> | undefined;

  async function getIndex(): Promise<HistoricalAssetIndex> {
    if (!indexRequest) {
      indexRequest = fetchAsset(`${assetRoot}index.json`).then(async response => {
        if (!response.ok) throw new HistoricalDataLoadError(`Historical index request failed (${response.status}).`);
        const index = await response.json() as HistoricalAssetIndex;
        if (index.schemaVersion !== 1 || !Array.isArray(index.datasets)) {
          throw new HistoricalDataLoadError('Historical index has an unsupported schema.');
        }
        const years = new Set<string>();
        for (const entry of index.datasets) {
          if (!/^\d{4}-\d{2}$/.test(entry.financialYear) || years.has(entry.financialYear) ||
              !isSafeRelativeAssetPath(entry.path) || !isSafeRelativeAssetPath(entry.sourceManifestPath)) {
            throw new HistoricalDataLoadError('Historical index contains an invalid or duplicate dataset entry.');
          }
          years.add(entry.financialYear);
        }
        return index;
      }).catch(error => {
        indexRequest = undefined;
        throw error;
      });
    }
    return indexRequest;
  }

  async function load(financialYear: string): Promise<HistoricalProcessedDataset> {
    if (loaded.has(financialYear)) return loaded.get(financialYear)!;
    if (pending.has(financialYear)) return pending.get(financialYear)!;
    const request = getIndex().then(async index => {
      const entry = index.datasets.find(dataset => dataset.financialYear === financialYear);
      if (!entry) throw new UnknownHistoricalFiscalYearError(financialYear);
      const response = await fetchAsset(`${assetRoot}${entry.path}`);
      if (!response.ok) throw new HistoricalDataLoadError(`Historical dataset FY ${financialYear} request failed (${response.status}).`);
      const dataset = await response.json() as HistoricalProcessedDataset;
      if (dataset.financialYear !== financialYear || !Array.isArray(dataset.observations) || !Array.isArray(dataset.derivedMetrics)) {
        throw new HistoricalDataLoadError(`Historical dataset response does not match FY ${financialYear}.`);
      }
      loaded.set(financialYear, dataset);
      return dataset;
    }).finally(() => pending.delete(financialYear));
    pending.set(financialYear, request);
    return request;
  }

  async function loadManifest(financialYear: string): Promise<Record<string, unknown>> {
    const index = await getIndex();
    const entry = index.datasets.find(dataset => dataset.financialYear === financialYear);
    if (!entry) throw new UnknownHistoricalFiscalYearError(financialYear);
    const response = await fetchAsset(`${assetRoot}${entry.sourceManifestPath}`);
    if (!response.ok) throw new HistoricalDataLoadError(`Historical source manifest FY ${financialYear} request failed (${response.status}).`);
    const manifest = await response.json() as Record<string, unknown>;
    if (manifest.financialYear !== financialYear) {
      throw new HistoricalDataLoadError(`Historical source manifest response does not match FY ${financialYear}.`);
    }
    return manifest;
  }

  return { getIndex, load, loadManifest, getLoaded: () => [...loaded.values()] };
}

function isSafeRelativeAssetPath(path: string): boolean {
  return typeof path === 'string' && path.length > 0 && !path.startsWith('/') &&
    !path.split('/').some(segment => segment === '..' || segment === '.');
}

const historicalLoader = createHistoricalDatasetLoader(input => fetch(input), import.meta.env.BASE_URL);

export function loadHistoricalIndex(): Promise<HistoricalAssetIndex> {
  return historicalLoader.getIndex();
}

export function loadHistoricalDataset(financialYear: string): Promise<HistoricalProcessedDataset> {
  return historicalLoader.load(financialYear);
}

export function loadHistoricalSourceManifest(financialYear: string): Promise<Record<string, unknown>> {
  return historicalLoader.loadManifest(financialYear);
}

export function getLoadedHistoricalDatasets(): HistoricalProcessedDataset[] {
  return historicalLoader.getLoaded();
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
