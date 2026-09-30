# CGA Monthly Refresh — Design and Implementation Plan

> **Status: IMPLEMENTED** — September 2026
> Implemented Architecture B (Candidate-Branch PR Workflow) across Phases 0–5. Direct auto-commit to main has been retired; all monthly data refreshes and revisions proceed through validated candidate PRs.

_Last updated: September 2026_

---

## 1. How a New CGA Month Enters the Project Today

### 1.1 End-to-End Flow

```
Daily cron (05:20 UTC)
  └── check-fiscal-sources.yml
        ├── check_updates.py
        │     ├── fetch_source_index(cga.nic.in/Index.aspx)          [source_updates.py]
        │     ├── parse_cga_releases(html)   → list[CgaRelease]
        │     ├── latest_cga_release()       → CgaRelease | None
        │     ├── compare_release_to_dataset(release, processed_json)
        │     └── writes GITHUB_OUTPUT:
        │           status, reporting_period, source_url, report_url
        │
        ├── [if status == 'new_release']
        │     ├── refresh_cga.py
        │     │     ├── fetch_report(REPORT_URL)
        │     │     │     └── follow <iframe src="…"> or detect "AS AT THE END OF"
        │     │     ├── parse_cga_monthly_report(html)              [cga_html.py]
        │     │     │     ├── _period_from_report()  — regex on heading
        │     │     │     ├── _TableParser.feed()    — stdlib HTMLParser
        │     │     │     ├── METRIC_LABELS lookup   — 10 metrics
        │     │     │     └── missing-metrics check
        │     │     └── write datasets/raw/cga_2026-27_{mon}.json
        │     │
        │     ├── pipeline/scripts/ingest.py
        │     │     ├── load_all_sources()             [json_parser.py]
        │     │     ├── validate_observations()         [validators.py]
        │     │     ├── validate_reconciliation() ×3
        │     │     ├── validate_deficit_identities()
        │     │     ├── validate_execution_rate() per metric
        │     │     ├── compute ratio DerivedMetrics
        │     │     └── write datasets/processed/union/budget-summary-2026-27.json
        │     │           + datasets/metadata/sources.json
        │     │
        │     ├── pytest -q          (Python test suite)
        │     ├── run_tests.py       (additional Python runner)
        │     ├── npm test --run     (Vitest frontend)
        │     ├── npm run typecheck
        │     ├── npm run lint
        │     ├── npm run build
        │     │
        │     └── git commit + git push → main
        │           → triggers deploy-pages.yml → GitHub Pages
        │
        └── [always] upload source-update-report.json as artifact
```

### 1.2 Every Manual Step

| Step | Location | What a human must do |
|---|---|---|
| **FY rotation** | `refresh_cga.py` line 56 | Change `default="2026-27"` to new FY each April |
| **FY hardcodes in ingest.py** | Lines 77, 247, 252–258, 344–346 | Update eight string literals for each new FY |
| **Output suffix calculation** | Workflow line 62–64 | YAML uses `${REPORTING_PERIOD##*-}` — correct today, but if CGA changes cumulative period format this silently produces wrong filenames |
| **E2E test pinned values** | `test_pipeline_e2e.py` lines 23–25, 42–45, 55, 62 | After each new month, update `latestPeriod`, `totalObservations`, `cga_obs` count, `periods` set, and source count |
| **Publication-date field** | `cga_2026-27_jul.json` line 6 | Always `null`; someone should record it from the CGA release notice if needed for audit |

### 1.3 Every Identified Failure Mode

#### Structural / Silent Failures

| ID | Failure | Impact | Current Mitigation |
|---|---|---|---|
| **F-01** | `check_updates.py` emits `report_url` in `GITHUB_OUTPUT`; workflow consumes `REPORT_URL` from `source-check.outputs.report_url` — **these match**, but `check_updates.py` line 72 writes the key `report_url` while the workflow reads `steps.source-check.outputs.report_url`. This works, but the variable `REPORT_URL` used in the fetch step comes from `steps.source-check.outputs.report_url`, which is correct. The _other_ variable `source_url` (the release-notice page URL, not the report) is never consumed. Any rename breaks silently. | Silent wrong-URL fetch | None — naming relies on convention only |
| **F-02** | CGA changes row label order or adds a new row before a core metric | `_TableParser` selects column index 4 (actuals); label-matching relies on `METRIC_LABELS` dict | Parser raises `ValueError("CGA report is missing core metrics: …")` — fails loudly |
| **F-03** | CGA wraps the report in a nested iframe or changes to a PDF link | `fetch_report()` only follows one level of iframe; no PDF fallback | `ValueError("CGA monthly report page did not expose its report document")` — fails loudly |
| **F-04** | CGA site returns HTTP 200 with an error/maintenance page | `_period_from_report()` fails to find the heading regex | `ValueError("CGA report period heading was not found")` — fails loudly |
| **F-05** | CGA publishes a revision of a past month (same URL, different data) | Previous raw JSON is silently overwritten; no revision is detected or flagged | **No mitigation** — this is the most dangerous silent failure |
| **F-06** | A metric value is plausible but wildly wrong (e.g., fiscal_deficit jumps 300% due to a data entry error at CGA) | Passes all accounting identities because the error is internally consistent | **No mitigation** — MoM delta check is absent |
| **F-07** | Network timeout or transient HTTP error during fetch | `urlopen` uses 45-second timeout; on failure, the step fails and the workflow stops before writing | Workflow exits non-zero — safe |
| **F-08** | `financial_year` hardcoded to `"2026-27"` after FY rolls over | `parse_cga_monthly_report()` raises `ValueError("CGA report year … does not match financial year 2026-27")` | The error blocks bad data, but no data enters either — stale dataset persists silently |
| **F-09** | `test_pipeline_e2e.py` asserts `latestPeriod == "apr-jul"` and `totalObservations == 84` | After every new CGA month, CI will fail on the existing deploy-pages.yml push test until the test constants are manually updated | Brittle — forces manual test maintenance every month |
| **F-10** | Two GH Actions jobs run concurrently (daily cron + manual dispatch) | One may commit while the other is mid-push | `concurrency: cancel-in-progress: true` prevents this — safe |
| **F-11** | Auto-commit to `main` during a force-push or rebase by a developer | Standard `git push origin main` may fail with a non-fast-forward error | Workflow fails non-zero — safe, but data is lost for that cycle |
| **F-12** | Processed dataset committed before all frontend tests pass | Step ordering in monolithic job means a mid-sequence failure leaves a committed raw JSON with no matching processed data | The `git add` includes all three files atomically — safe, but only if every step before it passes |

