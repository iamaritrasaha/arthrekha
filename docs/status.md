# Arthrekha — Project Status

**Last updated:** 27 August 2026

## Milestones

- Milestone 0 — foundation: complete
- Milestone 1 — validated current-year data pipeline: complete
- Milestone 2 — Budget → Reality editorial experience: complete
- Milestone 2.5 — brand and glass polish: complete
- Milestone 2.6 / 2.6.1 — signature visuals, motion and alignment: complete
- Milestone 3 — Deep Finance, Soft Geometry & Living Data: complete

## Milestone 3 result

- 44-metric FY 2026–27 Union Budget registry, up from 10 core metrics
- 74 normalized observations and 17 explicit derived metrics
- official Budget-at-a-Glance PDF preserved in the truth layer
- corrected official Budget Estimate values and clarified total receipts vs non-borrowed receipts
- six fiscal domains with explicit hierarchy and classification safety
- progressive four-level explanations for every metric
- reusable Understand / Analyse state
- meaningful `/explore`, `/learn` and `/sources` routes
- receipts-to-deficit-to-borrowing relationship visualization
- professional exact-value analytical table
- evidence trace from official publication to displayed value
- floating soft-glass navigation and rounded visual language
- route-level code splitting and reduced-motion support

## Current coverage

- Jurisdiction: Union Government of India
- Financial year: FY 2026–27
- Annual plan: Ministry of Finance Budget Estimates
- Latest execution: CGA provisional actuals through June 2026
- Historical data: not yet included
- State data: not yet included

## Trust constraints

- No fake fiscal values
- Missing data is never displayed as ₹0
- Budget Estimates and provisional actuals remain different observation types
- CGA progression is cumulative YTD; monthly flows are not inferred
- Source and derived values are visibly distinguished
- Political judgments and speculative forecasts remain out of scope

## Validation commands

```bash
npm run typecheck
npm test -- --run
PYTHONPATH=. pytest -q
npm run lint
npm run build
```

Exact counts and browser verification are recorded in `docs/milestone-3-report.md`.
