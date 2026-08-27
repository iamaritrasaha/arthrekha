# Data Ingestion Methodology

## Overview

This document describes how Arthrekha ingests Union Government fiscal data from official sources, normalizes it into a consistent schema, validates it, and generates application-ready datasets.

## Data Flow

```
Official Source (PDF/Excel/HTML)
        ↓
   Raw Preservation (datasets/raw/)
        ↓
   Parser (pipeline/parsers/)
        ↓
   FinancialObservation Objects
        ↓
   Validation (pipeline/validators.py)
        ↓
   Derived Calculations
        ↓
   Application JSON (datasets/processed/)
```

## Canonical Units

### Monetary Values
- **Internal storage**: ₹ crore
- **Source parsing**: Convert all values to crore
- **Display formatting**: crore, lakh crore, or compact notation (handled by UI)

### Time Periods
- **Financial Year**: April 1 to March 31
- **Format**: "2026-27" (not "2026" or "FY2026")
- **Quarters**: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)

## Estimate Types

### Budget Estimate (BE)
- What the government originally planned in the Union Budget
- Presented to Parliament in February
- Status: `final` (authorized by Parliament)

### Revised Estimate (RE)
- Updated expectation mid-year after observing actual performance
- Presented in next year's budget documents
- Status: `final` (authorized by Parliament)

### Actual
- Final recorded figures after financial year ends
- Audited by CAG
- Status: `final` (audited)

### Provisional Actual
- Recent figures that are useful but may change
- Published monthly/quarterly by CGA
- Status: `provisional` (subject to audit)

## Period Conventions

### Annual
- Full financial year
- `period = None`
- `period_type = "annual"`

### Cumulative/YTD
- Accumulated from April 1 to reporting date
- `period = "apr-jun"` or `period = "q1"`
- `period_type = "cumulative"`

### Monthly
- Single month only (rarely used for Union Budget)
- `period = "apr"` or `period = "may"`
- `period_type = "monthly"`

**Important**: CGA monthly reports are typically cumulative (YTD), not individual months.

## Provisional Data Treatment

When CGA publishes monthly accounts:
1. Mark `estimate_type = "provisional"`
2. Mark `data_status = "provisional"`
3. Include note: "Subject to audit by CAG"
4. Never treat provisional as final

## Transformation Rules

### Parsing
1. Extract only explicitly supported metrics (defined in `pipeline/metrics.py`)
2. Convert all monetary values to ₹ crore
3. Remove Indian number formatting (lakhs/crores notation)
4. Preserve negative values where legitimate (e.g., grants recovered)
5. Fail loudly on parse errors—do not substitute zero or previous values

### Normalization
1. Create one `FinancialObservation` per metric per period per estimate type
2. Generate deterministic ID from key fields
3. Attach full provenance (`DataSource`) to every observation
4. Store in crore, always
5. Use proper estimate type classification

### Validation
1. **Required fields**: jurisdiction, FY, metric, amount, source
2. **Unit consistency**: must be "crore"
3. **Currency consistency**: must be "INR"
4. **FY format**: must match "YYYY-YY" pattern
5. **Provenance**: organization and document must be present
6. **Metric registry**: metric ID must be registered
7. **Reconciliation**: where mathematically defined, validate component sums
8. **No duplicates**: same observation ID cannot appear twice

### Reconciliation

When official classifications support it, validate:

```python
total_receipts = revenue_receipts + non_debt_capital_receipts
revenue_receipts = tax_revenue_net + non_tax_revenue
total_expenditure = revenue_expenditure + capital_expenditure
```

If reconciliation fails, investigate whether:
- Accounting classifications differ legitimately
- Rounding caused small differences (< 1% tolerance)
- Parse error occurred
- Source data has inconsistency

Do not force reconciliation when categories don't match exactly.

## Derived Calculations

### Execution Rate
```
execution_rate = (actual_ytd / budget_estimate) × 100
```

Mark as:
- `data_status = "derived"`
- Store formula explicitly
- Reference input observation IDs

### GDP Ratios
When GDP reference data available:
```
fiscal_deficit_gdp_ratio = (fiscal_deficit / nominal_gdp) × 100
```

## Known Limitations

### FY 2026-27 Sample Data
Current implementation uses **sample data** for pipeline development because:
- Official sources (indiabudget.gov.in, cga.nic.in) returned HTTP 403/network errors
- No fake data policy requires clear documentation
- Sample data mirrors expected official structure

**Action required**: Replace sample data with actual official sources when accessible.

### State Data
V1 focuses on Union Government only. State ingestion requires:
- Identifying 28+ state budget portals
- Handling non-uniform reporting
- Dealing with varying publication schedules

### Automation
Current ingestion is manual/scripted. Future automation requires:
- Reliable PDF parsing for official documents
- Scheduled checks for new publications
- CI/CD integration with validation gates

## Output Format

### Application JSON

```json
{
  "financialYear": "2026-27",
  "asOfDate": "2026-08-27",
  "observations": [
    {
      "id": "abc123...",
      "jurisdiction": "india",
      "jurisdictionType": "union",
      "financialYear": "2026-27",
      "periodType": "annual",
      "metric": "revenue_receipts",
      "amount": 3003992,
      "unit": "crore",
      "currency": "INR",
      "estimateType": "BE",
      "source": {
        "organization": "Ministry of Finance",
        "document": "Union Budget 2026-27",
        "url": "https://www.indiabudget.gov.in/",
        "dataStatus": "final"
      }
    }
  ],
  "derivedMetrics": [
    {
      "metric": "revenue_receipts_execution_rate",
      "formula": "actual_ytd / budget_estimate × 100",
      "value": 21.5,
      "unit": "percentage"
    }
  ],
  "metadata": {
    "generated": "2026-08-27",
    "totalObservations": 20,
    "sources": ["Union Budget 2026-27 BE", "CGA Apr-Jun 2026"],
    "latestPeriod": "apr-jun"
  }
}
```

### Source Manifest

Separate `sources.json` contains provenance for all datasets:

```json
[
  {
    "source_id": "union-budget-2026-27-be",
    "source_organization": "Ministry of Finance",
    "document_name": "Union Budget 2026-27",
    "canonical_url": "https://www.indiabudget.gov.in/",
    "financial_year": "2026-27",
    "estimate_type": "BE",
    "source_format": "pdf",
    "parser_used": "pipeline.parsers.budget_parser",
    "metrics_available": ["revenue_receipts", "..."]
  }
]
```

## Running the Pipeline

```bash
# Set Python path
export PYTHONPATH=.

# Run ingestion
python3 pipeline/scripts/ingest.py

# Run tests
python3 pipeline/tests/test_models.py
python3 pipeline/tests/test_parsers.py
```

## Validation Checklist

Before accepting any dataset:
- [ ] All observations have valid provenance
- [ ] Units are consistently "crore"
- [ ] Estimate types correctly classified
- [ ] Reconciliation passes where applicable
- [ ] No duplicate observation IDs
- [ ] Source manifest complete
- [ ] Derived calculations verified
- [ ] Tests pass
- [ ] Output JSON valid

## Future Enhancements

1. **PDF parsing**: Automated extraction from official PDFs
2. **State support**: Expand to state budgets
3. **Historical data**: Backfill 5-10 years
4. **GDP integration**: CSO/MOSPI GDP data for ratios
5. **Debt data**: RBI debt statistics
6. **CAG integration**: Audited actuals
7. **CI/CD**: Scheduled ingestion with validation gates
