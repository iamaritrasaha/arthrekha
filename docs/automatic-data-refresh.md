# Automatic data refresh

Arthrekha uses a validation-gated refresh workflow for official fiscal
releases. The goal is to keep the public dataset current without replacing a
financial record until the new source has passed the complete data and
application checks.

## Current flow

1. A scheduled GitHub Actions job checks the Controller General of Accounts
   release index.
2. The checker compares the newest recognised monthly release with the latest
   period in the processed dataset.
3. The run stores a machine-readable source report as an artifact.
4. If a newer release is found, the official monthly report is downloaded and
   normalized into a candidate raw source.
5. The candidate runs the complete ingestion, reconciliation, frontend, and
   build checks.
6. Only a candidate that passes every check is committed to `main`, which
   triggers the existing Pages deployment.

## Why the workflow is validation-gated

The CGA release index is a publication notice and the monthly dashboard is
served by a dynamic government site. A release notice alone is not a safe data
input. The values must be extracted from the correct publication, mapped to
the normalized metric registry, checked for cumulative-period semantics, and
reconciled before they can replace the current dataset.

The scheduled check therefore never writes to the processed dataset unless the
source-specific parser and all validation gates succeed. A parser failure or
any failed application gate leaves the published dataset unchanged.

## Local check

Run the same source check locally with:

```bash
PYTHONPATH=. python3 -m pipeline.scripts.check_updates --report-path source-update-report.json
```

The report is intentionally a local/generated file and should not be committed.

## Extension point

When a new official publication format is confirmed, add a source adapter that:

- downloads or accepts the official source;
- preserves the raw evidence and source metadata;
- emits normalized `FinancialObservation` records;
- runs all existing validation and reconciliation checks; and
- changes the processed dataset only after the candidate passes those checks.

The existing structured JSON inputs remain the source of truth until that
adapter is implemented and reviewed.
