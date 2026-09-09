"""Check official source releases without changing the published dataset."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path

from pipeline.source_updates import (
    CGA_RELEASE_INDEX_URL,
    compare_release_to_dataset,
    fetch_source_index,
    latest_cga_release,
    monthly_report_url,
)


DATASET_PATH = Path("datasets/processed/union/budget-summary-2026-27.json")


def _write_github_output(values: dict[str, str]) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return
    with open(output_path, "a", encoding="utf-8") as output:
        for key, value in values.items():
            output.write(f"{key}={value}\n")


def check_updates(dataset_path: Path = DATASET_PATH, index_url: str = CGA_RELEASE_INDEX_URL) -> dict:
    with dataset_path.open(encoding="utf-8") as dataset_file:
        dataset = json.load(dataset_file)

    source_html = fetch_source_index(index_url)
    release = latest_cga_release(source_html, index_url)
    report = compare_release_to_dataset(release, dataset)
    if release:
        report["release"]["reportUrl"] = monthly_report_url(release, dataset.get("financialYear", "2026-27"))
    report["checkedAt"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    report["sourceIndex"] = index_url
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report-path", type=Path, help="Write the JSON report to this path")
    args = parser.parse_args()

    try:
        report = check_updates()
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as error:
        print(f"Source check failed: {error}")
        return 1

    if args.report_path:
        args.report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    release = report.get("release") or {}
    print(f"Source status: {report['status']}")
    print(f"Current period: {report.get('currentPeriod') or 'unknown'}")
    if release:
        print(f"Latest release: {release['title']} ({release['url']})")
    print(report["nextAction"])

    _write_github_output(
        {
            "status": report["status"],
            "reporting_period": release.get("reportingPeriod", ""),
            "source_url": release.get("url", ""),
            "report_url": release.get("reportUrl", ""),
            "source_title": release.get("title", ""),
        }
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
