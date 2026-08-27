# Arthrekha — Architecture

## System shape

Arthrekha is a static React application backed by a reproducible Python data pipeline. There is no runtime financial-data API and no backend database.

```text
Official Government of India publications
        ↓
preserved source files + structured raw records
        ↓
Python parse → normalize → validate → derive
        ↓
datasets/processed/union/budget-summary-2026-27.json
        ↓
typed selectors + metric registry
        ↓
React editorial stories, analysis and provenance
```

All monetary observations are stored in ₹ crore. Formatting into crore or lakh crore happens only in the presentation layer.

## Truth layer

`FinancialObservation` is the atomic record. Besides amount, period and estimate type, each record may carry semantic safety metadata:

- `definitionId`
- `coverage`
- `classificationType`
- `parentMetric`
- `debtCategory`
- `ratioDenominator`

The metadata prevents the interface from treating an aggregate, component, deduction, transfer, financing source or denominator as though they were interchangeable.

The source object stores the official organization and document, URL, table/page reference, publication and retrieval dates, definition, status and notes. Source values and Arthrekha-derived observations are explicitly distinguished.

## Metric registry

The registry is implemented in both `pipeline/metrics.py` and `src/data/metricDefinitions.ts`. It currently defines 44 Union fiscal metrics across six domains:

1. receipts
2. expenditure
3. deficit
4. debt and borrowing
5. federal finance
6. government accounts

Each frontend definition provides stable identity, hierarchy, accounting classification, compatible ratios, related metrics, caveats and four explanation levels: short, simple, why it matters and technical.

## Frontend data flow

```text
processed JSON
  → src/data/datasets.ts
  → src/data/selectors.ts
  → src/data/metricDefinitions.ts + src/data/domains.ts
  → visual and educational primitives
```

JSX does not parse official source formats. Reusable selectors resolve Budget Estimates, latest provisional actuals, monthly/YTD progression, execution rates, ratios, domains and provenance. Missing observations stay `null`; they never become plausible-looking zeroes.

## Information architecture

| Route | Role |
| --- | --- |
| `/` | Current-year editorial Budget → Reality story |
| `/explore` | Deep fiscal explorer with Understand and Analyse modes |
| `/learn` | Progressive public-finance explanations and account concepts |
| `/sources` | Source catalogue, methodology and evidence pipeline |

The deeper routes are lazy-loaded. Understand and Analyse share one selected metric and data context; the mode changes density, not truth.

## Reusable visual system

The interface uses CSS Modules and design tokens for soft geometry, optical glass elevations, calm ink/mineral surfaces, analytical micro-labels and data motion. Reusable primitives include:

- fiscal flow relationship map
- metric table
- mode switch
- fiscal-year trace
- editorial section header
- progressive explanation disclosure
- evidence/source trace
- Indian financial-number formatting

Motion uses CSS and `requestAnimationFrame` rather than a new animation dependency. Reduced-motion users receive immediate final states.

## Testing and delivery

- TypeScript strict typecheck
- Vitest and Testing Library for selectors, registry and UI state
- pytest for parsing, validation, registry and official values
- ESLint with zero warnings
- Vite production build
- browser inspection at desktop, tablet and mobile widths

Processed datasets and source metadata are version-controlled so any displayed value can be tied to the exact source record and code revision.
