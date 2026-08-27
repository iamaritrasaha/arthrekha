# Arthrekha data pipeline

The offline Python pipeline parses the preserved FY 2026–27 source records, normalizes them into canonical financial observations, validates accounting relationships and generates the static application dataset.

## Run ingestion

```bash
python3 -m pipeline.scripts.ingest
```

Outputs:

- `datasets/processed/union/budget-summary-2026-27.json`
- `datasets/metadata/sources.json`

The current run produces 74 normalized observations and 17 explicitly labelled derived measures.

## Run tests

```bash
PYTHONPATH=. python3 -m pytest -q
```

## Current sources

- Ministry of Finance — *Budget at a Glance 2026–27*
- Controller General of Accounts — cumulative provisional actuals for April, April–May and April–June 2026

The official Budget PDF and structured raw records are preserved under `datasets/raw/`. See [data sources](docs/data-sources.md) and [methodology](docs/methodology.md) for provenance, period semantics, derivations and known limitations.
