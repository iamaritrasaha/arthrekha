# Arthrekha — Project Status

**Last updated:** August 27, 2026

## ✅ Milestone 0 — Foundation (COMPLETE)

### Completed

- [x] Git repository initialized
- [x] React + TypeScript + Vite project structure
- [x] Architecture documentation (`docs/architecture.md`)
- [x] TypeScript strict mode configuration
- [x] ESLint + Prettier setup
- [x] Vitest test infrastructure
- [x] Design system with CSS custom properties
  - Indian-inspired color palette (warm neutrals, trust blue)
  - Typography scale with tabular numerals for financial figures
  - Spacing system (4px base unit)
  - Semantic colors for estimate types (BE/RE/Actual/Provisional)
- [x] Financial data type definitions
  - `FinancialObservation` — core data model
  - `DataSource` — provenance tracking
  - `EstimateType`, `JurisdictionType`, `PeriodType`
  - Support for Union + future state expansion
- [x] Core utility libraries
  - Indian number formatting (crore, lakh crore, ₹100 mode)
  - Fiscal year utilities (Apr-Mar, Q1-Q4)
  - Comprehensive test coverage
- [x] Basic app shell
  - Header with navigation
  - Footer with attribution
  - Homepage with project overview
- [x] Build verification
  - TypeScript compilation: ✅ No errors
  - Production build: ✅ 168KB (gzipped: 55KB)

## 📋 Next: Milestone 1 — Data

### Objectives

1. Identify authoritative Union Budget data source
2. Create first real dataset (Budget at a Glance recommended)
3. Implement manual data transcription with provenance
4. Build validation pipeline
5. Create data loading utilities
6. Write data transformation tests

### Key Deliverables

- `datasets/raw/` — Source documents + metadata
- `datasets/processed/union/budget-summary.json` — Normalized data
- `datasets/metadata/sources.json` — Provenance records
- `src/data/datasets.ts` — Data loading layer
- `src/data/derived.ts` — Computed metrics
- Validation that totals reconcile

### Data Strategy

For Milestone 1, we will:

1. Manually transcribe data from **Budget at a Glance** (Ministry of Finance)
2. Store full provenance for every observation
3. Validate reconciliation (parts sum to whole)
4. Build the pipeline for one complete FY (recommend FY 2025-26)
5. Include historical comparison (FY 2024-25, FY 2023-24)

This proves the architecture end-to-end before scaling.

## 🎯 Subsequent Milestones

- **M2: Core UI** — NumberDisplay, ExplainTerm, ProvenanceCard components
- **M3: Union Overview** — Expenditure, receipts, deficit visualization
- **M4: Execution** — Budget vs reality tracking
- **M5: Debt** — Debt data + quarterly trends
- **M6: History** — Multi-year trend explorer
- **M7: Hardening** — Accessibility, responsive, performance, CI/CD

## 🧪 Test Status

- Utility tests: Written (formatting, fiscal year math)
- TypeScript: Strict mode, all files type-safe
- Build: Production-ready

Run tests: `npm test`
Run typecheck: `npm run typecheck`
Run build: `npm run build`
Run dev: `npm run dev`

## 📚 Documentation

- `README.md` — Project overview
- `docs/architecture.md` — Technical architecture
- `docs/status.md` — This file

## 🔗 Official Data Sources (Planned)

1. Ministry of Finance — Union Budget documents
2. Controller General of Accounts — Monthly execution data
3. Reserve Bank of India — Debt statistics
4. CSO/MOSPI — GDP reference values

## 🚀 Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run typecheck    # TypeScript validation
npm run test         # Run test suite
npm run lint         # ESLint check
```

## 📝 Notes

- All amounts stored internally in **₹ crore**
- Financial year: **April 1 to March 31**
- Strict TypeScript enforced throughout
- No fake data policy: every number must be traceable
- Design system: editorial + analytical + calm
- Mobile-first responsive design
- WCAG accessibility conscious
