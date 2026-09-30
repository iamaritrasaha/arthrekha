import json
import tempfile
from pathlib import Path
from pipeline.scripts.validate_mom_delta import validate_mom_delta

def test_no_previous_period():
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        new_data = {'reporting_period': 'apr-apr', 'financial_year': '2026-27', 'data': {'m1': 100}}
        report = validate_mom_delta(new_data, tmp_path)
        assert report['status'] == 'no_previous_period'

def test_all_metrics_ok():
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        (tmp_path / 'cga_2026-27_jun.json').write_text(json.dumps({'reporting_period': 'apr-jun', 'data': {'m1': 100}}))
        new_data = {'reporting_period': 'apr-jul', 'financial_year': '2026-27', 'data': {'m1': 110}}
        report = validate_mom_delta(new_data, tmp_path)
        assert report['status'] == 'ok'

def test_warnings():
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        (tmp_path / 'cga_2026-27_jun.json').write_text(json.dumps({'reporting_period': 'apr-jun', 'data': {'m1': 100}}))
        new_data = {'reporting_period': 'apr-jul', 'financial_year': '2026-27', 'data': {'m1': 200}}
        report = validate_mom_delta(new_data, tmp_path)
        assert report['status'] == 'warnings'
        assert 'm1' in report['warned_metrics']

def test_extreme_movement_is_a_severe_warning_not_failure():
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        (tmp_path / 'cga_2026-27_jun.json').write_text(json.dumps({'reporting_period': 'apr-jun', 'data': {'m1': 100}}))
        new_data = {'reporting_period': 'apr-jul', 'financial_year': '2026-27', 'data': {'m1': 700}}
        report = validate_mom_delta(new_data, tmp_path)
        assert report['status'] == 'warnings'
        assert 'm1' in report['severe_warning_metrics']
        assert report['deltas'][0]['flag'] == 'severe_warning'

def test_prev_zero():
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        (tmp_path / 'cga_2026-27_jun.json').write_text(json.dumps({'reporting_period': 'apr-jun', 'data': {'m1': 0}}))
        new_data = {'reporting_period': 'apr-jul', 'financial_year': '2026-27', 'data': {'m1': 100}}
        report = validate_mom_delta(new_data, tmp_path)
        assert report['status'] == 'ok'
        assert report['deltas'][0]['flag'] == 'prev_zero'

def test_extreme_but_valid():
    with tempfile.TemporaryDirectory() as td:
        tmp_path = Path(td)
        (tmp_path / 'cga_2026-27_jun.json').write_text(json.dumps({'reporting_period': 'apr-jun', 'data': {'capital_expenditure': 100}}))
        new_data = {'reporting_period': 'apr-jul', 'financial_year': '2026-27', 'data': {'capital_expenditure': 300}}
        report = validate_mom_delta(new_data, tmp_path)
        assert report['status'] == 'warnings' # 200% jump

def test_using_actual_repo_data():
    raw_dir = Path('datasets/raw')
    if not (raw_dir / 'cga_2026-27_jul.json').exists() or not (raw_dir / 'cga_2026-27_jun.json').exists():
        return

    with open(raw_dir / 'cga_2026-27_jul.json') as f:
        new_data = json.load(f)

    report = validate_mom_delta(new_data, raw_dir)
    assert report['status'] in ('ok', 'warnings')
