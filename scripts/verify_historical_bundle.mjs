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
const historicalIdentitySentinels = new Set();
for (const entry of index.datasets) {
  const dataPath = join(assetRoot, entry.path);
  const manifestPath = join(assetRoot, entry.sourceManifestPath);
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (data.financialYear !== entry.financialYear || manifest.financialYear !== entry.financialYear) {
    throw new Error(`Published historical asset year mismatch for ${entry.financialYear}.`);
  }
  if (!Array.isArray(data.observations) || data.observations.some(observation => observation.financialYear !== entry.financialYear)) {
    throw new Error(`Historical observation FY mismatch for ${entry.financialYear}.`);
  }
  if (!Array.isArray(manifest.sources) || !Array.isArray(manifest.requiredSourceReleases)) {
    throw new Error(`Historical source manifest is incomplete for ${entry.financialYear}.`);
  }
  for (const observation of data.observations) {
    if (observation.identityVersion !== 2) {
      throw new Error(`Historical observation does not use identity v2: ${entry.financialYear}/${observation.metric}.`);
    }
    historicalIdentitySentinels.add(observation.id);
  }
  for (const source of manifest.sources) {
    historicalIdentitySentinels.add(source.releaseId);
    historicalIdentitySentinels.add(source.sourceHash);
  }
}

for (const bundle of bundles) {
  for (const sentinel of historicalIdentitySentinels) {
    if (bundle.content.includes(sentinel)) {
      throw new Error(`Historical dataset payload was bundled into ${bundle.name}: ${sentinel}`);
    }
  }
}

const initialBundle = bundles.reduce((largest, current) => current.size > largest.size ? current : largest);
console.log(`Historical bundle boundary verified: ${index.datasets.length} FY data assets are external; largest JS asset is ${initialBundle.name} (${initialBundle.size} bytes).`);
