<div align="center">

# ARTHREKHA · অর্থরেখা
### India's public finances, made visible.

[![Production Build](https://img.shields.io/badge/build-passing-2ea44f?style=flat-square&logo=githubactions&logoColor=white)](https://iamaritrasaha.github.io/arthrekha/)
[![Python Tests](https://img.shields.io/badge/python%20tests-34%2F34%20passing-388bfd?style=flat-square&logo=python&logoColor=white)](run_tests.py)
[![Vitest](https://img.shields.io/badge/vitest-53%2F53%20passing-388bfd?style=flat-square&logo=vitest&logoColor=white)](src/)
[![TypeScript](https://img.shields.io/badge/typescript-strict%205.5-3178c6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.json)
[![Audit](https://img.shields.io/badge/audit%20status-verified%20%26%20closed-0969da?style=flat-square)](AUDIT.md)
[![Fiscal Year](https://img.shields.io/badge/fiscal%20year-FY%202026--27-f0883e?style=flat-square)](datasets/raw/union_budget_2026-27_be.json)
[![License](https://img.shields.io/badge/license-MIT-gray?style=flat-square)](LICENSE)

<br />

**[Explore Live Demo →](https://iamaritrasaha.github.io/arthrekha/)** &nbsp;|&nbsp; **[Read Audit Report →](AUDIT.md)** &nbsp;|&nbsp; **[Data Pipeline Guide →](PIPELINE_README.md)** &nbsp;|&nbsp; **[Documentation →](docs/)**

<br />

<p align="center">
  <em>An independent, editorial-grade public finance explorer translating the Union Government of India's ₹53.5 lakh crore master plan into a living, responsive, and verifiable financial system.</em>
</p>

---

</div>

<br />

## The Vision

India’s Union Budget is a **₹53.5 lakh crore ($>\$640\text{B}$)** master plan for more than 1.4 billion people. Yet, public finance is traditionally communicated through static annual speeches, 500-page unstructured PDFs, and opaque accounting conventions. Once the budget is presented in Parliament on February 1st, citizens, researchers, and journalists have had no transparent, real-time way to observe how this plan translates into cumulative provisional reality across the fiscal year.

**Arthrekha** bridges this trust boundary:
- **From Annual Plan to Living Reality**: Side-by-side juxtaposition of official annual Budget Estimates (BE) beside provisional cumulative actuals from the Controller General of Accounts (CGA).
- **Zero Black Boxes**: Every single rupee traces to a machine-verifiable source document, physical PDF page, table row, and mathematical formula.
- **Cognitive Accessibility**: Progressive disclosure across four levels of explanation (*Simple, Why It Matters, Technical, Caveats*) paired with native bilingual accessibility in English and Bengali.

---

## Flagship Features

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ARTHREKHA AT A GLANCE                                │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ TOTAL EXPENDITURE        │ FISCAL DEFICIT           │ REVENUE RECEIPTS                 │
│ ₹53,47,315 cr (Plan)     │ ₹16,95,768 cr (Plan)     │ ₹35,33,150 cr (Plan)             │
│ ₹17,61,853 cr (Actual)   │ ₹4,55,144 cr (Actual)    │ ₹12,67,573 cr (Actual)           │
│ 32.9% executed YTD       │ 26.8% recorded YTD       │ 35.9% recorded YTD               │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### 1. The Budget → Reality Instrument
The flagship execution instrument provides an unambiguous window into public money in motion. It plots the annual Budget Estimate against provisional cumulative actuals recorded through the latest reporting period (**Through July 2026**). Interactive timeline traces visualize month-by-month cumulative pacing without ever fabricating unrecorded monthly flows.

### 2. The ₹100 Additive Rupee Engine
Where does the Union Government’s non-borrowed money come from? Arthrekha renders a strictly additive, 100% composition of incoming non-borrowed resources:
- **Net Tax Revenue**: **₹78.50** per ₹100 (₹28,62,492 cr)
- **Non-Tax Revenue**: **₹18.25** per ₹100 (₹6,66,228 cr)
- **Non-Debt Capital Receipts**: **₹3.25** per ₹100 (₹1,18,397 cr)
- *Total Non-Borrowed Receipts*: **₹100.00** (₹36,51,547 cr)  
Borrowings and other liabilities (₹16,95,768 cr) are deliberately isolated outside this ₹100 to prevent confusing debt financing with genuine revenue.

### 3. 43 + 1 Deep Metric Taxonomy
Arthrekha classifies 44 Budget Estimate metrics into five intuitive navigation domains:
- 📥 **Receipts (Money In)**: 15 metrics (Corporation Tax, Income Tax, GST, Customs, Non-Tax Revenue, Loan Recoveries...)
- 📤 **Expenditure (Money Out)**: 12 metrics (Revenue Exp, Capital Exp, Effective Capital Exp, Subsidies, Defence, Pensions...)
- ⚖️ **Fiscal Balance (Deficit)**: 4 metrics (Fiscal Deficit, Revenue Deficit, Effective Revenue Deficit, Primary Deficit)
- 🏦 **Debt & Borrowing (Financing)**: 6 metrics (Market Borrowings, T-Bills, Small Savings Securities, External Debt...)
- 🏛️ **Federal Finance (Union → States)**: 6 metrics (Tax Devolution, Centrally Sponsored Schemes, FC Grants...)
- 📊 **Analytical Context Denominator**: The 44th metric (**Nominal GDP: ₹3,93,00,393 cr**) is strictly classified as an analytical denominator (`classificationType: "denominator"`, `domain: "accounts"`) to power verified macroeconomic ratios (Fiscal Deficit/GDP: **4.31%**) without polluting the fiscal-flow rail.

### 4. Machine-Verifiable Truth Layer
Unlike portals that rely on opaque scraping or manual spreadsheets, Arthrekha introduces an automated layout verification engine:
- Every metric in `datasets/raw/` is bound to a machine-verifiable source specification ([source_evidence_2026_27.json](pipeline/fixtures/source_evidence_2026_27.json)).
- The automated verifier ([source_verifier.py](pipeline/source_verifier.py)) uses layout-preserving extraction (`pdftotext -layout`) to verify the printed folio, semantic row context, and exact number directly against the official Ministry of Finance PDF.
- Proven with **5 negative regression tests** demonstrating that verification strictly rejects wrong rows on the same page, swapped accounting duplicates (e.g. Fiscal Deficit vs Borrowings), wrong PDF folios, or tampered amounts.

### 5. Authentic Bilingual Experience
Public finance belongs to everyone. Arthrekha offers native dual-language interfaces in **English** (`en-IN`) and **Bengali** (`bn-IN`):
- Accurate fiscal terminology: Distinguishes Fiscal Deficit (**"রাজকোষ ঘাটতি"**) from Revenue Deficit (**"রাজস্ব ঘাটতি"**).
- Zero template leaks: No unparsed template tags, `NaN`, or `undefined` states.
- Audited with headless Chrome DevTools Protocol (CDP) for flawless typography and DOM execution.

### 6. Zero-Latency Static Architecture
Arthrekha has **no database or runtime API server**. The entire validated fiscal model is pre-compiled at build time into strongly typed JSON structures. The frontend is served directly from the edge via GitHub Pages with instant page loads, offline resiliency, and zero infrastructure vulnerability.

---

## Architectural Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. OFFICIAL PRIMARY SOURCES (Truth Boundary)                                           │
│  • MoF Union Budget 2026–27 "Budget at a Glance" (Official PDF, 1 Feb 2026)            │
│  • Controller General of Accounts (CGA) Monthly Accounts at a Glance (cga.nic.in)      │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Layout Extraction & Preservation
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. STRUCTURED RAW REPOSITORIES (`datasets/raw/`)                                       │
│  • union_budget_2026-27_be.json: 44 official BE metrics + physical PDF coordinates    │
│  • cga_2026-27_apr.json ... jul.json: 10 core monthly series across April–July 2026   │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Ingestion & Normalization (`pipeline/parsers/`)
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. NORMALIZED OBSERVATIONS & MACHINE PROVENANCE (`pipeline/models.py`)                 │
│  • 84 FinancialObservation instances with strict DataStatus contracts                 │
│  • source_verifier.py: verifies 100% of BE values against physical PDF text lines     │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Validation & Accounting Reconciliation
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. VALIDATION & RECONCILIATION ENGINE (`pipeline/validators.py`)                       │
│  • 4 Deficit Identities reconciled (Fiscal, Revenue, Effective Revenue, Primary = 0.0) │
│  • 17 Derived Series computed (10 execution rates + 7 GDP and expenditure ratios)      │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Build-Time Serialization
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. APPLICATION-READY ARTIFACTS (`datasets/processed/` & `src/data/`)                  │
│  • budget-summary-2026-27.json: single source of truth for UI                         │
│  • Strongly typed selectors with progressive 4-tier educational metadata               │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ React 18 + Vite Static Compilation
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 6. RENDERED USER INTERFACE (Edge / GitHub Pages)                                       │
│  • Home Page (Hero, Budget → Reality, ₹100 Donut, Progression Trace)                   │
│  • Explore Page (5 Domains, 43 Rail Buttons, Exact Data Strip, Analytical Table)       │
│  • Sources Page (Official links, CGA cards, pipeline audit status)                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Representative End-to-End Traces

| Metric | Source Coordinate | Raw JSON | Normalized ID | Reconciled Value | Processed JSON | Rendered UI |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fiscal Deficit** | MoF PDF p. 5, Table 1, Row 17 & CGA July Row 13 | BE: `1695768`<br>Jul: `455144` | `f58c7366fba4fe23`<br>`(dataStatus: "final")` | `Total Exp - Non-Borrowed Rec = 16,95,768`<br>(diff: 0.0) | Observation `f58c7366fba4fe23`<br>Exec: `26.84%` · GDP: `4.31%` | Hero: ₹17.0 lakh cr<br>Strip: ₹16,95,768 cr<br>Bengali: রাজকোষ ঘাটতি |
| **Total Expenditure** | MoF PDF p. 5, Table 1, Row 12 & CGA July Row 12 | BE: `5347315`<br>Jul: `1761853` | `e719597ffc640e06`<br>`(dataStatus: "final")` | `Rev Exp + Cap Exp = 53,47,315`<br>(diff: 0.0) | Observation `e719597ffc640e06`<br>Exec: `32.95%` | Hero: ₹53.5 lakh cr<br>Strip: ₹53,47,315 cr |
| **Revenue Receipts** | MoF PDF p. 5, Table 1, Row 1 & CGA July Row 1 | BE: `3533150`<br>Jul: `1267573` | `c0aef84bbab8027a`<br>`(dataStatus: "final")` | `Net Tax + Non-Tax = 35,33,150`<br>(diff: 0.0) | Observation `c0aef84bbab8027a`<br>Exec: `35.88%` | Strip: ₹35,33,150 cr<br>Actual: ₹12,67,573 cr |
| **Capital Expenditure** | MoF PDF p. 5, Table 1, Row 11 & CGA July Row 11 | BE: `1221821`<br>Jul: `450635` | `f883da01a88cff9b`<br>`(dataStatus: "final")` | Part of Total Exp<br>(diff: 0.0) | Observation `f883da01a88cff9b`<br>Exec: `36.88%` | Strip: ₹12,21,821 cr<br>Actual: ₹4,50,635 cr |
| **Non-Borrowed Receipts** | Derived: Table 1 Row 1 + Row 4 & CGA Row 7 | BE: `3651547`<br>Jul: `1306709` | `0da6f9dfcbb8ca28`<br>`(dataStatus: "derived")` | `Rev Rec + Non-Debt Cap = 36,51,547`<br>(diff: 0.0) | Observation `0da6f9dfcbb8ca28`<br>Exec: `35.79%` | ₹100 Donut: 100%<br>Strip: ₹36,51,547 cr |

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/), [TypeScript 5.5+](https://www.typescriptlang.org/) (Strict Mode) |
| **Build & Bundler** | [Vite 5](https://vitejs.dev/) (Production bundle: 1.25s build, optimized chunking) |
| **Routing** | [React Router 6](https://reactrouter.com/) (Declarative client routing with fallback redirects) |
| **Styling & Design** | CSS Modules, Design Tokens, Custom Rupee Typography (`ArthrekhaMark`) |
| **Data Normalization** | Python 3.10+, `dataclasses`, `argparse`, `json`, `pdftotext` |
| **Verification & Testing** | [Vitest](https://vitest.dev/), Testing Library, `pytest`, Chrome DevTools Protocol (CDP) |
| **Deployment** | GitHub Pages (Automated CI/CD with 6-gate validation) |

---

## Quickstart & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or newer
- **Python**: v3.10 or newer (with `pdftotext` installed, e.g. via `poppler-utils`)

### 1. Clone & Install
```bash
git clone https://github.com/iamaritrasaha/arthrekha.git
cd arthrekha

# Install frontend dependencies
npm install

# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## Quality Gates & Verification

Arthrekha enforces a comprehensive, multi-tiered verification suite. Every PR and release must pass all checks with zero errors:

```bash
# 1. Run Python pipeline tests, models, parsers, and provenance verifier (34 tests)
python3 run_tests.py

# 2. Run Frontend Vitest suite (53 tests across 7 test files)
npm test -- --run

# 3. Strict TypeScript typechecking
npm run typecheck

# 4. ESLint static analysis (0 warnings allowed)
npm run lint

# 5. Production Vite build
npm run build

# 6. Real-browser Chrome DevTools Protocol audit (Headless Chrome)
node browser_audit.js
```

### Regenerating Processed Data
To regenerate the application dataset from preserved raw files:
```bash
python3 -m pipeline.scripts.ingest
```

---

## Automated Source Monitoring

Arthrekha runs a scheduled GitHub Actions workflow that queries the official Controller General of Accounts release portal daily. When a newer monthly report is published:
1. Downloads and preserves the raw official release;
2. Verifies mathematical consistency across core monthly series;
3. Ingests and derives updated cumulative progression series;
4. Executes the full 6-gate validation suite (`run_tests.py`, `npm test`, `typecheck`, `lint`, `build`);
5. Atomically commits the verified records and deploys the new static build to GitHub Pages.

*If any validation check fails, the published site remains completely untouched.*

---

## Repository Structure

```
arthrekha/
├── AUDIT.md                        # Complete audit, verification & closure report
├── PIPELINE_README.md              # Ingestion pipeline & reconciliation guide
├── browser_audit.js                # Headless Chrome DevTools Protocol audit script
├── datasets/
│   ├── metadata/sources.json       # Source catalog & parser attribution manifest
│   ├── processed/union/            # Application-ready budget summary JSON
│   └── raw/                        # Preserved official PDFs and monthly CGA JSONs
├── docs/                           # Architecture, methodology, and data-source specs
├── pipeline/
│   ├── fixtures/                   # Machine-verifiable source evidence catalog
│   ├── parsers/                    # Budget at a Glance and CGA JSON/HTML parsers
│   ├── source_verifier.py          # PDF layout-level source provenance verifier
│   ├── validators.py               # Deficit identity and reconciliation engine
│   └── tests/                      # Python unit, model, and provenance test suites
├── public/                         # Static assets and WebP chapter illustrations
├── run_tests.py                    # Consolidated Python pipeline test runner
└── src/
    ├── components/                 # Brand, layout, and financial visualization widgets
    ├── data/                       # Selectors, domain definitions, and metric registry
    ├── i18n/                       # English and Bengali fiscal translation dictionaries
    └── pages/                      # HomePage, ExplorePage, LearnPage, SourcesPage
```

---

## Governance & Disclaimer

Arthrekha is an independent civic-technology initiative developed by **Aritra Saha / Foresight Labs**. 

> [!NOTE]
> **Independent Civic Initiative**: Arthrekha is not affiliated with, endorsed by, or sponsored by the Ministry of Finance, the Controller General of Accounts, or the Government of India. Official Government of India data remains attributed to its respective publisher organizations.

---

## Copyright & License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.  
© 2026 Aritra Saha · Foresight Labs. All rights reserved.