#### Missing Capabilities

| Capability | Gap |
|---|---|
| Raw HTML archival | Only the normalized JSON is committed; the exact HTML that was parsed is never saved |
| Provenance completeness | `publication_date` in raw JSON is always `null` (CGA does not print a date on the report page) |
| Revision detection | No comparison of newly-fetched data against previously-committed JSON |
| MoM delta validation | No guard against plausible-but-wrong values |
| FY-auto-detection | Financial year must be updated manually each April |
| Human review gate | Any passing refresh auto-publishes without human sign-off |

---

## 2. Three Candidate Architectures

### Architecture A — Minimal Surgical Upgrade

**Core idea:** Keep the single monolithic workflow. Apply five targeted fixes.

**Changes:**
1. Add `pipeline/scripts/fy_utils.py` — derive active FY from `datetime.date.today()` (Apr = new FY start); inject into `refresh_cga.py` and `ingest.py` via environment variable or argument.
2. After `fetch_report()` in `refresh_cga.py`, write `datasets/raw/cga_{fy}_{mon}.html` and a sidecar `datasets/raw/cga_{fy}_{mon}.provenance.json` containing `{url, fetched_at, sha256_of_html}`.
3. Add `pipeline/scripts/validate_mom_delta.py` that loads the previous month's raw JSON (if it exists), checks each metric changed by ≤ 25%, raises a non-blocking warning written to `GITHUB_STEP_SUMMARY`, and sets a `::warning::` annotation but does not exit non-zero unless a metric moved > 100%.
4. Fix `test_pipeline_e2e.py` to derive expected counts from the actual raw files rather than pinning literals.
5. Fix the output-key comment inconsistency in `check_updates.py`.

**Verdict:** Lowest implementation cost, but anomalous data still auto-commits if the delta is within the threshold. No mandatory human review gate.

---

### Architecture B — Candidate-Branch PR Workflow ✓ _Recommended_

**Core idea:** Separate detection from publication by routing all data changes through a pull request. A human (or future auto-merge bot) is always the final gate.

**Changes:**

1. **`detect.yml`** (runs on schedule daily):
   - Runs `check_updates.py`.
   - On `new_release`: fires `workflow_dispatch` on `refresh.yml` with inputs `{reporting_period, report_url, financial_year}`.
   - On `up_to_date`: exits 0 silently.
   - On `source_shape_unrecognised`: posts a `::warning::` and uploads the diagnostic artifact.

2. **`refresh.yml`** (triggered by `detect.yml` or manually):
   - Creates branch `refresh/cga-YYYY-MM` from current `main`.
   - Fetches the CGA HTML, archives it to `datasets/raw/cga_{fy}_{mon}.html` with a `provenance.json` sidecar (`{url, fetched_at, sha256}`).
   - Runs `refresh_cga.py` to produce the raw JSON.
   - Runs the MoM delta validator; records all deltas in a structured report.
   - Runs `python -m pipeline.scripts.ingest` → produces candidate processed data.
   - Runs the full test suite (pytest + npm test + typecheck + lint + build).
   - Commits all changed files to the refresh branch.
   - Opens a pull request against `main` with a machine-generated body containing:
     - Period, FY, fetch timestamp, SHA-256 of HTML
     - Table of all 10 metrics with previous value, new value, and % change
     - Accounting identity results (pass/fail per identity)
     - Revision flag if any metric differs from the previous-period raw JSON at the same period label
     - Test results summary
   - On any hard failure (parser error, identity check failure, test failure): closes the branch and posts a failure annotation. The published dataset is untouched.

3. **`deploy-pages.yml`** unchanged — fires on merge to `main`.

4. **`pipeline/scripts/fy_utils.py`** — FY computation from system date; imported by `refresh_cga.py` and `ingest.py`.

5. **`pipeline/scripts/validate_mom_delta.py`** — previous-period comparison; structured JSON output consumed by the PR body generator.

6. **Fix `test_pipeline_e2e.py`** — derive expected counts dynamically from `datasets/raw/cga_{fy}_*.json` glob.

**Why B wins over A:** The mandatory PR gate is the critical missing capability. F-05 (silent revision overwrite) and F-06 (plausible-but-wrong values) both require a human to see the delta table before the data is published. A 25% auto-threshold in Architecture A cannot distinguish a genuine 22% seasonal swing from a data entry error at CGA.

