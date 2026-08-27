# Arthrekha — Architecture

## 1. System Overview

Arthrekha is composed of two primary subsystems:

1. **Data Pipeline** (Python) — acquires, parses, normalizes, validates, and outputs application-ready JSON datasets from official Indian government sources.
2. **Web Application** (React + TypeScript + Vite) — renders those datasets as interactive, educational visualizations with full provenance.

```
Official Sources (PDFs, CSVs, APIs)
        │
        ▼
  ┌─────────────┐
  │  Pipeline    │  Python
  │  (offline)   │
  └──────┬──────┘
         │ JSON files
         ▼
  ┌─────────────┐
  │  datasets/   │  Version-controlled processed data
  │  processed/  │
  └──────┬──────┘
         │ imported at build time
         ▼
  ┌─────────────┐
  │  Web App     │  React + TypeScript + Vite
  │  (static)    │
  └─────────────┘
```

No runtime server. The web app is fully static — imports pre-processed JSON at build time.

- No API keys or backend at runtime
- Excellent performance (data bundled or lazy-loaded)
- Verifiable: users can inspect the exact data powering each chart
- Deployable anywhere (Vercel, Netlify, GitHub Pages, Cloudflare Pages)

---

## 2. Data Model

### 2.1 Core Financial Observation

Every data point is a **Financial Observation** — a single measurement of a fiscal metric at a specific time, for a specific jurisdiction, from a specific source.

All amounts stored internally in **₹ crore**. Display formatting (lakh crore, % of GDP, etc.) happens at render time.

```typescript
interface FinancialObservation {
  id: string;                          // Deterministic hash
  jurisdiction: string;                // "india" | "west-bengal"
  jurisdictionType: JurisdictionType;  // "union" | "state" | "ut"
  financialYear: string;               // "2025-26"
  period?: string;                     // "apr-jul" | "q1" | "full-year"
  periodType: PeriodType;
  metric: string;                      // "total-expenditure"
  category?: string;                   // "ministry-of-defence"
  subcategory?: string;
  amount: number;                      // Always in ₹ crore
  unit: "crore";
  currency: "INR";
  estimateType: EstimateType;          // "BE" | "RE" | "actual" | "provisional"
  source: DataSource;
}
```

### 2.2 Key Types

```typescript
type JurisdictionType = "union" | "state" | "ut";
type PeriodType = "annual" | "quarterly" | "monthly" | "cumulative" | "ytd";
type EstimateType = "BE" | "RE" | "actual" | "provisional";
type DataStatus = "final" | "provisional" | "estimated" | "derived";
```

### 2.3 Provenance

```typescript
interface DataSource {
  organization: string;        // "Ministry of Finance"
  document: string;            // "Union Budget 2025-26"
  url?: string;
  table?: string;              // "Statement 1" or page number
  publishedAt?: string;        // ISO date
  retrievedAt: string;         // ISO date
  dataStatus: DataStatus;
  notes?: string;
  definition?: string;         // What this metric means per the source
}
```

---

## 3. Data Pipeline

```
pipeline/
├── sources/          # Source registry: URLs, formats, update frequency
├── parsers/          # Format-specific: PDF tables, CSV, Excel
├── normalizers/      # Raw fields → FinancialObservation schema
├── validators/       # Reconciliation, bounds, completeness
└── scripts/          # Orchestration
```

### Output Structure

```
datasets/processed/
├── union/
│   ├── budget-summary.json
│   ├── expenditure-by-ministry.json
│   ├── receipts-composition.json
│   └── deficit-history.json
└── metadata/
    ├── sources.json
    ├── gdp.json
    └── glossary.json
```

---

## 4. Frontend Architecture

### 4.1 Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React 18+ | Component model, ecosystem |
| Language | TypeScript (strict) | Type safety for financial data |
| Build | Vite | Fast dev, optimized builds |
| Routing | React Router | Lazy loading |
| Styling | CSS Modules + CSS Custom Properties | Scoped styles, design tokens |
| Charts | Recharts + custom SVG | Standard + specialized |
| Testing | Vitest + Testing Library | Vite-native |

### 4.2 Routes

```
/                        Homepage — editorial story
/india                   Union overview
/india/budget            Budget allocation
/india/spending          Expenditure analysis
/india/revenue           Receipts
/india/debt              Debt experience
/india/deficit           Deficit explanation
/india/history           Multi-year trends
/learn                   Glossary + concepts
/sources                 Provenance + methodology
```

### 4.3 Key Components

- `NumberDisplay` — ₹ crore / lakh crore formatting
- `ExplainTerm` — Contextual term education (tooltip + expandable)
- `ProvenanceCard` — Source attribution
- `EstimateTypeBadge` — BE/RE/Actual/Provisional indicator
- `ChartExplainer` — Three-level chart explanation
- `HundredRupeeChart` — ₹100 mode visualization

### 4.4 Data Flow

```
datasets/processed/*.json
   → data/datasets.ts (loads + validates typed data)
   → data/derived.ts (computes rates, ratios, comparisons)
   → features/*/hooks.ts (feature-specific transforms)
   → charts/*.tsx (render with formatting + a11y)
   → ProvenanceCard (source attribution)
```

---

## 5. Design System

### 5.1 Principles

- **Editorial, not dashboard** — Pages tell stories
- **Typography-first** — Beautiful numbers, clear hierarchy
- **Restrained palette** — Calm, professional
- **Indian without cliché** — No saffron/green themes
- **Progressive disclosure** — Not overwhelm

### 5.2 Design Tokens

Warm neutrals for surfaces, trust-blue accent, semantic colors for estimate types. Inter typeface with tabular numerals. Full CSS custom property token system.

### 5.3 Typography Scale

Display (48px, 700) → H1 (32px, 700) → H2 (24px, 600) → H3 (20px, 600) → Body (16px, 400) → Small (14px, 400) → Caption (12px, 500)

---

## 6. V1 Data Sources

| Source | Data | Phase |
|--------|------|-------|
| Budget at a Glance (MoF) | Summary receipts, expenditure, deficit | M1 |
| Expenditure Budget Vol 1 | Ministry allocations | M3 |
| CGA Monthly Accounts | Execution tracking | M4 |
| RBI Handbook on Statistics | Debt, interest | M5 |
| CSO/MOSPI | GDP reference values | M1 |

### Data Entry Strategy

For V1: manually transcribe data from official Budget at a Glance tables with full provenance, validated by reconciliation checks. This is more trustworthy than fragile PDF scraping. Parser infrastructure built for future automation.

---

## 7. Performance

- Static data at build time
- Route-level code splitting
- Chart lazy loading
- Memoized derived computations
- Vite optimization (minification, tree-shaking)

---

## 8. Testing

| Layer | Tool |
|-------|------|
| Data pipeline | pytest |
| Financial calcs | Vitest |
| Components | Vitest + RTL |
| Types | TypeScript strict |
| Build | Vite build |
| Lint | ESLint |

---

## 9. Deployment

Static site → Vercel / Cloudflare Pages.

CI: TypeScript + ESLint + Vitest + dataset validation + build.
