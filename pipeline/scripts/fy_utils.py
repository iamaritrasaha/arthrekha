"""Financial-year utilities for the CGA refresh pipeline.

The Indian fiscal year runs from 1 April through 31 March.
FY 2026-27 starts on 1 April 2026 and ends on 31 March 2027.
"""
from __future__ import annotations

import os
import re
from datetime import date


def active_financial_year(reference_date: date | None = None) -> str:
    """Return the currently active Indian financial year as 'YYYY-YY'.

    - On or after 1 April → new FY starts (e.g. 1 Apr 2027 → '2027-28').
    - Before 1 April → still in the previous FY (e.g. 31 Mar 2027 → '2026-27').

    Override via FINANCIAL_YEAR environment variable (e.g. for testing or
    for workflows that need a specific FY regardless of date).
    """
    override = os.environ.get('FINANCIAL_YEAR')
    if override:
        _validate_fy_format(override)
        return override
    d = reference_date or date.today()
    start = d.year if d.month >= 4 else d.year - 1
    return f'{start}-{str(start + 1)[2:]}'


def fy_start_year(financial_year: str) -> int:
    """Extract the start calendar year from a 'YYYY-YY' financial year string."""
    _validate_fy_format(financial_year)
    return int(financial_year.split('-')[0])


def fy_end_year(financial_year: str) -> int:
    """Extract the end calendar year from a 'YYYY-YY' financial year string."""
    start = fy_start_year(financial_year)
    return start + 1


def _validate_fy_format(fy: str) -> None:
    if not re.match(r'^\d{4}-\d{2}$', fy):
        raise ValueError(f"Financial year must be in 'YYYY-YY' format, got: {fy!r}")


def calendar_year_for_month(month_number: int, financial_year: str) -> int:
    """Return the calendar year for a given fiscal month number (1=Apr, 12=Mar).

    Months 1–9 (April–December) fall in the FY start year.
    Months 10–12 (January–March) fall in the FY end year.
    """
    start = fy_start_year(financial_year)
    if month_number <= 9:  # Apr–Dec
        return start
    return start + 1  # Jan–Mar
