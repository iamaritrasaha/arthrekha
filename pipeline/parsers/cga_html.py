"""Parser for the CGA's published Union Government monthly report pages."""

from __future__ import annotations

from datetime import date
from html import unescape
from html.parser import HTMLParser
import re
from typing import Any


class _TableParser(HTMLParser):
    """Collect table rows while retaining cell order and visible text."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows: list[list[str]] = []
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "tr":
            self._row = []
        elif tag in {"td", "th"} and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag: str) -> None:
        if tag in {"td", "th"} and self._cell is not None and self._row is not None:
            value = re.sub(r"\s+", " ", "".join(self._cell)).strip()
            self._row.append(value)
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._row:
                self.rows.append(self._row)
            self._row = None

    def handle_data(self, data: str) -> None:
        if self._cell is not None:
            self._cell.append(data)


METRIC_LABELS = {
    "revenue receipts": "revenue_receipts",
    "tax revenue (net)": "tax_revenue_net",
    "tax revenue": "tax_revenue_net",
    "non-tax revenue": "non_tax_revenue",
    "non-debt capital receipts": "non_debt_capital_receipts",
    "total receipts": "non_borrowed_receipts",
    "revenue expenditure": "revenue_expenditure",
    "interest payments": "interest_payments",
    "capital expenditure": "capital_expenditure",
    "total expenditure": "total_expenditure",
    "fiscal deficit": "fiscal_deficit",
}


def _normalise_label(value: str) -> str:
    value = re.sub(r"^\s*(?:\d+|\.)\s*", "", value)
    value = re.sub(r"^of which\s+", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\s*\([^)]*\)\s*$", "", value)
    return re.sub(r"\s+", " ", value).strip().lower()


def _parse_amount(value: str) -> int | float:
    cleaned = value.replace(",", "").replace("₹", "").strip()
    if not re.fullmatch(r"-?\d+(?:\.\d+)?", cleaned):
        raise ValueError(f"Expected a numeric amount, got {value!r}")
    number = float(cleaned)
    return int(number) if number.is_integer() else number


def _plain_html(value: str) -> str:
    """Turn report markup into searchable text without changing table parsing."""
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", unescape(value)).strip()


def _period_from_report(html: str) -> tuple[str, str, int]:
    heading = re.search(
        r"AS\s+AT\s+THE\s+END\s+OF\s+"
        r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+"
        r"(20\d{2})",
        _plain_html(html),
        flags=re.IGNORECASE,
    )
    if not heading:
        raise ValueError("CGA report period heading was not found")
    month = heading.group(1).lower()
    year = int(heading.group(2))
    period = "apr" if month == "april" else f"apr-{month[:3]}"
    return period, month, year


def parse_cga_monthly_report(
    html: str,
    *,
    report_url: str,
    financial_year: str = "2026-27",
    publication_date: str | None = None,
    retrieved_at: str | None = None,
) -> dict[str, Any]:
    """Parse the core fiscal table into the raw JSON source shape.

    The source's ``Total Receipts (1+4)`` row is the additive combination of
    revenue receipts and non-debt capital receipts. Arthrekha stores that same
    source value under the normalized ``non_borrowed_receipts`` metric.
    """

    period, month, year = _period_from_report(html)
    expected_start_year = int(financial_year.split("-")[0])
    expected_calendar_year = expected_start_year + 1 if month in {"january", "february", "march"} else expected_start_year
    if year != expected_calendar_year:
        raise ValueError(f"CGA report year {year} does not match financial year {financial_year}")

    parser = _TableParser()
    parser.feed(html)
    values: dict[str, int | float] = {}
    source_labels: dict[str, str] = {}

    for row in parser.rows:
        if len(row) < 5:
            continue
        label = _normalise_label(row[1])
        metric_id = METRIC_LABELS.get(label)
        if not metric_id:
            continue
        try:
            actual_value = _parse_amount(row[4])
        except ValueError:
            continue
        values[metric_id] = actual_value
        source_labels[metric_id] = row[1]

    missing = sorted(set(METRIC_LABELS.values()) - values.keys())
    if missing:
        raise ValueError(f"CGA report is missing core metrics: {', '.join(missing)}")

    return {
        "source": {
            "organization": "Controller General of Accounts, Government of India",
            "document": f"Union Government Accounts at a Glance - {month.title()} {year}",
            "url": report_url,
            "publication_date": publication_date,
            "retrieval_date": retrieved_at or date.today().isoformat(),
            "format": "html",
            "table": "Union Government Accounts at a Glance, core fiscal parameters",
            "notes": (
                "Actuals are unaudited provisional figures. The source's Total Receipts (1+4) "
                "row is normalized as non_borrowed_receipts."
            ),
            "source_labels": source_labels,
        },
        "financial_year": financial_year,
        "reporting_period": period,
        "period_type": "cumulative",
        "estimate_type": "provisional",
        "data": values,
        "unit": "crore",
        "currency": "INR",
    }