**Why B wins over C:** Architecture C's immutable archive on a separate branch adds meaningful storage overhead and a third failure surface (the archive fetch may succeed while the validate job fails, leaving an archived HTML that never becomes a dataset). For a solo project without external audit requirements, the PR body already provides the provenance trail that C's attestation JSON supplies, at a fraction of the complexity. C remains the right choice if Arthrekha ever needs to comply with a formal data-provenance standard.

---

### Architecture C — Immutable Artifact + Attestation Store

**Core idea:** Fully decouple archival from validation. The HTML is always saved first (even if parsing later fails). An attestation JSON records every step's output for machine-verifiable audit.

**Changes:** Three workflow files, `datasets/archive/` path convention, attestation schema, attestation validator in CI. Estimated ~600 lines of Python + ~200 lines of YAML.

**Best suited for:** Arthrekha if it ever needs to satisfy formal open-data provenance requirements, CAG audit readiness, or multi-stakeholder replication.

---

## 3. Ranking Summary

_Evaluated via `jev_rank` against six criteria: source integrity, maintainability, reproducibility, transparency, resistance to CGA format changes, implementation complexity._

| Rank | Architecture | Relevance score | Key trade-off |
|---|---|---|---|
| **1** | B — Candidate-Branch PR | 0.86 | Best balance; PR gate provides human oversight without blocking automation |
| **2** | C — Attestation Store | 0.86 | Equal integrity but higher complexity for solo maintenance |
| **3** | A — Minimal Surgical | 0.81 | Easiest to implement but leaves the auto-publish safety gap open |

---

## 4. Chosen Architecture: B — Candidate-Branch PR Workflow

### 4.1 Data-Flow Diagram

```
Daily cron (UTC 05:20)
  └── detect.yml
        ├── check_updates.py                   [existing, minor fix]
        │     └── GITHUB_OUTPUT: status, reporting_period, report_url, financial_year
        │
        ├── [status == up_to_date]  →  exit 0
        ├── [status == source_shape_unrecognised]  →  ::warning:: annotation
        └── [status == new_release]
              └── workflow_dispatch → refresh.yml
                    ├── inputs: reporting_period, report_url, financial_year
                    │
                    ├── FETCH & ARCHIVE
                    │     ├── fetch_report(report_url)           [refresh_cga.py]
                    │     ├── write datasets/raw/cga_{fy}_{mon}.html
                    │     ├── write datasets/raw/cga_{fy}_{mon}.provenance.json
                    │     │     { url, fetched_at, sha256_html }
                    │     └── parse_cga_monthly_report(html)
                    │           → write datasets/raw/cga_{fy}_{mon}.json
                    │
                    ├── MOM DELTA VALIDATION
                    │     ├── load previous-period raw JSON (if exists)
                    │     ├── compute delta% per metric
                    │     ├── flag revisions (same-period overwrite detected)
                    │     └── emit validate_mom_delta_report.json
                    │
                    ├── INGESTION & ACCOUNTING CHECKS
                    │     ├── python -m pipeline.scripts.ingest
                    │     └── accounting identities (4 checks ×N periods)
                    │
                    ├── TEST SUITE
                    │     ├── pytest -q
                    │     ├── npm test --run
                    │     ├── npm run typecheck + lint + build
                    │     └── [any failure] → close branch, post annotation
                    │                         published dataset UNCHANGED
                    │
                    ├── COMMIT TO BRANCH refresh/cga-{YYYY}-{MM}
                    │     datasets/raw/cga_{fy}_{mon}.html
                    │     datasets/raw/cga_{fy}_{mon}.provenance.json
                    │     datasets/raw/cga_{fy}_{mon}.json
                    │     datasets/processed/union/budget-summary-{fy}.json
                    │     datasets/metadata/sources.json
                    │
                    └── OPEN PULL REQUEST  (label: data-refresh)
                          body contains:
                            - Period, FY, fetch timestamp, SHA-256
                            - Metrics table: prev | new | Δ%
                            - Accounting identity results
                            - Revision flag if applicable
                            - Test results
                            - Merge instruction

Human reviews PR → merges
  └── deploy-pages.yml fires on push to main → GitHub Pages updated
```

### 4.2 Fail-Closed Contract

| Failure | Behaviour | Published dataset |
|---|---|---|
| CGA index unreachable | detect.yml exits non-zero, artifact missing | Unchanged |
| `source_shape_unrecognised` | `::warning::` annotation, no dispatch | Unchanged |
| iframe/PDF format change | `ValueError` in `fetch_report()`, refresh.yml fails | Unchanged |
| Missing core metrics in HTML | `ValueError` in `parse_cga_monthly_report()`, refresh.yml fails | Unchanged |
| Accounting identity failure | ingest.py exits 1, refresh.yml fails | Unchanged |
| Any test failure | pytest/npm exits non-zero, refresh.yml fails | Unchanged |
| Plausible-but-wrong value | Delta table surfaced in PR body; human rejects | Unchanged until human merges |
| CGA revision of past month | Revision flag in PR body; human reviews diff | Unchanged until human merges |
| Non-fast-forward push to branch | `git push` fails, branch may be stale | Unchanged |

---

## 5. Phased Implementation Plan

### Phase 0 — Prerequisite Fixes (no new behaviour, ~1 hour)

These are bugs or fragility issues that should be addressed before implementing the new architecture, regardless of which architecture is chosen.

**0-A. Fix `test_pipeline_e2e.py` brittle constants**

File: `pipeline/tests/test_pipeline_e2e.py`

