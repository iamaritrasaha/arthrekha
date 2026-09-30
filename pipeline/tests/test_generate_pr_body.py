import tempfile
import json
import subprocess
from pathlib import Path
import os
import sys

def test_generate_pr_body_new_period():
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        rev_report = tmp_path / 'rev.json'
        delta_report = tmp_path / 'delta.json'
        raw_json = tmp_path / 'raw.json'
        out = tmp_path / 'out.md'

        rev_report.write_text(json.dumps({'is_revision': False}))
        delta_report.write_text(json.dumps({'deltas': [{'metric': 'm1', 'prev': 10, 'new': 12, 'delta_pct': 20, 'flag': 'ok'}]}))
        raw_json.write_text(json.dumps({'reporting_period': 'apr-aug', 'financial_year': '2026-27', 'data': {'revenue_receipts': 100, 'revenue_expenditure': 150, 'revenue_deficit': 50}}))

        env = os.environ.copy()
        env['PYTHONPATH'] = os.getcwd()
        res = subprocess.run(['python3', 'pipeline/scripts/generate_pr_body.py', '--revision-report', str(rev_report), '--delta-report', str(delta_report), '--raw-json', str(raw_json), '--output', str(out)], check=False, env=env, capture_output=True, text=True)
        if res.returncode != 0:
            print(res.stdout)
            print(res.stderr)
            assert False, res.stderr + '\n' + res.stdout

        content = out.read_text()
        assert '🆕 New reporting period' in content
        assert '✅ PASS' in content, content
        assert '🚨' not in content
        assert '⚠️' not in content

def test_generate_pr_body_revision_and_warnings():
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        rev_report = tmp_path / 'rev.json'
        delta_report = tmp_path / 'delta.json'
        raw_json = tmp_path / 'raw.json'
        out = tmp_path / 'out.md'

        rev_report.write_text(json.dumps({'is_revision': True, 'changes': [{'metric': 'm1', 'old': 10, 'new': 12}]}))
        delta_report.write_text(json.dumps({'deltas': [{'metric': 'm1', 'prev': 10, 'new': 120, 'delta_pct': 1100, 'flag': 'severe_warning'}, {'metric': 'm2', 'prev': 10, 'new': 20, 'delta_pct': 100, 'flag': 'warning'}]}))
        raw_json.write_text(json.dumps({'reporting_period': 'apr-aug', 'financial_year': '2026-27', 'data': {'revenue_receipts': 100, 'revenue_expenditure': 150, 'revenue_deficit': 999}})) # Fail identity

        env = os.environ.copy()
        env['PYTHONPATH'] = os.getcwd()
        res = subprocess.run(['python3', 'pipeline/scripts/generate_pr_body.py', '--revision-report', str(rev_report), '--delta-report', str(delta_report), '--raw-json', str(raw_json), '--output', str(out)], check=False, env=env, capture_output=True, text=True)
        if res.returncode != 0:
            print(res.stdout)
            print(res.stderr)
            assert False, res.stderr + '\n' + res.stdout

        content = out.read_text()
        assert '🔄 Revision' in content
        assert '❌ FAIL' in content, content
        assert '🚨' in content
        assert '⚠️' in content


def test_pr_type_matches_all_revision_detector_states():
    cases = [
        ({'classification': 'new_period', 'is_new_period': True, 'is_revision': False}, '🆕 New reporting period'),
        ({'classification': 'unchanged_existing_period', 'is_new_period': False, 'is_revision': False}, '↔️ Unchanged existing period'),
        ({'classification': 'revision', 'is_new_period': False, 'is_revision': True}, '🔄 Revision of previously committed period'),
    ]
    for report, expected in cases:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / 'rev.json').write_text(json.dumps(report))
            (root / 'delta.json').write_text(json.dumps({'deltas': []}))
            (root / 'raw.json').write_text(json.dumps({'reporting_period': 'apr-jul', 'financial_year': '2026-27', 'data': {'revenue_receipts': 100, 'revenue_expenditure': 150, 'revenue_deficit': 50}}))
            subprocess.run([
                sys.executable, 'pipeline/scripts/generate_pr_body.py',
                '--revision-report', str(root / 'rev.json'), '--delta-report', str(root / 'delta.json'),
                '--raw-json', str(root / 'raw.json'), '--output', str(root / 'body.md'),
            ], check=True, env={**os.environ, 'PYTHONPATH': os.getcwd()})
            content = (root / 'body.md').read_text()
            assert f'**Type:** {expected}' in content
            assert sum(marker in content for marker in ('🆕 New reporting period', '↔️ Unchanged existing period', '🔄 Revision of previously committed period')) == 1


def test_over_500_percent_official_style_movement_reaches_pr_preparation():
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        raw = {'reporting_period': 'apr-jul', 'financial_year': '2026-27', 'data': {'revenue_receipts': 1000, 'revenue_expenditure': 2000, 'revenue_deficit': 1000, 'capital_expenditure': 700}}
        previous = {'reporting_period': 'apr-jun', 'financial_year': '2026-27', 'data': {'capital_expenditure': 100}}
        (root / 'cga_2026-27_jun.json').write_text(json.dumps(previous))
        (root / 'raw.json').write_text(json.dumps(raw))
        delta_path = root / 'delta.json'
        proc = subprocess.run([sys.executable, '-m', 'pipeline.scripts.validate_mom_delta', '--json-path', str(root / 'raw.json'), '--report-path', str(delta_path)], capture_output=True, text=True, env={**os.environ, 'PYTHONPATH': os.getcwd()})
        assert proc.returncode == 0, proc.stdout + proc.stderr
        delta = json.loads(delta_path.read_text())
        capex_delta = next(d for d in delta['deltas'] if d['metric'] == 'capital_expenditure')
        assert capex_delta['delta_pct'] == 600.0
        assert 'capital_expenditure' in delta['severe_warning_metrics']
        (root / 'revision.json').write_text(json.dumps({'classification': 'new_period', 'is_new_period': True, 'is_revision': False}))
        subprocess.run([sys.executable, 'pipeline/scripts/generate_pr_body.py', '--revision-report', str(root / 'revision.json'), '--delta-report', str(delta_path), '--raw-json', str(root / 'raw.json'), '--output', str(root / 'pr-body.md')], check=True, env={**os.environ, 'PYTHONPATH': os.getcwd()})
        body = (root / 'pr-body.md').read_text()
        assert 'Severe review warning' in body
        assert 'capital_expenditure' in body
