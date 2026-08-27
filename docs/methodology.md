# Arthrekha — Methodology

## Principles

1. Preserve the official source.
2. Attach provenance to every observation.
3. Keep accounting concepts and periods explicit.
4. Fail visibly instead of inventing zeroes.
5. Label every Arthrekha calculation.
6. Explain without changing the underlying definition.

## Pipeline

```text
official PDF / monthly source
  → preserved raw document
  → structured raw JSON
  → canonical metric validation
  → normalized FinancialObservation
  → reconciliation and derived metrics
  → application-ready JSON
```

The Budget PDF is transcribed into structured JSON with metric-level table references. Manual structured extraction is deliberate: the official tables are compact, and reviewable transcription is currently safer than an opaque PDF scraper. The raw PDF remains in the repository for verification.

## Units, periods and observation types

- Canonical monetary unit: ₹ crore
- FY 2026–27: 1 April 2026 to 31 March 2027
- Budget Estimate: annual plan
- CGA actual: cumulative provisional observation through a stated month
- April, May and June points: YTD observations, not independent monthly flows

The frontend may format large values in lakh crore, but exact crore values remain available in analysis and provenance views.

## Taxonomy and hierarchy

The 44-metric registry assigns every metric a domain and a classification type. Parent-child relationships describe an accounting hierarchy without implying that every visible child is a complete additive decomposition.

Classification types are:

- aggregate
- component
- deduction
- financing source
- transfer
- denominator

This prevents invalid comparisons and invalid ₹100 compositions. `total_receipts` includes borrowing in the official statement. `non_borrowed_receipts` is an explicit derived aggregate used where a receipt composition excluding financing is required.

## Reconciliation

The ingestion pipeline checks four identities within source rounding tolerance:

```text
Revenue receipts = tax revenue net to Centre + non-tax revenue
Non-borrowed receipts = revenue receipts + non-debt capital receipts
Total expenditure = revenue expenditure + capital expenditure
Total receipts including borrowing = revenue receipts + capital receipts
```

Fiscal deficit is not forced through a simplified UI equation when the available components do not support the full official accounting definition.

## Derived metrics

Seventeen derived metrics are generated:

- ten execution rates: `actual YTD ÷ annual BE × 100`
- fiscal, revenue, effective revenue and primary deficit as a share of nominal GDP
- capital expenditure as a share of total expenditure
- effective capital expenditure as a share of total expenditure
- interest payments as a share of revenue receipts

Every derived record stores its formula and inputs and is labelled as calculated by Arthrekha. Compatibility is declared in the registry; the UI does not calculate arbitrary ratios.

## Explanation model

Each registered metric has four levels:

1. **Short** — a one-line orientation
2. **Simple** — a beginner explanation
3. **Why it matters** — the analytical consequence
4. **Technical** — classification, scope and caveats

Understand and Analyse modes use the same observation and definition. Analyse reveals exact values, classifications, formulas, ratios and a domain table; it does not switch to a different dataset.

## Provenance model

The evidence interface follows the truthful stages that apply to the selected value:

```text
official publication
  → preserved raw record
  → normalized observation
  → optional derived calculation
  → displayed value
```

For a direct source value, the derivation stage is omitted. The interface exposes organization, document, table/page, publication, retrieval, period, observation type, status and official link.

## Current output

`datasets/processed/union/budget-summary-2026-27.json` contains:

- 74 normalized observations
- 44 annual Budget Estimate observations
- 30 CGA provisional observations across April, May and June
- 17 derived metrics
- latest actual period `apr-jun`

## Known methodological limits

- One current financial year only
- No audited CAG actuals yet
- No historical comparability layer yet
- No external debt stock or maturity profile
- No inferred monthly flows
- Selected detailed Budget metrics, not every line in every Union Budget statement

## Reproduce

```bash
python -m pipeline.scripts.ingest
npm run typecheck
npm test -- --run
pytest -q
npm run lint
npm run build
```

**Last updated:** 27 August 2026