Replace the hard-coded assertions:
```python
# BEFORE (breaks after every new CGA month)
assert data["metadata"]["latestPeriod"] == "apr-jul"
assert data["metadata"]["totalObservations"] == 84
assert len(data["observations"]) == 84
assert len(data["derivedMetrics"]) >= 17
cga_obs = [obs for obs in data["observations"] if obs["estimateType"] == "provisional"]
assert len(cga_obs) == 40
assert periods == {"apr", "apr-may", "apr-jun", "apr-jul"}
assert len(sources) == 5  # 1 BE + 4 CGA months
```

With dynamic assertions:
```python
from pathlib import Path
import re

raw_cga_files = sorted(Path("datasets/raw").glob("cga_*_*.json"))
cga_periods = {json.loads(f.read_text())["reporting_period"] for f in raw_cga_files}
expected_cga_obs = len(cga_periods) * 10  # 10 metrics per period
expected_be_obs = 44
expected_total = expected_be_obs + expected_cga_obs

assert data["metadata"]["latestPeriod"] in cga_periods
assert data["metadata"]["totalObservations"] == expected_total
assert len(data["observations"]) == expected_total
assert {obs["period"] for obs in data["observations"] if obs["estimateType"] == "provisional"} == cga_periods
assert len(sources) == 1 + len(cga_periods)  # 1 BE + N CGA months
```

**0-B. Fix FY-scoped glob in `ingest.py`**

Replace the hardcoded FY in glob patterns:
```python
# ingest.py lines 247, 252-258, 344-346
financial_year = "2026-27"  # → derive from environment or argument
```

For now (Phase 0), introduce a module-level constant read from an environment variable with a fallback:
```python
import os
FINANCIAL_YEAR = os.environ.get("FINANCIAL_YEAR", "2026-27")
```

**0-C. Remove dead `source_url` output from `check_updates.py`**

The key `source_url` (line 71) is written to GITHUB_OUTPUT but never consumed by the workflow. Remove or rename to avoid confusion with `report_url`.

---

### Phase 1 — Shared Library Additions (~3 hours)

These modules are needed by both the existing workflow (Phase 2) and the new workflow (Phase 3).

**1-A. `pipeline/scripts/fy_utils.py`**

```python
"""Financial-year utilities for the CGA refresh pipeline."""

from __future__ import annotations
import os
from datetime import date


def active_financial_year(reference_date: date | None = None) -> str:
    """
    Return the currently active Indian financial year as 'YYYY-YY'.
    The FY starts on 1 April and ends on 31 March.
    Override via FINANCIAL_YEAR env var (e.g., for testing).
    """
    override = os.environ.get("FINANCIAL_YEAR")
    if override:
        return override
    d = reference_date or date.today()
    start = d.year if d.month >= 4 else d.year - 1
    return f"{start}-{str(start + 1)[2:]}"


def fy_start_year(financial_year: str) -> int:
    """Extract the start year from a 'YYYY-YY' financial year string."""
    return int(financial_year.split("-")[0])
```

**1-B. `pipeline/scripts/validate_mom_delta.py`**

```python
"""
Month-on-month delta validator for CGA monthly raw JSON.

Loads the previous available raw JSON, compares every metric value,
and emits a structured report. Raises SystemExit(1) only if any metric
moved by more than HARD_LIMIT_PCT (default 200%), which would indicate
a clear data error. Values within WARN_LIMIT_PCT (default 50%) emit
a warning annotation. Values between WARN and HARD limits are flagged
as needing human review in the PR body.

This module never writes to datasets/ — it only reads and reports.
"""

from __future__ import annotations
import json
import sys
from pathlib import Path

WARN_LIMIT_PCT = 50.0
HARD_LIMIT_PCT = 200.0

FISCAL_MONTH_ORDER = {
    "apr": 0, "may": 1, "jun": 2, "jul": 3, "aug": 4,
    "sep": 5, "oct": 6, "nov": 7, "dec": 8, "jan": 9, "feb": 10, "mar": 11,
}


def _period_rank(period: str) -> int:
    return FISCAL_MONTH_ORDER.get(period.split("-")[-1], -1)


def find_previous_period_file(current_period: str, fy: str, raw_dir: Path) -> Path | None:
    """Return the raw JSON for the most recent period before current_period."""
    current_rank = _period_rank(current_period)
    candidates = []
    for f in raw_dir.glob(f"cga_{fy}_*.json"):
        period = json.loads(f.read_text()).get("reporting_period", "")
        rank = _period_rank(period)
        if 0 <= rank < current_rank:
            candidates.append((rank, f))
    if not candidates:
        return None
    return max(candidates, key=lambda x: x[0])[1]


def validate_mom_delta(
    new_json_path: Path,
    raw_dir: Path | None = None,
    warn_limit: float = WARN_LIMIT_PCT,
    hard_limit: float = HARD_LIMIT_PCT,
) -> dict:
    """
    Compare new CGA JSON against the most recent prior period.
    Returns a structured report dict.
    """
    raw_dir = raw_dir or new_json_path.parent
    new_data = json.loads(new_json_path.read_text())
    current_period = new_data["reporting_period"]
    fy = new_data["financial_year"]

    prev_file = find_previous_period_file(current_period, fy, raw_dir)
    if prev_file is None:
        return {
            "status": "no_previous_period",
            "current_period": current_period,
            "previous_period": None,
            "deltas": [],
            "warnings": [],
            "hard_failures": [],
        }

    prev_data = json.loads(prev_file.read_text())
    prev_period = prev_data["reporting_period"]
    new_values = new_data["data"]
    prev_values = prev_data["data"]

    deltas = []
    warnings = []
    hard_failures = []

    for metric, new_val in new_values.items():
        prev_val = prev_values.get(metric)
        if prev_val is None:
            deltas.append({"metric": metric, "prev": None, "new": new_val, "delta_pct": None, "flag": "new_metric"})
            continue
        if prev_val == 0:
            delta_pct = None
            flag = "prev_zero"
        else:
            delta_pct = (new_val - prev_val) / abs(prev_val) * 100
            if abs(delta_pct) > hard_limit:
                flag = "hard_failure"
                hard_failures.append(metric)
            elif abs(delta_pct) > warn_limit:
                flag = "warning"
                warnings.append(metric)
            else:
                flag = "ok"
        deltas.append({
            "metric": metric,
            "prev": prev_val,
            "new": new_val,
            "delta_pct": round(delta_pct, 2) if delta_pct is not None else None,
            "flag": flag,
        })

    return {
        "status": "hard_failure" if hard_failures else ("warnings" if warnings else "ok"),
        "current_period": current_period,
        "previous_period": prev_period,
        "deltas": deltas,
        "warnings": warnings,
        "hard_failures": hard_failures,
    }
```

