# Milestone 3 — Deep Finance, Soft Geometry & Living Data

## Outcome

Arthrekha now opens the current Union fiscal system beyond ten headline values. The homepage remains the approachable Budget → Reality story; Explore provides a relationship-first deep-finance experience, Learn explains the concepts progressively, and Sources exposes the evidence pipeline.

## Data expansion

- Registry: 10 → 44 official FY 2026–27 metrics
- Observations: 40 → 74
- Derived metrics: 10 → 17
- Domains: receipts, expenditure, deficit, debt and borrowing, federal finance, government accounts

The official Ministry of Finance Budget at a Glance 2026–27 PDF is preserved locally. Budget Estimate values were verified against its tables. The previously ambiguous receipt aggregate is now split into official total receipts including borrowing and Arthrekha-derived non-borrowed receipts.

## Product expansion

- Understand / Analyse mode with one shared selected metric
- conceptual fiscal-flow visualization
- domain and metric exploration
- exact crore values, current compatible actuals and ratios
- analytical domain table
- progressive explanation hierarchy
- source catalogue and evidence pipeline
- government-account concept education

## Visual system

The existing ink/mineral identity now uses more consistent soft geometry: a floating rounded navigation rail, rounded controls and tables, quiet editorial fields and localized glass. Large article sections remain open rather than becoming a card wall.

## Validation

- Pipeline ingestion: 74 valid, 0 invalid; four reconciliations passed
- TypeScript: passed with no errors
- Vitest: 43 passed, 0 failed, 0 skipped across 5 files
- pytest: 12 passed, 0 failed, 0 skipped
- ESLint: passed with zero warnings
- Production build: passed; 68 modules transformed
- Main JavaScript: 286.96 kB / 76.22 kB gzip
- Route chunks: Explore 11.20 kB / 3.98 kB gzip; Learn 4.38 kB / 1.83 kB gzip; Sources 3.21 kB / 1.25 kB gzip

Browser inspection was performed at 1440 × 900, 768 × 900 and 390 × 844. The homepage, Explore, Learn, Sources, analytical mode, mobile Budget → Reality instrument and mobile provenance sheet were inspected. There was no document-level horizontal overflow at any width and a fresh reload produced zero console errors. Native buttons, pressed states and the branded visible focus treatment were verified. Reduced-motion media rules remove transitions and the number animation resolves immediately when the preference is active.

## Known limits

- current FY only
- Union Government only
- CGA actuals only through June 2026
- debt view is limited to FY 2026–27 Budget financing components
- no audited actuals, historical trends, states or ministry execution yet
