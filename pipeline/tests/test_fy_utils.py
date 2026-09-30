import os
from datetime import date
from pipeline.scripts.fy_utils import active_financial_year, fy_start_year, fy_end_year, calendar_year_for_month

def test_active_financial_year_dates():
    old = os.environ.get('FINANCIAL_YEAR')
    if 'FINANCIAL_YEAR' in os.environ:
        del os.environ['FINANCIAL_YEAR']
    try:
        assert active_financial_year(date(2027, 3, 31)) == '2026-27'
        assert active_financial_year(date(2027, 4, 1)) == '2027-28'
        assert active_financial_year(date(2026, 4, 1)) == '2026-27'
        assert active_financial_year(date(2026, 12, 15)) == '2026-27'
        assert active_financial_year(date(2027, 1, 1)) == '2026-27'
        assert active_financial_year(date(2026, 3, 31)) == '2025-26'
    finally:
        if old is not None:
            os.environ['FINANCIAL_YEAR'] = old

def test_active_financial_year_override():
    old = os.environ.get('FINANCIAL_YEAR')
    os.environ['FINANCIAL_YEAR'] = '2099-00'
    try:
        assert active_financial_year(date(2026, 1, 1)) == '2099-00'
    finally:
        if old is not None:
            os.environ['FINANCIAL_YEAR'] = old
        else:
            del os.environ['FINANCIAL_YEAR']

def test_active_financial_year_invalid_override():
    old = os.environ.get('FINANCIAL_YEAR')
    os.environ['FINANCIAL_YEAR'] = '2026'
    try:
        try:
            active_financial_year(date(2026, 1, 1))
            assert False, "Should raise ValueError"
        except ValueError:
            pass
    finally:
        if old is not None:
            os.environ['FINANCIAL_YEAR'] = old
        else:
            del os.environ['FINANCIAL_YEAR']

def test_fy_start_year():
    assert fy_start_year('2026-27') == 2026

def test_fy_end_year():
    assert fy_end_year('2026-27') == 2027

def test_calendar_year_for_month():
    assert calendar_year_for_month(1, '2026-27') == 2026
    assert calendar_year_for_month(9, '2026-27') == 2026
    assert calendar_year_for_month(10, '2026-27') == 2027
    assert calendar_year_for_month(12, '2026-27') == 2027