**1-C. `pipeline/scripts/revision_detector.py`**

```python
"""
Detect whether a newly-fetched CGA period overwrites an already-committed period.
A revision is when cga_{fy}_{mon}.json already exists in the repo and any metric
value differs from the newly-fetched value.
"""

from __future__ import annotations
import json
from pathlib import Path


def detect_revision(new_data: dict, existing_path: Path) -> dict:
    """Compare new_data against existing raw JSON. Returns revision report."""
    if not existing_path.exists():
        return {"is_revision": False, "period": new_data.get("reporting_period"), "changes": []}

    existing = json.loads(existing_path.read_text())
    existing_values = existing.get("data", {})
    new_values = new_data.get("data", {})
    changes = []

    for metric, new_val in new_values.items():
        old_val = existing_values.get(metric)
        if old_val is not None and old_val != new_val:
            changes.append({"metric": metric, "old": old_val, "new": new_val})

    return {
        "is_revision": len(changes) > 0,
        "period": new_data.get("reporting_period"),
        "changes": changes,
    }
```

---

### Phase 2 — Update Existing Workflow (`check-fiscal-sources.yml`)

This step wires the new library into the current monolithic workflow to close the critical gaps while the new PR workflow (Phase 3) is being developed.

```yaml
# .github/workflows/check-fiscal-sources.yml  (updated sections only)

      - name: Fetch and normalize a newer CGA report
        if: steps.source-check.outputs.status == 'new_release'
        env:
          REPORTING_PERIOD: ${{ steps.source-check.outputs.reporting_period }}
          REPORT_URL: ${{ steps.source-check.outputs.report_url }}
          FINANCIAL_YEAR: ${{ steps.source-check.outputs.financial_year }}  # NEW
        run: |
          report_end="${REPORTING_PERIOD##*-}"
          PYTHONPATH=. python -m pipeline.scripts.refresh_cga \
            --report-url "$REPORT_URL" \
            --output "datasets/raw/cga_${FINANCIAL_YEAR}_${report_end}.json" \
            --archive-html "datasets/raw/cga_${FINANCIAL_YEAR}_${report_end}.html" \
            --financial-year "$FINANCIAL_YEAR"          # NEW

      - name: Run month-on-month delta validation    # NEW STEP
        if: steps.source-check.outputs.status == 'new_release'
        env:
          REPORTING_PERIOD: ${{ steps.source-check.outputs.reporting_period }}
          FINANCIAL_YEAR: ${{ steps.source-check.outputs.financial_year }}
        run: |
          report_end="${REPORTING_PERIOD##*-}"
          PYTHONPATH=. python -m pipeline.scripts.validate_mom_delta \
            --json-path "datasets/raw/cga_${FINANCIAL_YEAR}_${report_end}.json" \
            --report-path mom-delta-report.json
          # Exits 1 only on hard failures (>200% delta); warnings are annotations only
```

Add `--archive-html` argument to `refresh_cga.py`:

```python
# refresh_cga.py additions
import hashlib

def refresh_report(report_url, output_path, archive_html_path=None, financial_year=None):
    from pipeline.scripts.fy_utils import active_financial_year
    fy = financial_year or active_financial_year()
    source_html = fetch_report(report_url)

    # Archive raw HTML
    if archive_html_path:
        archive_html_path = Path(archive_html_path)
        archive_html_path.parent.mkdir(parents=True, exist_ok=True)
        archive_html_path.write_text(source_html, encoding="utf-8")
        sha256 = hashlib.sha256(source_html.encode("utf-8")).hexdigest()
        provenance = {
            "url": report_url,
            "fetched_at": datetime.utcnow().isoformat() + "Z",
            "sha256_html": sha256,
            "archive_path": str(archive_html_path),
        }
        archive_html_path.with_suffix(".provenance.json").write_text(
            json.dumps(provenance, indent=2) + "\n", encoding="utf-8"
        )

    source = parse_cga_monthly_report(source_html, report_url=report_url,
                                       financial_year=fy, retrieved_at=date.today().isoformat())
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(source, indent=2) + "\n", encoding="utf-8")
    return source
```

---

### Phase 3 — New PR Workflow (`detect.yml` + `refresh.yml`)

#### 3-A. `detect.yml`

