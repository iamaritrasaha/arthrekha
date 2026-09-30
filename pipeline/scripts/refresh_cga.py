"""Fetch and normalize one official CGA monthly report."""

from __future__ import annotations

import argparse
from datetime import date
import datetime
import json
import hashlib
from pathlib import Path
import re
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from pipeline.parsers.cga_html import parse_cga_monthly_report
from pipeline.scripts.fy_utils import active_financial_year


def fetch_url(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Arthrekha-source-refresh/1.0"})
    with urlopen(request, timeout=45) as response:
        raw = response.read()
    for encoding in ("utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("unknown", raw, 0, 1, "Could not decode CGA report")


def fetch_report(url: str) -> str:
    """Fetch the monthly report page and follow its published iframe."""
    page = fetch_url(url)
    iframe = re.search(r"<iframe\b[^>]*\bsrc\s*=\s*(['\"])(.*?)\1", page, flags=re.IGNORECASE | re.DOTALL)
    if iframe:
        return fetch_url(urljoin(url, iframe.group(2)))
    if re.search(r"AS\s+AT\s+THE\s+END\s+OF", page, flags=re.IGNORECASE):
        return page
    raise ValueError("CGA monthly report page did not expose its report document")


def refresh_report(
    report_url: str,
    output_path: Path,
    financial_year: str | None = None,
    archive_html_path: Path | None = None,
) -> dict:
    if financial_year is None:
        financial_year = active_financial_year()

    source_html = fetch_report(report_url)

    if archive_html_path:
        archive_html_path.parent.mkdir(parents=True, exist_ok=True)
        new_hash = hashlib.sha256(source_html.encode('utf-8')).hexdigest()
        # Keep every previously accepted source recoverable when the stable
        # period path is replaced by a CGA revision.
        if archive_html_path.exists():
            old_bytes = archive_html_path.read_bytes()
            old_hash = hashlib.sha256(old_bytes).hexdigest()
            if old_hash != new_hash:
                archive_dir = archive_html_path.parent / 'archive'
                archive_dir.mkdir(parents=True, exist_ok=True)
                archived_old = archive_dir / f'{archive_html_path.stem}-{old_hash}.html'
                if not archived_old.exists():
                    archived_old.write_bytes(old_bytes)
        archive_html_path.write_text(source_html, encoding='utf-8')
        sha256 = new_hash

    source = parse_cga_monthly_report(
        source_html,
        report_url=report_url,
        financial_year=financial_year,
        retrieved_at=date.today().isoformat(),
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(source, indent=2) + "\n", encoding="utf-8")

    if archive_html_path:
        prov_path = archive_html_path.with_suffix('.provenance.json')
        prov_data = {
            "url": report_url,
            "fetched_at": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
            "sha256_html_utf8": sha256,
            "reporting_period": source.get("reporting_period"),
            "financial_year": financial_year,
            "parser": "pipeline.parsers.cga_html",
            "parser_version": "1.0",
            "archive_path": str(archive_html_path)
        }
        prov_path.write_text(json.dumps(prov_data, indent=2) + "\n", encoding="utf-8")

    return source


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report-url", required=True)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--financial-year", default=None)
    parser.add_argument("--archive-html", type=Path, default=None)
    args = parser.parse_args()

    source = refresh_report(args.report_url, args.output, args.financial_year, args.archive_html)
    print(f"Wrote {args.output}")
    print(f"Period: {source['reporting_period']}")
    print(f"Metrics: {len(source['data'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
