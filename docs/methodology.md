# Arthrekha — Methodology

This document explains how Arthrekha ingests, processes, and presents Indian public finance data.

---

## 1. Data Pipeline Architecture

```
Official Source (PDF/Excel/HTML)
        ↓
datasets/raw/          ← Preserved original structure
        ↓
Parser                 ← Extract metrics
        ↓
Normalize              ← Map to FinancialObservation schema
        ↓
Validate               ← Reconciliation & bounds checks
        ↓
Generate JSON          ← Application-ready datasets
        ↓
datasets/processed/    ← Version-controlled output
        ↓
React App (build)      ← Static site with bundled data
```

### Principles

1. **Raw data preservation** — Never mutate source files
2. **Explicit provenance** — Every number traceable to its source
3. **Reproducibility** — Pipeline runs produce identical output
4. **Loud failures** — Parser errors halt ingestion; no silent substitutions
5. **Validation at ingestion** — Catch errors before they reach the app

---

## 2. Financial Observation Schema

Every data point is a **Financial Observation** — the atomic unit of fiscal data.

```typescript
{
  id: string;                   // Deterministic hash
  jurisdiction: "india";        // or state/UT code
  jurisdictionType: "union";    // "union" | "state" | "ut"
  financialYear: "2026-27";     // April 2026 – March 2027
  period: "apr-jun";            // null for full year
  periodType: "cumulative";     // "annual" | "monthly" | "cumulative" | "ytd"
  metric: "revenue_receipts";   // From canonical metric registry
  amount: 661050;               // Always in ₹ crore
  unit: "crore";
  currency: "INR";
  estimateType: "provisional";  // "BE" | "RE" | "actual" | "provisional"
  source: { /* full provenance */ }
}
```

### Key Design Choices

**Canonical unit: ₹ crore**  
All monetary values stored in crore. Display formatting (lakh crore, % of GDP) happens at render time.

**Why crore?**
- Budget documents use crore
- Avoids float precision issues with smaller units
- Clean conversion: 1 lakh crore = 100,000 crore

**Financial year format: YYYY-YY**  
`"2026-27"` means April 1, 2026 to March 31, 2027.

**Period encoding**:
- `null` → full year (Budget Estimates)
- `"apr"` → April only
- `"apr-jun"` → April to June (Q1)
- `"q1"` → Alternative encoding for Q1

**EstimateType**:
- `BE` — Budget Estimate (plan for upcoming FY)
- `RE` — Revised Estimate (mid-year update)
- `actual` — Final audited (CAG)
- `provisional` — Unaudited actuals (CGA monthly)

---

## 3. Metric Registry

All metrics use stable IDs from `pipeline/metrics.py`.

### Core Metrics (FY 2026-27)

| Metric ID | Display Name | Category |
|-----------|--------------|----------|
| `revenue_receipts` | Revenue Receipts | receipts |
| `tax_revenue_net` | Tax Revenue (Net) | receipts |
| `non_tax_revenue` | Non-Tax Revenue | receipts |
| `non_debt_capital_receipts` | Non-Debt Capital Receipts | receipts |
| `total_receipts` | Total Receipts | receipts |
| `revenue_expenditure` | Revenue Expenditure | expenditure |
| `capital_expenditure` | Capital Expenditure | expenditure |
| `total_expenditure` | Total Expenditure | expenditure |
| `interest_payments` | Interest Payments | expenditure |
| `fiscal_deficit` | Fiscal Deficit | deficit |

Each metric includes:
- Human-readable name
- Short description (one sentence)
- Long beginner-friendly explanation
- Accounting interpretation
- Compatible comparisons

**No arbitrary strings** — All metrics validated against registry at ingestion.

---

## 4. Parsing Strategy

### 4.1 Budget Estimates (Union Budget)

**Source**: `indiabudget.gov.in` → Budget at a Glance PDF

**Structure**: Key-value table with fiscal aggregates

**Parser**: `pipeline/parsers/json_parser.py`

