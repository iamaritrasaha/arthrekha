import json
import hashlib
import tempfile
from pathlib import Path
from pipeline.scripts.refresh_cga import refresh_report
from pipeline.tests.test_cga_html import JULY_REPORT
import pipeline.scripts.refresh_cga

def test_refresh_report_with_archival():
    old_fetch = pipeline.scripts.refresh_cga.fetch_report
    pipeline.scripts.refresh_cga.fetch_report = lambda url: JULY_REPORT
    try:
        with tempfile.TemporaryDirectory() as td:
            tmp_path = Path(td)
            output_json = tmp_path / 'out.json'
            archive_html = tmp_path / 'archive.html'

            source = refresh_report('http://example.com', output_json, '2026-27', archive_html)

            assert output_json.exists()
            assert archive_html.exists()

            prov_path = archive_html.with_suffix('.provenance.json')
            assert prov_path.exists()

            prov = json.loads(prov_path.read_text('utf-8'))
            assert prov['url'] == 'http://example.com'
            assert 'fetched_at' in prov
            assert prov['sha256_html_utf8'] == hashlib.sha256(JULY_REPORT.encode('utf-8')).hexdigest()
            assert prov['reporting_period'] == source['reporting_period']
            assert prov['financial_year'] == '2026-27'
            assert prov['parser'] == 'pipeline.parsers.cga_html'
    finally:
        pipeline.scripts.refresh_cga.fetch_report = old_fetch

def test_refresh_report_without_archival():
    old_fetch = pipeline.scripts.refresh_cga.fetch_report
    pipeline.scripts.refresh_cga.fetch_report = lambda url: JULY_REPORT
    try:
        with tempfile.TemporaryDirectory() as td:
            tmp_path = Path(td)
            output_json = tmp_path / 'out.json'

            source = refresh_report('http://example.com', output_json, '2026-27')

            assert output_json.exists()
            assert not (tmp_path / 'archive.html').exists()
    finally:
        pipeline.scripts.refresh_cga.fetch_report = old_fetch


def test_revision_preserves_previous_source_bytes_by_hash():
    old_fetch = pipeline.scripts.refresh_cga.fetch_report
    try:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = root / 'cga_2026-27_jul.html'
            output = root / 'cga_2026-27_jul.json'
            pipeline.scripts.refresh_cga.fetch_report = lambda url: JULY_REPORT
            refresh_report('http://example.com', output, '2026-27', archive)
            accepted_bytes = archive.read_bytes()
            revised_html = JULY_REPORT.replace('AS AT THE END OF JULY 2026', 'AS AT THE END OF JULY 2026 ')
            pipeline.scripts.refresh_cga.fetch_report = lambda url: revised_html
            refresh_report('http://example.com', output, '2026-27', archive)
            prior_hash = hashlib.sha256(accepted_bytes).hexdigest()
            preserved = root / 'archive' / f'cga_2026-27_jul-{prior_hash}.html'
            assert preserved.read_bytes() == accepted_bytes
            assert archive.read_text() == revised_html
    finally:
        pipeline.scripts.refresh_cga.fetch_report = old_fetch
