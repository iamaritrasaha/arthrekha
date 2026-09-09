"""Helpers for monitoring official fiscal-source releases.

This module deliberately separates source discovery from ingestion. A new
publication is evidence that a refresh may be available; it is not permission
to replace the validated dataset until the source format has been parsed and
the full validation suite has passed.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from html import unescape
import re
from typing import Any
from urllib.parse import urljoin
from urllib.request import Request, urlopen


CGA_RELEASE_INDEX_URL = "https://cga.nic.in/Index.aspx"
CGA_MONTHLY_REPORT_BASE_URL = "https://cga.nic.in/MonthlyReport/Published"

MONTHS: tuple[str, ...] = (
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
)
MONTH_NUMBERS = {month: number for number, month in enumerate(MONTHS, start=1)}


@dataclass(frozen=True)
class CgaRelease:
    """A release notice discovered on the official CGA site."""

    title: str
    url: str
    month: str
    year: int

    @property
    def month_number(self) -> int:
        return MONTH_NUMBERS[self.month]

    @property
    def period(self) -> str:
        """Return the cumulative financial-year period ending at this month."""
        if self.month_number == 4:
            return "apr"
        return "apr-" + self.month[:3]

    def to_dict(self) -> dict[str, Any]:
        return {
            **asdict(self),
            "monthNumber": self.month_number,
            "reportingPeriod": self.period,
        }


def _visible_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", unescape(value)).strip()


def parse_cga_releases(html: str, base_url: str = CGA_RELEASE_INDEX_URL) -> list[CgaRelease]:
    """Extract CGA monthly-account release notices from an index page.

    The CGA site is an older server-rendered application, so this parser only
    relies on anchor text/title and href attributes. It intentionally returns
    no release when the page shape changes instead of guessing.
    """

    releases: list[CgaRelease] = []
    anchor_pattern = re.compile(r"<a\b(?P<attrs>[^>]*)>(?P<body>.*?)</a>", re.IGNORECASE | re.DOTALL)
    release_pattern = re.compile(
        r"release\s+of\s+union\s+government\s+accounts\s+upto\s+"
        r"(?P<month>January|February|March|April|May|June|July|August|September|October|November|December)\s+"
        r"(?P<year>20\d{2})",
        re.IGNORECASE,
    )
    href_pattern = re.compile(r"\bhref\s*=\s*(['\"])(.*?)\1", re.IGNORECASE | re.DOTALL)
    title_pattern = re.compile(r"\btitle\s*=\s*(['\"])(.*?)\1", re.IGNORECASE | re.DOTALL)

    for match in anchor_pattern.finditer(html):
        attrs = match.group("attrs")
        text = _visible_text(match.group("body"))
        title_match = title_pattern.search(attrs)
        title = _visible_text(title_match.group(2)) if title_match else ""
        release_match = release_pattern.search(f"{title} {text}")
        href_match = href_pattern.search(attrs)
        if not release_match or not href_match:
            continue

        month = release_match.group("month").lower()
        releases.append(
            CgaRelease(
                title=release_match.group(0),
                url=urljoin(base_url, unescape(href_match.group(2).strip())),
                month=month,
                year=int(release_match.group("year")),
            )
        )

    unique = {(release.year, release.month_number, release.url): release for release in releases}
    return sorted(unique.values(), key=lambda release: (release.year, release.month_number), reverse=True)


def latest_cga_release(html: str, base_url: str = CGA_RELEASE_INDEX_URL) -> CgaRelease | None:
    """Return the newest release notice, or ``None`` for an unrecognised page."""
    releases = parse_cga_releases(html, base_url)
    return releases[0] if releases else None


def monthly_report_url(release: CgaRelease, financial_year: str) -> str:
    """Build the stable monthly-report URL linked by CGA release notices."""
    start_year = int(financial_year.split("-")[0])
    report_year = start_year + 1 if release.month_number < 4 else start_year
    end_year = str(report_year + 1)
    return f"{CGA_MONTHLY_REPORT_BASE_URL}/{release.month_number}/{start_year}-{end_year}.aspx"


def period_end_month(period: str | None) -> int | None:
    """Convert an Arthrekha cumulative period such as ``apr-jun`` to a month."""
    if not period:
        return None
    end = period.lower().split("-")[-1]
    if len(end) == 3:
        return next((number for month, number in MONTH_NUMBERS.items() if month[:3] == end), None)
    return MONTH_NUMBERS.get(end)


def current_dataset_period(dataset: dict[str, Any]) -> str | None:
    metadata = dataset.get("metadata", {})
    latest = metadata.get("latestPeriod")
    if isinstance(latest, str):
        return latest

    actual_periods = {
        observation.get("period")
        for observation in dataset.get("observations", [])
        if observation.get("estimateType") == "provisional" and observation.get("period")
    }
    return max(actual_periods, key=lambda period: period_end_month(period) or 0, default=None)


def compare_release_to_dataset(release: CgaRelease | None, dataset: dict[str, Any]) -> dict[str, Any]:
    """Build a stable, machine-readable refresh status report."""
    current_period = current_dataset_period(dataset)
    current_month = period_end_month(current_period)
    financial_year = str(dataset.get("financialYear") or "")
    try:
        financial_year_start = int(financial_year.split("-")[0])
    except (ValueError, IndexError):
        financial_year_start = None

    current_calendar_year = (
        financial_year_start + 1
        if financial_year_start is not None and current_month is not None and current_month < 4
        else financial_year_start
    )
    if release is None:
        status = "source_shape_unrecognised"
    elif current_month is None:
        status = "current_period_unrecognised"
    elif current_calendar_year is None:
        status = "current_year_unrecognised"
    elif (release.year, release.month_number) > (current_calendar_year, current_month):
        status = "new_release"
    else:
        status = "up_to_date"

    return {
        "status": status,
        "currentFinancialYear": dataset.get("financialYear"),
        "currentPeriod": current_period,
        "currentPeriodEndMonth": current_month,
        "release": release.to_dict() if release else None,
        "nextAction": (
            "Review the official release and run the source-specific parser before changing published data."
            if status == "new_release"
            else "No newer recognised CGA release was found."
        ),
    }


def fetch_source_index(url: str = CGA_RELEASE_INDEX_URL, timeout: int = 30) -> str:
    request = Request(url, headers={"User-Agent": "Arthrekha-source-monitor/1.0"})
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")
