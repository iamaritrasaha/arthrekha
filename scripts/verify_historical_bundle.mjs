import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const assetRoot = join(dist, 'data', 'history');
const bundleDirectory = join(dist, 'assets');
const index = JSON.parse(readFileSync(join(assetRoot, 'index.json'), 'utf8'));
if (index.schemaVersion !== 1 || !Array.isArray(index.datasets)) {
  throw new Error('Built historical index is missing or invalid.');
}

const bundles = readdirSync(bundleDirectory)
  .filter(name => name.endsWith('.js'))
  .map(name => ({ name, content: readFileSync(join(bundleDirectory, name), 'utf8'), size: statSync(join(bundleDirectory, name)).size }));
const forbiddenHistoricalPayloads = [
  'union-interim-budget-2024-25-be-2024-02-01',
  'union-full-budget-2024-25-be-2024-07-23',
  'union-budget-2025-26-original-be-2025-02-01',
  'union-finance-accounts-2024-25-final',
  'union-provisional-accounts-2025-26-2026-03-31',
];
for (const bundle of bundles) {
  for (const sentinel of forbiddenHistoricalPayloads) {
    if (bundle.content.includes(sentinel)) {
      throw new Error(`Historical dataset payload was bundled into ${bundle.name}: ${sentinel}`);
    }
  }
}

for (const entry of index.datasets) {
  const dataPath = join(assetRoot, entry.path);
  const manifestPath = join(assetRoot, entry.sourceManifestPath);
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (data.financialYear !== entry.financialYear || manifest.financialYear !== entry.financialYear) {
    throw new Error(`Published historical asset year mismatch for ${entry.financialYear}.`);
  }
}

const initialBundle = bundles.reduce((largest, current) => current.size > largest.size ? current : largest);
console.log(`Historical bundle boundary verified: ${index.datasets.length} FY data assets are external; largest JS asset is ${initialBundle.name} (${initialBundle.size} bytes).`);
