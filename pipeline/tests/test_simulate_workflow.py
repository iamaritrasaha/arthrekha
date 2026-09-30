import json
import pytest
from pathlib import Path


def test_simulate_detect_workflow():
    """Detection workflow integration test: uses only the local processed dataset (no network)."""
    from pipeline.scripts.check_updates import check_updates, DATASET_PATH
    # Verify the check_updates function returns a valid report shape using the committed dataset
    # but mock the external HTTP fetch to avoid live network calls in tests.
    import pipeline.source_updates as su
    original_fetch = su.fetch_source_index

    def _fake_fetch(url: str) -> str:
        # Return a minimal page with no recognized release to trigger 'up_to_date'
        return "<html><body><p>No releases found</p></body></html>"

    su.fetch_source_index = _fake_fetch
    try:
        report = check_updates()
        assert report['status'] in ('up_to_date', 'new_release', 'source_shape_unrecognised')
        assert 'financialYear' in report
    finally:
        su.fetch_source_index = original_fetch


def test_simulate_refresh_workflow():
    """Simulate the refresh workflow using committed data (no live network)."""
    import pipeline.scripts.simulate_refresh
    # Patch fetch_report to use the committed fixture HTML
    import pipeline.scripts.refresh_cga as rcga
    from pipeline.tests.test_cga_html import JULY_REPORT
    original = rcga.fetch_report
    rcga.fetch_report = lambda url: JULY_REPORT
    try:
        pipeline.scripts.simulate_refresh.main()
    finally:
        rcga.fetch_report = original


def test_detect_revision_hash_change_via_new_sha256():
    """Test source_hash_changed using the new_sha256 argument (proper path)."""
    import tempfile
    from pipeline.scripts.revision_detector import detect_revision

    with tempfile.TemporaryDirectory() as td:
        raw_dir = Path(td)
        existing = {'reporting_period': 'apr-aug', 'financial_year': '2026-27', 'data': {'m1': 100}}
        (raw_dir / 'cga_2026-27_aug.json').write_text(json.dumps(existing))
        # Write the committed (old) provenance sidecar
        (raw_dir / 'cga_2026-27_aug.provenance.json').write_text(
            json.dumps({'sha256_html_utf8': 'committed_hash_abc'})
        )

        # Pass the NEW hash from the refresh step — different from committed hash
        report_changed = detect_revision(existing, raw_dir, new_sha256='new_fetched_hash_xyz')
        assert report_changed['is_revision'] is True  # source bytes changed, even when values did not
        assert report_changed['classification'] == 'revision'
        assert report_changed['source_hash_changed'] is True  # HTML hash changed!

        # Pass the SAME hash as committed — no change
        report_same = detect_revision(existing, raw_dir, new_sha256='committed_hash_abc')
        assert report_same['source_hash_changed'] is False
        assert report_same['classification'] == 'unchanged_existing_period'


def test_release_branch_identity_is_stable_across_days_and_one_open_pr_is_reused():
    from pathlib import Path
    workflow = Path('.github/workflows/refresh.yml').read_text()
    old_workflow = Path('.github/workflows/check-fiscal-sources.yml').read_text()
    assert 'refresh/cga-${FINANCIAL_YEAR}-${MONTH_END}' in workflow
    assert 'date -u +%Y%m%d' not in workflow
    assert 'gh pr list --state open --base main' in workflow
    assert 'select(.title == $title or .headRefName == $stable)' in workflow
    assert 'if [ -n "$EXISTING_PR" ]; then' in workflow
    assert 'gh pr close "$duplicate_pr"' in workflow
    assert workflow.count('gh pr create') == 1
    assert 'schedule:' not in old_workflow
