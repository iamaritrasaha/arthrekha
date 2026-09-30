#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.models import FinancialObservation, DataSource
from pipeline.validators import validate_deficit_identities

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--revision-report', required=True, type=Path)
    p.add_argument('--delta-report', required=True, type=Path)
    p.add_argument('--raw-json', required=True, type=Path)
    p.add_argument('--output', required=True, type=Path)
    args = p.parse_args()

    rev_report = json.loads(args.revision_report.read_text())
    delta_report = json.loads(args.delta_report.read_text())
    raw_data = json.loads(args.raw_json.read_text())

    period = raw_data.get('reporting_period', 'unknown')
    fy = raw_data.get('financial_year', 'unknown')
    classification = rev_report.get('classification')
    if classification not in {'new_period', 'unchanged_existing_period', 'revision'}:
        # Compatibility for reports created before classification was added.
        classification = 'revision' if rev_report.get('is_revision', False) else (
            'new_period' if rev_report.get('is_new_period', True) else 'unchanged_existing_period'
        )
    is_revision = classification == 'revision'

    prov_file = args.raw_json.with_suffix('.provenance.json')
    url = "Unknown"
    sha256 = "Unknown"
    fetched_at = "Unknown"

    if prov_file.exists():
        prov = json.loads(prov_file.read_text())
        url = prov.get('url', 'Unknown')
        sha256 = prov.get('sha256_html_utf8', 'Unknown')
        fetched_at = prov.get('fetched_at', 'Unknown')

    body = []
    body.append(f"# CGA Data Refresh — {period} ({fy})\n")
    type_str = {
        'new_period': '🆕 New reporting period',
        'unchanged_existing_period': '↔️ Unchanged existing period',
        'revision': '🔄 Revision of previously committed period',
    }[classification]
    body.append(f"**Type:** {type_str}")
    body.append(f"**Source URL:** {url}")
    body.append(f"**Source hash (SHA-256 of HTML, UTF-8):** `{sha256}`")
    body.append(f"**Fetched at:** {fetched_at}")
    body.append(f"**Reporting period:** {period}")
    body.append(f"**Financial year:** {fy}\n")

    body.append("## Source provenance")
    if prov_file.exists():
        body.append(f"Provenance sidecar available at `{prov_file.name}`.\n")
    else:
        body.append("No provenance sidecar available.\n")

    body.append("## Metric values")
    body.append("| Metric | Previous | New | Absolute Δ | Δ% | Review |")
    body.append("|---|---|---|---|---|---|")

    for d in delta_report.get('deltas', []):
        metric = d.get('metric')
        prev = d.get('prev')
        new_val = d.get('new')
        delta_pct = d.get('delta_pct')
        flag = d.get('flag')

        abs_delta = round(new_val - prev, 2) if (prev is not None and new_val is not None) else 'N/A'
        pct_str = f"{delta_pct}%" if delta_pct is not None else 'N/A'

        review = '✅'
        if flag == 'warning': review = '⚠️'
        elif flag == 'severe_warning': review = '🚨 Severe review warning'

        body.append(f"| {metric} | {prev} | {new_val} | {abs_delta} | {pct_str} | {review} |")

    if is_revision:
        body.append("\n## Revision details")
        body.append("| Metric | Old value | New value |")
        body.append("|---|---|---|")
        for ch in rev_report.get('changes', []):
            body.append(f"| {ch['metric']} | {ch['old']} | {ch['new']} |")

    body.append("\n## Accounting identity checks")
    body.append("| Identity | Status |")
    body.append("|---|---|")

    observations = []
    for metric, amount in raw_data.get('data', {}).items():
        observations.append(
            FinancialObservation(
                jurisdiction="india", jurisdiction_type="union", financial_year=fy, period_type="annual",
                period=period, metric=metric, amount=float(amount), estimate_type="provisional",
                source=DataSource(organization="CGA", document="Report", data_status="provisional")
            )
        )

    identities = validate_deficit_identities(observations).get('checks', [])
    all_passed = True
    for res in identities:
        status_str = "✅ PASS" if res.get('reconciles') else "❌ FAIL"
        if not res.get('reconciles'): all_passed = False
        body.append(f"| {res.get('metric')} | {status_str} |")

    body.append("\n## Files changed")
    body.append(f"- `datasets/raw/cga_{fy}_{period.split('-')[-1]}.json` — raw structured data")
    body.append(f"- `datasets/raw/cga_{fy}_{period.split('-')[-1]}.html` — archived source HTML")
    body.append(f"- `datasets/raw/cga_{fy}_{period.split('-')[-1]}.provenance.json` — source provenance")
    body.append(f"- `datasets/processed/union/budget-summary-{fy}.json` — regenerated processed data")
    body.append(f"- `datasets/metadata/sources.json` — updated source manifest")

    body.append("\n## Reviewer checklist")
    body.append("- [ ] Metric deltas are consistent with expected seasonal patterns")
    body.append("- [ ] Source URL resolves to the official CGA report page")
    if is_revision:
        body.append("- [ ] Revision changes reviewed and verified against official source")
    warned = delta_report.get('warned_metrics', [])
    warned += delta_report.get('severe_warning_metrics', [])
    if warned:
        body.append(f"- [ ] Large delta metrics reviewed: {', '.join(warned)}")
    body.append(f"- [{'x' if all_passed else ' '}] All accounting identities passed")
    body.append("- [ ] Test suite passed (see CI steps)")

    args.output.write_text('\n'.join(body))

if __name__ == '__main__':
    main()