```yaml
name: Detect new CGA release

on:
  schedule:
    - cron: '20 5 * * *'    # 05:20 UTC daily
  workflow_dispatch:

permissions:
  contents: read
  actions: write            # needed to trigger refresh.yml

concurrency:
  group: cga-detect
  cancel-in-progress: true

jobs:
  detect:
    runs-on: ubuntu-latest
    outputs:
      status: ${{ steps.check.outputs.status }}
      reporting_period: ${{ steps.check.outputs.reporting_period }}
      report_url: ${{ steps.check.outputs.report_url }}
      financial_year: ${{ steps.check.outputs.financial_year }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Check official CGA release index
        id: check
        run: |
          PYTHONPATH=. python -m pipeline.scripts.check_updates \
            --report-path source-update-report.json

      - name: Upload diagnostic artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cga-source-report
          path: source-update-report.json
          if-no-files-found: warn

      - name: Warn on unrecognised source shape
        if: steps.check.outputs.status == 'source_shape_unrecognised'
        run: echo "::warning::CGA release index returned an unrecognised page shape. Manual inspection required."

      - name: Trigger refresh workflow
        if: steps.check.outputs.status == 'new_release'
        uses: benc-uk/workflow-dispatch@v1      # or gh CLI equivalent
        with:
          workflow: refresh.yml
          inputs: |
            {
              "reporting_period": "${{ steps.check.outputs.reporting_period }}",
              "report_url": "${{ steps.check.outputs.report_url }}",
              "financial_year": "${{ steps.check.outputs.financial_year }}"
            }
```

#### 3-B. `refresh.yml`

```yaml
name: Refresh CGA monthly data (PR workflow)

on:
  workflow_dispatch:
    inputs:
      reporting_period:
        description: 'Cumulative period, e.g. apr-aug'
        required: true
      report_url:
        description: 'CGA monthly report URL'
        required: true
      financial_year:
        description: 'Financial year, e.g. 2026-27'
        required: true

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: cga-refresh
  cancel-in-progress: false   # never cancel mid-refresh; queue instead

env:
  FINANCIAL_YEAR: ${{ inputs.financial_year }}
  REPORTING_PERIOD: ${{ inputs.reporting_period }}
  REPORT_URL: ${{ inputs.report_url }}

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm

      - name: Install system dependencies
        run: sudo apt-get update && sudo apt-get install -y poppler-utils

      - name: Install Python dependencies
        run: python -m pip install -r requirements-dev.txt

      - name: Install frontend dependencies
        run: npm ci

      # --- CREATE BRANCH ---
      - name: Create refresh branch
        run: |
          MONTH_END="${REPORTING_PERIOD##*-}"
          BRANCH="refresh/cga-$(date -u +%Y-%m)-${MONTH_END}"
          echo "BRANCH=$BRANCH" >> "$GITHUB_ENV"
          git checkout -b "$BRANCH"

      # --- FETCH & ARCHIVE ---
      - name: Fetch and archive CGA report
        id: fetch
        run: |
          MONTH_END="${REPORTING_PERIOD##*-}"
          PYTHONPATH=. python -m pipeline.scripts.refresh_cga \
            --report-url "$REPORT_URL" \
            --output "datasets/raw/cga_${FINANCIAL_YEAR}_${MONTH_END}.json" \
            --archive-html "datasets/raw/cga_${FINANCIAL_YEAR}_${MONTH_END}.html" \
            --financial-year "$FINANCIAL_YEAR"
          echo "raw_json=datasets/raw/cga_${FINANCIAL_YEAR}_${MONTH_END}.json" >> "$GITHUB_OUTPUT"
          echo "month_end=${MONTH_END}" >> "$GITHUB_OUTPUT"

      # --- REVISION DETECTION ---
      - name: Detect revision of previously-committed period
        id: revision
        run: |
          PYTHONPATH=. python -m pipeline.scripts.revision_detector \
            --json-path "${{ steps.fetch.outputs.raw_json }}" \
            --report-path revision-report.json

      # --- MOM DELTA VALIDATION ---
      - name: Month-on-month delta validation
        id: delta
        run: |
          PYTHONPATH=. python -m pipeline.scripts.validate_mom_delta \
            --json-path "${{ steps.fetch.outputs.raw_json }}" \
            --report-path mom-delta-report.json
          # Hard exit on >200% delta; warnings are non-fatal

      # --- INGESTION & IDENTITY CHECKS ---
      - name: Regenerate processed datasets
        run: |
          PYTHONPATH=. python -m pipeline.scripts.ingest

      # --- TEST SUITE ---
      - name: Python tests
        run: PYTHONPATH=. python -m pytest -q

      - name: Frontend tests
        run: npm test -- --run

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      # --- COMMIT TO BRANCH ---
      - name: Commit candidate data
        run: |
          MONTH_END="${{ steps.fetch.outputs.month_end }}"
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add \
            "datasets/raw/cga_${FINANCIAL_YEAR}_${MONTH_END}.html" \
            "datasets/raw/cga_${FINANCIAL_YEAR}_${MONTH_END}.provenance.json" \
            "datasets/raw/cga_${FINANCIAL_YEAR}_${MONTH_END}.json" \
            datasets/processed/union/budget-summary-*.json \
            datasets/metadata/sources.json
          git commit -m "chore(data): candidate CGA refresh through ${REPORTING_PERIOD}"
          git push origin "$BRANCH"

      # --- OPEN PR ---
      - name: Generate PR body
        id: pr_body
        run: |
          python -c "
          import json, sys
          delta = json.load(open('mom-delta-report.json'))
          revision = json.load(open('revision-report.json'))
          rows = '\n'.join(
            f'| {d[\"metric\"]} | {d[\"prev\"]} | {d[\"new\"]} | {d[\"delta_pct\"]}% | {d[\"flag\"]} |'
            for d in delta['deltas']
          )
          rev_note = '⚠️ REVISION DETECTED — this period was previously committed. Review changes carefully.' if revision['is_revision'] else '✅ New period (no prior commit for this month).'
          body = f'''## CGA Data Refresh: {delta['current_period']} ({delta['current_period']})

          {rev_note}

          ### Metrics vs previous period ({delta.get('previous_period', 'N/A')})
          | Metric | Prev | New | Δ% | Status |
          |---|---|---|---|---|
          {rows}

          ### Merge checklist
          - [ ] Deltas are consistent with expected seasonal patterns
          - [ ] Revision flag reviewed (if raised)
          - [ ] Test suite passed (see CI steps above)
          - [ ] CGA source URL verified manually if uncertain
          '''
          with open('pr-body.md', 'w') as f:
              f.write(body)
          "

      - name: Open pull request
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ env.BRANCH }}
          base: main
          title: "data: CGA refresh through ${{ inputs.reporting_period }}"
          body-path: pr-body.md
          labels: data-refresh
```

