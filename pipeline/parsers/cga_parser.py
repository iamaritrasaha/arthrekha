"""
Parser for CGA Monthly Accounts

Extracts cumulative actuals from Controller General of Accounts reports.
"""

from datetime import date
from pipeline.models import FinancialObservation, DataSource
from pipeline.metrics import validate_metric_id


def parse_cga_actuals(
    data: dict[str, float],
    period: str,
    publication_date: str | None = None,
) -> list[FinancialObservation]:
    """
    Parse CGA monthly actuals (cumulative).

    Args:
        data: Dictionary mapping metric IDs to amounts in ₹ crore
        period: Period string like "apr-jun" or "q1"
        publication_date: When CGA published this data (ISO format)

    Returns:
        List of FinancialObservation objects
    """
    observations = []

    # CGA actuals are provisional until CAG audit
    source = DataSource(
        organization="Controller General of Accounts, Government of India",
        document=f"Accounts at a Glance - {period.upper()} FY 2026-27",
        url="https://cga.nic.in/",
        table="Monthly Accounts Statement",
        published_at=publication_date,
        retrieved_at=date.today().isoformat(),
        data_status="provisional",
        notes="Provisional actuals, subject to audit by CAG. Cumulative YTD figures.",
    )

    for metric_id, amount in data.items():
        # Validate metric ID
        if not validate_metric_id(metric_id):
            raise ValueError(f"Unknown metric ID: {metric_id}")

        obs = FinancialObservation(
            jurisdiction="india",
            jurisdiction_type="union",
            financial_year="2026-27",
            period=period,
            period_type="cumulative",  # CGA reports cumulative YTD
            metric=metric_id,
            amount=amount,
            unit="crore",
            currency="INR",
            estimate_type="provisional",
            source=source,
        )

        observations.append(obs)

    return observations


def load_sample_cga_q1() -> list[FinancialObservation]:
    """
    Load sample CGA actuals for Apr-Jun 2026 (Q1 FY 2026-27).

    NOTE: This uses SAMPLE DATA for pipeline development.
    Replace with actual parser when official CGA source is accessible.
    """
    # Sample cumulative actuals Apr-Jun 2026
    sample_data = {
        "revenue_receipts": 645890,
        "tax_revenue_net": 523456,
        "non_tax_revenue": 122434,
        "non_debt_capital_receipts": 18765,
        "total_receipts": 664655,
        "revenue_expenditure": 1012345,
        "capital_expenditure": 189234,
        "total_expenditure": 1201579,
        "interest_payments": 298567,
        "fiscal_deficit": 536924,
    }

    return parse_cga_actuals(
        data=sample_data,
        period="apr-jun",
        publication_date="2026-07-31",  # Typically published end of next month
    )
