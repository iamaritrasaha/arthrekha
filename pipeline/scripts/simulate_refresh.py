import json
import traceback
import tempfile
from pathlib import Path
from pipeline.tests.test_cga_html import JULY_REPORT
from pipeline.scripts.refresh_cga import refresh_report
from pipeline.scripts.validate_mom_delta import validate_mom_delta
from pipeline.scripts.revision_detector import detect_revision
from pipeline.validators import validate_deficit_identities
from pipeline.parsers.cga_html import parse_cga_monthly_report

def main():
    print("=== SIMULATING ARCHIVAL FLOW ===")

    with tempfile.TemporaryDirectory() as td:
        tmp_dir = Path(td)
        output_json = tmp_dir / 'cga_2026-27_jul_sim.json'
        archive_html = tmp_dir / 'cga_2026-27_jul_sim.html'

        # We need to monkeypatch fetch_report, or just use parse_cga_monthly_report directly and write files
        # Actually refresh_report calls fetch_report internally. Let's patch it.
        import pipeline.scripts.refresh_cga
        pipeline.scripts.refresh_cga.fetch_report = lambda url: JULY_REPORT

        source = pipeline.scripts.refresh_cga.refresh_report('http://example.com/sim', output_json, '2026-27', archive_html)

        print(f"Generated JSON: {output_json}")
        print(f"Archived HTML: {archive_html}")
        prov_path = archive_html.with_suffix('.provenance.json')
        print(f"Provenance sidecar: {prov_path}")

        raw_dir = Path("datasets/raw")

        print("\n=== MoM DELTA VALIDATION ===")
        # Uses existing raw_dir (so it finds jun)
        delta_report = validate_mom_delta(source, raw_dir)
        print(json.dumps(delta_report, indent=2))

        print("\n=== REVISION DETECTION ===")
        # Uses existing raw_dir (so it finds jul)
        new_prov = json.loads(archive_html.with_suffix('.provenance.json').read_text())
        rev_report = detect_revision(source, raw_dir, new_sha256=new_prov.get('sha256_html_utf8'))
        print(json.dumps(rev_report, indent=2))

        print("\n=== ACCOUNTING IDENTITIES ===")
        from pipeline.models import FinancialObservation, DataSource
        # We just need to mock an observation set for identity check
        observations = []
        for metric, amount in source['data'].items():
            obs = FinancialObservation(
                jurisdiction="india", jurisdiction_type="union", financial_year="2026-27", period_type="annual",
                period="apr-jul", metric=metric, amount=float(amount), estimate_type="provisional",
                source=DataSource(organization="CGA", document="Sim", data_status="provisional")
            )
            observations.append(obs)
        identities = validate_deficit_identities(observations).get('checks', [])
        print("Identities checked:", len(identities))
        for res in identities:
            print(f"{res.get('metric')}: {'PASS' if res.get('reconciles') else 'FAIL'}")


        print("\n=== GENERATED PR BODY ===")
        import os
        import subprocess
        import sys
        out_md = tmp_dir / 'out.md'
        rev_json = tmp_dir / 'rev.json'
        rev_json.write_text(json.dumps(rev_report))
        delta_json = tmp_dir / 'delta.json'
        delta_json.write_text(json.dumps(delta_report))
        env = dict(os.environ, PYTHONPATH=str(Path(__file__).resolve().parents[2]))
        subprocess.run(
            [sys.executable, 'pipeline/scripts/generate_pr_body.py', '--revision-report', str(rev_json), '--delta-report', str(delta_json), '--raw-json', str(output_json), '--output', str(out_md)],
            check=True,
            env=env,
        )
        print(out_md.read_text())
    print("\n=== MALFORMED HTML DEMO ===")
    # Remove the period heading so the parser cannot detect the month
    bad_html = JULY_REPORT.replace("AS AT THE END OF JULY 2026", "SOME HEADING WITHOUT A DATE")
    try:
        parse_cga_monthly_report(bad_html, report_url='http://example', financial_year='2026-27')
    except Exception as e:
        print(f"Caught expected exception for missing period heading: {e}")

    print("\n=== MISSING CORE METRIC DEMO ===")
    bad_html2 = JULY_REPORT.replace("Revenue Receipts", "Some Other Receipts")
    try:
        parse_cga_monthly_report(bad_html2, report_url='http://example', financial_year='2026-27')
    except Exception as e:
        print(f"Caught expected exception for missing metric: {e}")

    print("\n=== ACCOUNTING IDENTITY FAIL DEMO ===")
    from copy import deepcopy
    bad_obs = deepcopy(observations)
    for o in bad_obs:
        if o.metric == 'revenue_receipts':
            o.amount = 9999999
    identities_bad = validate_deficit_identities(bad_obs).get('checks', [])
    for res in identities_bad:
        if not res.get('reconciles'):
            print(f"Caught expected identity failure: {res.get('metric')} failed. Diff: {res.get('difference')}")

if __name__ == '__main__':
    main()
