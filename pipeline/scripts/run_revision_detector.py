#!/usr/bin/env python3
"""CLI wrapper for revision detection — called from refresh.yml.

The provenance sidecar (.provenance.json) written by refresh_cga.py contains
the SHA-256 of the newly fetched HTML. This script reads that hash and passes
it to detect_revision so hash comparison is accurate even after the sidecar
has been written to the same path as the committed provenance.
"""
import argparse
import json
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.scripts.revision_detector import detect_revision


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--json-path', required=True, type=Path)
    p.add_argument('--raw-dir', type=Path, default=Path('datasets/raw'))
    p.add_argument('--report-path', required=True, type=Path)
    args = p.parse_args()

    data = json.loads(args.json_path.read_text(encoding='utf-8'))

    # Extract the new SHA-256 from the provenance sidecar written by refresh_cga.py.
    # The sidecar is written to <json_path_stem>.provenance.json alongside the JSON.
    prov_path = args.json_path.parent / (args.json_path.stem + '.provenance.json')
    new_sha256: str | None = None
    if prov_path.exists():
        try:
            prov = json.loads(prov_path.read_text(encoding='utf-8'))
            new_sha256 = prov.get('sha256_html_utf8')
        except (json.JSONDecodeError, OSError):
            pass

    report = detect_revision(data, args.raw_dir, new_sha256=new_sha256)
    args.report_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')

    print(
        f"classification={report['classification']}, "
        f"is_revision={report['is_revision']}, is_new_period={report['is_new_period']}"
    )
    if report['source_hash_changed']:
        print(
            f"::warning::Source HTML hash changed for {report['period']} — "
            "CGA may have silently revised the document."
        )
    if report['is_revision']:
        changed = [c['metric'] for c in report['changes']]
        print(f"::notice::Data revision detected for {report['period']}. Changed metrics: {changed}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
