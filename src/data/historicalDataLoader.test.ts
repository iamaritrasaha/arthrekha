import { describe, expect, it, vi } from 'vitest';
import {
  createHistoricalDatasetLoader,
  HistoricalDataLoadError,
  UnknownHistoricalFiscalYearError,
} from '@/data/budgetData';

const index = {
  schemaVersion: 1,
  datasets: [
    { financialYear: '2021-22', path: '2021-22.json', sourceManifestPath: 'manifests/2021-22.json' },
    { financialYear: '2022-23', path: '2022-23.json', sourceManifestPath: 'manifests/2022-23.json' },
    { financialYear: '2023-24', path: '2023-24.json', sourceManifestPath: 'manifests/2023-24.json' },
    { financialYear: '2024-25', path: '2024-25.json', sourceManifestPath: 'manifests/2024-25.json' },
    { financialYear: '2025-26', path: '2025-26.json', sourceManifestPath: 'manifests/2025-26.json' },
  ],
};

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as Response;

const dataset = (financialYear: string) => ({
  schemaVersion: 1,
  financialYear,
  observations: [],
  derivedMetrics: [],
  availableEstimateStates: ['BE'],
});

describe('Historical Dataset Loader', () => {
  it('loads only the explicitly requested FY from the index and caches each dataset independently', async () => {
    const urls: string[] = [];
    const fetchAsset = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith('/index.json')) return response(index);
      if (url.endsWith('/2025-26.json')) return response(dataset('2025-26'));
      if (url.endsWith('/2024-25.json')) return response(dataset('2024-25'));
      return response({}, 404);
    });
    const loader = createHistoricalDatasetLoader(fetchAsset, '/arthrekha/');

    expect((await loader.load('2025-26')).financialYear).toBe('2025-26');
    expect(urls).toEqual(['/arthrekha/data/history/index.json', '/arthrekha/data/history/2025-26.json']);
    expect((await loader.load('2024-25')).financialYear).toBe('2024-25');
    expect(urls[urls.length - 1]).toBe('/arthrekha/data/history/2024-25.json');
    expect(urls).not.toContain('/arthrekha/data/history/2023-24.json');
    expect((await loader.load('2025-26')).financialYear).toBe('2025-26');
    expect(urls.filter(url => url.endsWith('/2025-26.json'))).toHaveLength(1);
  });

  it('rejects unknown years and never falls back to another FY', async () => {
    const urls: string[] = [];
    const fetchAsset = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      return response(index);
    });
    const loader = createHistoricalDatasetLoader(fetchAsset, '/');

    await expect(loader.load('2020-21')).rejects.toBeInstanceOf(UnknownHistoricalFiscalYearError);
    expect(urls).toEqual(['/data/history/index.json']);
  });

  it('loads each newly indexed year only when requested', async () => {
    const urls: string[] = [];
    const fetchAsset = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith('/index.json')) return response(index);
      const match = url.match(/\/(20\d\d-\d\d)\.json$/);
      return match ? response(dataset(match[1]!)) : response({}, 404);
    });
    const loader = createHistoricalDatasetLoader(fetchAsset, '/');

    expect((await loader.load('2023-24')).financialYear).toBe('2023-24');
    expect(urls).toEqual(['/data/history/index.json', '/data/history/2023-24.json']);
    expect((await loader.load('2022-23')).financialYear).toBe('2022-23');
    expect(urls.slice(-1)).toEqual(['/data/history/2022-23.json']);
    expect(urls).not.toContain('/data/history/2021-22.json');
  });

  it('fails explicitly when an indexed historical asset is unavailable', async () => {
    const fetchAsset = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/index.json')) return response(index);
      return response({}, 404);
    });
    const loader = createHistoricalDatasetLoader(fetchAsset, '/');

    await expect(loader.load('2024-25')).rejects.toBeInstanceOf(HistoricalDataLoadError);
    expect(fetchAsset).toHaveBeenCalledTimes(2);
  });

  it('resolves the matching source manifest through the same fiscal-year index', async () => {
    const urls: string[] = [];
    const fetchAsset = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith('/index.json')) return response(index);
      if (url.endsWith('/manifests/2024-25.json')) return response({ financialYear: '2024-25', sources: [] });
      return response({}, 404);
    });
    const loader = createHistoricalDatasetLoader(fetchAsset, '/');

    expect(await loader.loadManifest('2024-25')).toEqual({ financialYear: '2024-25', sources: [] });
    expect(urls).toEqual(['/data/history/index.json', '/data/history/manifests/2024-25.json']);
  });
});