---

### Phase 4 — Retire the Monolithic Auto-Commit

Once `refresh.yml` is live and has been tested with one month's actual data:

1. Remove the `Fetch and normalize`, `Regenerate and validate`, and `Publish validated dataset refresh` steps from `check-fiscal-sources.yml`.
2. Remove the Pages upload/deploy steps from `check-fiscal-sources.yml` (these are now handled by `deploy-pages.yml` on PR merge).
3. Rename `check-fiscal-sources.yml` to `detect.yml` or replace it with the new `detect.yml` from Phase 3.
4. Archive the old workflow in git history — no code deleted, just no longer active.

---

### Phase 5 — Hardening and Observability (~2–3 hours, optional)

**5-A. `check_updates.py` — emit `financial_year` output**

The workflow currently relies on the hardcoded `--financial-year` default in `refresh_cga.py`. After Phase 1 adds `fy_utils.py`, teach `check_updates.py` to compute and emit the active FY:

```python
from pipeline.scripts.fy_utils import active_financial_year
_write_github_output({
    "financial_year": active_financial_year(),
    ...
})
```

**5-B. `.gitattributes` for archive HTML**

```
datasets/raw/*.html linguist-generated=true linguist-detectable=false
```

This prevents the archived HTML from inflating language stats and diff views.

**5-C. `validate_mom_delta.py` — seasonal baseline override**

For known seasonal patterns (e.g., capital expenditure is always very low in April–May and spikes in Q3–Q4), allow an optional `mom_delta_overrides.json` that loosens the warning threshold per metric per quarter. This prevents spurious PR body warnings for expected seasonal swings.

**5-D. `conftest.py` fixture — dynamic FY from environment**

```python
# pipeline/tests/conftest.py
import os, pytest
@pytest.fixture(scope="session")
def financial_year():
    return os.environ.get("FINANCIAL_YEAR", "2026-27")
```

Use this fixture in any test that loads raw files by FY pattern.

---

## 6. Files Changed Summary

| File | Action | Phase |
|---|---|---|
| `pipeline/tests/test_pipeline_e2e.py` | Fix brittle period/count assertions | 0-A |
| `pipeline/scripts/ingest.py` | Replace hardcoded FY with `FINANCIAL_YEAR` env | 0-B |
| `pipeline/scripts/check_updates.py` | Remove unused `source_url` output; add `financial_year` output | 0-C / 5-A |
| `pipeline/scripts/fy_utils.py` | **New** — FY computation from system date | 1-A |
| `pipeline/scripts/validate_mom_delta.py` | **New** — MoM delta validator | 1-B |
| `pipeline/scripts/revision_detector.py` | **New** — same-period overwrite detector | 1-C |
| `pipeline/scripts/refresh_cga.py` | Add `--archive-html`, `--financial-year`, import `fy_utils` | 2 |
| `.github/workflows/check-fiscal-sources.yml` | Add archive + delta steps; add `financial_year` env | 2 |
| `.github/workflows/detect.yml` | **New** — daily detection + dispatch | 3-A |
| `.github/workflows/refresh.yml` | **New** — PR-based refresh workflow | 3-B |
| `.github/workflows/check-fiscal-sources.yml` | Remove auto-commit steps | 4 |
| `.gitattributes` | Mark archived HTML as generated | 5-B |
| `pipeline/tests/conftest.py` | Dynamic FY fixture | 5-D |

---

## 7. Failure-Mode Closure Table

| ID | Failure | Status after implementation |
|---|---|---|
| F-01 | Naming mismatch `report_url` vs `REPORT_URL` | ✅ Closed (Phase 0-C) |
| F-02 | CGA row label change | ✅ Already caught loudly — retained |
| F-03 | Nested iframe / PDF | ✅ Already caught loudly — retained |
| F-04 | Maintenance page served as 200 OK | ✅ Already caught loudly — retained |
| F-05 | Silent revision overwrite | ✅ Closed — revision_detector.py surfaces in PR body |
| F-06 | Plausible-but-wrong values | ✅ Closed — MoM delta in PR body; human must review |
| F-07 | Network timeout | ✅ Already safe — retained |
| F-08 | Hardcoded FY blocks new year | ✅ Closed — fy_utils.py auto-derives FY |
| F-09 | E2E test pinned constants | ✅ Closed — dynamic assertions (Phase 0-A) |
| F-10 | Concurrent workflow runs | ✅ Already safe — retained |
| F-11 | Non-fast-forward push | ✅ Isolated to branch — main unaffected |
| F-12 | Partial commit on mid-sequence failure | ✅ Isolated to branch — main unaffected |

---

## 8. Implementation Order and Effort