**Process**:
1. Manual extraction from official PDF into structured JSON
2. Store in `datasets/raw/union_budget_2026-27_be.json`
3. Parser reads JSON and creates `FinancialObservation` objects
4. Full provenance attached to each observation

**Why manual extraction for V1?**
- Budget at a Glance has a stable, simple structure
- Manual transcription is less error-prone than PDF scraping
- Easier to verify correctness
- Future: automate when format is predictable

### 4.2 CGA Monthly Actuals

**Source**: `cga.nic.in` → Accounts at a Glance PDF

**Structure**: Monthly tables with cumulative YTD figures

**Parser**: `pipeline/parsers/json_parser.py`

**Process**:
1. Extract from CGA monthly PDF into structured JSON
2. One file per month: `datasets/raw/cga_2026-27_jun.json`
3. Parse cumulative figures
4. Mark as `provisional` and `cumulative` period type

**Important**: CGA reports are **cumulative YTD**.
- April report → April only
- June report → April + May + June cumulative
- Not individual monthly values

### 4.3 Indian Number Format Handling

Indian number system uses **lakh** (1,00,000) and **crore** (1,00,00,000).

Some Budget documents use:
- "₹ 30.03 lakh crore" (display format)
- Equals 30,03,000 crore (stored format)

**Conversion**:
```
1 lakh crore = 100,000 crore
₹ X lakh crore = X × 100,000 crore
```

Arthrekha stores in crore; renders in lakh crore or crore based on magnitude.

### 4.4 Negative Values

Some fiscal metrics can be negative (rare):
- Negative receipts → refunds exceeding collections
- Negative deficit → surplus

Parsers preserve sign. Validation checks for plausibility, not sign.

---

## 5. Validation

### 5.1 Observation-Level Validation

For each observation:
- Required fields present
- Unit is `crore`
- Currency is `INR`
- Financial year format valid (`YYYY-YY`)
- Metric ID registered
- Source provenance complete

### 5.2 Reconciliation Validation

Test accounting identities where defined:

**Total Receipts**:
```
total_receipts = revenue_receipts + non_debt_capital_receipts
```

**Revenue Receipts**:
```
revenue_receipts = tax_revenue_net + non_tax_revenue
```

**Total Expenditure**:
```
total_expenditure = revenue_expenditure + capital_expenditure
```

**Fiscal Deficit**:
```
fiscal_deficit = total_expenditure - total_receipts
```

Reconciliation tolerance: **1%** (allows for rounding in source documents)

**Important**: Not all totals reconcile due to classification differences. Validation flags discrepancies without failing ingestion.

### 5.3 Execution Rate Validation

For Budget vs Actuals comparison:

```
execution_rate = (actual_ytd / budget_estimate) × 100
```

Validation checks:
- BE observation has `estimateType: "BE"`
- Actual observation has `estimateType: "actual" or "provisional"`
- Same metric
- Execution rate > 0 and < 200% (flag outliers)

---

## 6. Derived Metrics

Calculated values marked explicitly:

```typescript
{
  metric: "revenue_receipts_execution_rate",
  formula: "actual_ytd / budget_estimate × 100",
  inputs: ["<BE-obs-id>", "<actual-obs-id>"],
  value: 21.0,
  unit: "percentage",
  description: "Execution rate as of June 2026"
}
```

**Application-calculated** — Not from official sources. Formulas documented.

---

## 7. Provenance Metadata

Every observation includes:

```typescript
source: {
  organization: "Ministry of Finance, Government of India",
  document: "Union Budget 2026-27 - Budget at a Glance",
  url: "https://www.indiabudget.gov.in/",
  table: "Budget at a Glance",
  publishedAt: "2026-02-01",
  retrievedAt: "2026-08-27",
  dataStatus: "final",  // or "provisional"
  notes: "Budget Estimates as presented to Parliament"
}
```

**Source manifest** separately stored in `datasets/metadata/sources.json` with:
- Canonical URL
- Parser used
- Metrics available
- Update schedule
- Authoritative status

---

