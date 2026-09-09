# Arthrekha

**India's public finances, made visible.**

Arthrekha is an independent, editorial public-finance explorer for understanding how the Union Government of India plans, receives, spends and finances public money. It combines official fiscal data with clear explanations, interactive comparisons and inspectable provenance.

## Current experience

The current release covers the Union Government for FY 2026–27:

- Budget Estimate compared with cumulative provisional actuals through June 2026
- Budget → Reality execution instrument with April–June progression
- 44-metric fiscal registry covering receipts, expenditure, deficits, financing and federal transfers
- Understand and Analyse modes for progressive disclosure
- beginner explanations connected directly to current figures
- ₹100 composition of non-borrowed receipts
- fiscal relationship map and exact-value analytical tables
- source and calculation lineage for important values
- responsive layouts, keyboard focus and reduced-motion support

Budget Estimates come from the Ministry of Finance's *Budget at a Glance 2026–27*. Current-year execution observations come from the Controller General of Accounts and remain provisional and unaudited.

Arthrekha is not affiliated with or endorsed by the Government of India. Government financial data remains attributed to its official publishers.

## Technology

- React, TypeScript and Vite
- CSS Modules and design tokens
- Python normalization and validation pipeline
- Vitest, Testing Library and pytest

The application is static: processed, version-controlled JSON is imported at build time. No financial-data backend is required at runtime.

## Local development

Requirements:

- Node.js 18 or newer
- Python 3.10 or newer

```bash
npm install

python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements-dev.txt

npm run dev
```

The development server prints its local URL after startup.

## Validation

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
PYTHONPATH=. python3 -m pytest -q
```

To regenerate the processed dataset from the preserved structured inputs:

```bash
python3 -m pipeline.scripts.ingest
```

## Automatic source monitoring

A scheduled workflow checks the official Controller General of Accounts release index and compares it with the latest processed reporting period. A newer release creates a review request and preserves a machine-readable report as a workflow artifact. It does not replace published financial records automatically: a source adapter must first parse the official publication and pass the existing validation and reconciliation checks.

See [Automatic data refresh](docs/automatic-data-refresh.md) for the refresh flow and the local check command.

## Data methodology

Every monetary observation is normalized to ₹ crore and stores its jurisdiction, financial year, period, estimate type and source metadata. Budget Estimates and provisional actuals remain separate observation types. Arthrekha-derived ratios retain their formulas and input observation identifiers.

The current dataset is available at `datasets/processed/union/budget-summary-2026-27.json`.

Further details:

- [Data sources](docs/data-sources.md)
- [Methodology](docs/methodology.md)
- [Architecture](docs/architecture.md)
- [Current project status](docs/status.md)

## Deployment

The production site is published through GitHub Pages at [iamaritrasaha.github.io/arthrekha](https://iamaritrasaha.github.io/arthrekha/). Every successful push to `main` runs the validation suite, builds the Vite application and deploys the resulting `dist/` artifact through GitHub Actions.

To create the production bundle locally:

```bash
npm run build
```

## Current limitations

- Union Government only
- one current financial year
- provisional actuals only through June 2026
- no historical comparison series
- no state finances or ministry-level execution
- borrowing coverage is limited to financing components in the current Union Budget source, not a complete debt-stock history

## Copyright

© 2026 Aritra Saha · Foresight Labs. All rights reserved.

Official Government of India data remains the property of, and is attributed to, its respective source organizations.