| Phase | Description | Estimated effort | Risk |
|---|---|---|---|
| 0 | Prerequisite fixes | ~1 hour | Very low — pure test/constant fixes |
| 1 | Shared library additions | ~3 hours | Low — no workflow changes yet |
| 2 | Update existing workflow | ~1 hour | Low — additive only |
| 3 | New PR workflow | ~4 hours | Medium — new YAML, test with actual CGA month |
| 4 | Retire auto-commit | ~30 minutes | Low — after Phase 3 is validated |
| 5 | Hardening | ~2 hours | Very low — optional |

**Total estimated effort: ~12 hours**

Start with Phase 0 (the tests will break again with the next CGA month regardless), then Phase 1, then 2 and 3 together, then 4 when confidence is established.

---

## 9. Notes for Future FY Rotation (April each year)

With this architecture in place, the only action required when FY rolls over (1 April) is:

1. Add `union_budget_{new_fy}_be.json` to `datasets/raw/` with the new Budget Estimates (manual transcription from the February Budget PDF — unchanged from current practice).
2. Confirm `fy_utils.active_financial_year()` returns the correct FY on or after 1 April.
3. The next CGA release (typically April data, published in June) will automatically use the new FY in all filenames and processed outputs.

No other code changes are needed for FY rotation.

---

## 10. Operational Guide

### 10.1 What happens when a normal new month appears
1. **Daily Detection (`detect.yml`)**: Runs automatically at 05:20 UTC (or via manual `workflow_dispatch`).
2. **Release Inspection**: `check_updates.py` checks `https://cga.nic.in/Index.aspx` and compares the latest published release against `metadata.latestPeriod` in `datasets/processed/union/budget-summary-{FY}.json`.
3. **Dispatch**: Upon finding a new release (e.g. `apr-aug`), it outputs `status=new_release` and triggers `refresh.yml` with `reporting_period`, `report_url`, and `financial_year`.
4. **Candidate Branch**: `refresh.yml` reuses the stable branch `refresh/cga-{financial_year}-{month_end}` and updates an existing open PR for that period.
5. **Fetch & Archive**: Fetches the official CGA HTML, saves the current source to `datasets/raw/cga_{FY}_{month_end}.html`, and records its SHA-256 provenance. If the stable path already contains different bytes, those prior bytes are retained at `datasets/raw/archive/cga_{FY}_{month_end}-{sha256}.html`.
6. **Parsing & Validation**: Normalizes the 10 core metrics into `cga_{FY}_{month_end}.json`, checks month-over-month deltas, executes full ingestion (`ingest.py`), and validates all accounting identities.
7. **Test Suite**: Executes `pytest`, `run_tests.py`, and the full frontend test suite (`npm test`, `typecheck`, `lint`, `build`).
8. **Candidate PR**: Only after every check passes, commits candidate artifacts to the candidate branch and opens a Pull Request with the `data-refresh` label.
9. **Publication**: Nothing is published to `main` or GitHub Pages automatically. Once the PR is reviewed and merged by a human, `deploy-pages.yml` builds and publishes the updated website.

### 10.2 When CGA revises an old month
1. **Revision Detection**: When `refresh.yml` runs on an existing reporting period (or when re-run on a month whose source bytes changed), `revision_detector.py` checks both data metric differences and HTML provenance hashes against the committed records.
2. **Provenance Hash Check**: If CGA altered the source document without changing metric values (or if numbers changed), `source_hash_changed=True` or `is_revision=True` is flagged.
3. **Audited Diff in PR**: The generated PR body prominently flags `🔄 Revision of previously committed period` and displays a detailed before/after diff of all altered metrics.
4. **Human Review**: The reviewer can inspect the exact revisions and verify them against the official CGA portal before merging.

### 10.3 When parsing fails
1. **Fails Closed**: If the CGA website is down, the report page structure changes, the iframe source is missing, or required core metrics are renamed/absent, the parser raises an immediate `ValueError`.
2. **Zero Ingestion / Zero Commit**: The workflow terminates before reaching the ingestion or commit steps. No branch is pushed, no candidate files are committed, and no PR is opened.
3. **Diagnostic Alert**: A workflow failure alert is generated in GitHub Actions with exact error traces and uploaded artifacts for inspection. The public dataset on `main` and GitHub Pages remains 100% untouched and healthy.

### 10.4 What to review before merging a refresh PR
Before approving and merging a candidate refresh PR, check the following items in the PR description:
- [ ] **Source URL & Retrieval Date**: Verify the URL points to the legitimate `cga.nic.in/MonthlyReport/Published/...` endpoint.
- [ ] **Source Content Hash**: Confirm the SHA-256 hash is recorded in `datasets/raw/cga_{FY}_{month}.provenance.json`.
- [ ] **Reporting Period & Financial Year**: Verify the month (e.g. `apr-aug`) and FY (e.g. `2026-27`) match the official CGA release.
- [ ] **Metric Delta Table**: Review the before-and-after values. Check any metrics flagged with `⚠️` (deltas > 75%). Confirm that capital expenditure swings or tax revenue jumps align with known fiscal calendar patterns (e.g. Q2/Q3 tax advance installments or H2 capital disbursements).
- [ ] **Revision Flag**: If marked as `🔄 Revision`, review the changed metric rows to understand what CGA altered in historical figures.
- [ ] **Accounting Identities**: Confirm all accounting identities (Fiscal Deficit = Total Expenditure − Non-Borrowed Receipts, etc.) show `✅ PASS`.
- [ ] **CI Checks**: Ensure all GitHub Actions checks (Python tests, Vitest tests, TypeScript compilation, ESLint, Vite build) are green.
