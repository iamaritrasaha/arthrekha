import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

// https://vitejs.dev/config/
const repositoryRoot = process.cwd()

function historicalDataAssets(): Plugin {
  const indexPath = path.resolve(repositoryRoot, 'datasets/metadata/historical-index.json')
  const readIndex = () => {
    const index = JSON.parse(readFileSync(indexPath, 'utf8')) as {
      schemaVersion: number;
      datasets: Array<{ financialYear: string; path: string; sourceManifestPath: string }>;
    }
    if (index.schemaVersion !== 1 || !Array.isArray(index.datasets)) {
      throw new Error('Historical dataset index must use schemaVersion 1 and contain datasets.')
    }
    const years = new Set<string>()
    for (const entry of index.datasets) {
      if (!/^\d{4}-\d{2}$/.test(entry.financialYear) || years.has(entry.financialYear) ||
          !isSafeAssetPath(entry.path) || !isSafeAssetPath(entry.sourceManifestPath)) {
        throw new Error(`Invalid or duplicate historical index entry for FY ${entry.financialYear}.`)
      }
      years.add(entry.financialYear)
    }
    return index
  }

  const getAsset = (urlPath: string): { content: string; contentType: string } | undefined => {
    const index = readIndex()
    if (urlPath === '/data/history/index.json') {
      return { content: JSON.stringify(index), contentType: 'application/json; charset=utf-8' }
    }
    const entry = index.datasets.find(item => `/${item.path}` === urlPath || `/${item.sourceManifestPath}` === urlPath)
    if (!entry) return undefined
    const isManifest = urlPath === `/${entry.sourceManifestPath}`
    const sourcePath = isManifest
      ? path.resolve(repositoryRoot, 'datasets/metadata/source-manifests', `${entry.financialYear}.json`)
      : path.resolve(repositoryRoot, 'datasets/processed/union/history', `${entry.financialYear}.json`)
    return { content: readFileSync(sourcePath, 'utf8'), contentType: 'application/json; charset=utf-8' }
  }

  return {
    name: 'arthrekha-historical-data-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const urlPath = request.url?.split('?')[0]
        if (!urlPath?.startsWith('/data/history/')) return next()
        try {
          const asset = getAsset(urlPath)
          if (!asset) {
            response.statusCode = 404
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.end(JSON.stringify({ error: 'Historical asset not found.' }))
            return
          }
          response.statusCode = 200
          response.setHeader('Content-Type', asset.contentType)
          response.end(asset.content)
        } catch (error) {
          next(error instanceof Error ? error : new Error(String(error)))
        }
      })
    },
    generateBundle() {
      const index = readIndex()
      for (const entry of index.datasets) {
        const processed = getAsset(`/${entry.path}`)
        const manifest = getAsset(`/${entry.sourceManifestPath}`)
        if (!processed || !manifest) throw new Error(`Missing published historical assets for FY ${entry.financialYear}.`)
        this.emitFile({ type: 'asset', fileName: `data/history/${entry.path}`, source: processed.content })
        this.emitFile({ type: 'asset', fileName: `data/history/${entry.sourceManifestPath}`, source: manifest.content })
      }
      this.emitFile({ type: 'asset', fileName: 'data/history/index.json', source: JSON.stringify(index, null, 2) + '\n' })
    },
  }
}

function isSafeAssetPath(assetPath: string): boolean {
  return typeof assetPath === 'string' && assetPath.length > 0 && !assetPath.startsWith('/') &&
    !assetPath.split('/').some(segment => segment === '..' || segment === '.')
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/arthrekha/' : '/',
  plugins: [react(), historicalDataAssets()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@charts': path.resolve(__dirname, './src/charts'),
      '@features': path.resolve(__dirname, './src/features'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@data': path.resolve(__dirname, './src/data'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
      '@content': path.resolve(__dirname, './src/content'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