## 8. Output Format

### Application-Ready JSON

```json
{
  "financialYear": "2026-27",
  "asOfDate": "2026-08-27",
  "observations": [ /* all FinancialObservation objects */ ],
  "derivedMetrics": [ /* all calculated metrics */ ],
  "metadata": {
    "generated": "2026-08-27",
    "totalObservations": 40,
    "sources": ["Union Budget 2026-27 BE", "CGA Jun 2026"],
    "latestPeriod": "apr-jun",
    "dataStatus": "Real data from official sources"
  }
}
```

**Output location**: `datasets/processed/union/budget-summary-2026-27.json`

**Version control**: All output JSON committed to git for reproducibility.

---

## 9. Period Conventions

### Financial Year (FY)

India's financial year runs **April 1 to March 31**.

- **FY 2026-27** = April 1, 2026 to March 31, 2027
- Encoded as `"2026-27"` string

### Quarters

- **Q1**: April–June
- **Q2**: July–September
- **Q3**: October–December
- **Q4**: January–March

### Cumulative vs Point-in-Time

- **CGA actuals**: Cumulative YTD (April to current month)
- **Budget Estimates**: Full-year plan
- **Monthly individual**: Calculated as difference (not yet implemented)

---

## 10. Estimate Type Hierarchy

Data freshness and authority:

```
Budget Estimate (BE)
  ↓ [mid-year]
Revised Estimate (RE)
  ↓ [month by month]
Provisional Actuals (CGA)
  ↓ [after FY end + audit]
Final Audited (CAG)
```

**Arthrekha currently uses**:
- BE (Budget 2026-27)
- Provisional actuals (CGA through June 2026)

**Future**: Add RE and CAG audited figures.

---

## 11. Data Freshness

| Data Type | As Of | Published | Retrieved |
|-----------|-------|-----------|-----------|
| Budget Estimates FY 2026-27 | Feb 1, 2026 | Feb 1, 2026 | Aug 27, 2026 |
| CGA Actuals June 2026 | June 30, 2026 | July 31, 2026 | Aug 27, 2026 |

**Latest actuals period**: June 2026  
**Reporting lag**: ~1 month (June data available end of July)

---

## 12. Testing

### Unit Tests
- `pipeline/tests/test_models.py` — Schema validation
- `pipeline/tests/test_parsers.py` — Parser correctness

### Fixture-Based Tests
- Real source samples preserved in `datasets/raw/`
- Tests verify parser produces expected observations
- Reconciliation tests check accounting identities

### Integration Test
- Full pipeline run
- Validates end-to-end: raw → processed → JSON

---

## 13. Known Limitations

1. **Manual data entry for V1** — Budget and CGA data manually extracted into JSON
2. **No historical data yet** — Only FY 2026-27 current year
3. **Union only** — No state/UT data yet
4. **Limited metrics** — 10 core metrics; ministry-wise breakdowns future work
5. **No detailed expenditure** — Aggregates only; scheme/ministry drill-down later
6. **CGA lag** — Monthly actuals ~1 month behind real time

---

## 14. Future Methodology Enhancements

1. **Automated PDF parsing** — When format is stable
2. **Historical time series** — Multi-year datasets
3. **State-level data** — All 28 states + 8 UTs
4. **Ministry breakdowns** — Expenditure by department
5. **Debt tracking** — RBI data integration
6. **Real-time ingestion** — GitHub Actions on CGA publication schedule
7. **Differential updates** — Only ingest changed data

---

## 15. Reproducibility

To reproduce Arthrekha datasets:

1. Clone repository
2. Verify raw data in `datasets/raw/` matches official sources
3. Run: `python3 run_ingestion.py`
4. Compare output: `datasets/processed/union/budget-summary-2026-27.json`
5. All outputs deterministic (IDs are content hashes)

**Data lineage**: Git history tracks every change to raw and processed data.

---

**Last Updated**: August 27, 2026  
**Pipeline Version**: 1.0  
**Methodology Author**: Arthrekha Data Team
