# Arthrekha Pipeline - Quick Start

## Running the Data Ingestion Pipeline

### Option 1: Using helper script
```bash
python3 run_ingestion.py
```

### Option 2: Direct invocation
```bash
PYTHONPATH=. python3 pipeline/scripts/ingest.py
```

## Running Tests

### Option 1: Using helper script
```bash
python3 run_tests.py
```

### Option 2: Individual test files
```bash
PYTHONPATH=. python3 pipeline/tests/test_models.py
PYTHONPATH=. python3 pipeline/tests/test_parsers.py
```

## Output

### Generated Datasets
- `datasets/processed/union/budget-summary-2026-27.json` - Main dataset
- `datasets/metadata/sources.json` - Source provenance

### Sample Sources
- `datasets/raw/sample_budget_2026-27_be.md` - Budget Estimates structure
- `datasets/raw/sample_cga_2026-27_apr-jun.md` - CGA actuals structure

## Important Note

Current implementation uses **sample data** for pipeline development due to network access limitations to official sources (indiabudget.gov.in, cga.nic.in).

To use real data:
1. Download official documents from:
   - Union Budget: https://www.indiabudget.gov.in/
   - CGA Monthly: https://cga.nic.in/
2. Update parsers in `pipeline/parsers/` to read actual files
3. Run ingestion pipeline
4. Validate outputs

## Pipeline Architecture

```
Official Source
    ↓
Parse (pipeline/parsers/)
    ↓
Normalize (pipeline/models.py)
    ↓
Validate (pipeline/validators.py)
    ↓
Generate JSON (datasets/processed/)
```

See `docs/methodology.md` for complete documentation.
