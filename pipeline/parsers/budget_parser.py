"""
Parser for Union Budget 2026-27 Budget Estimates

Extracts data from Budget at a Glance structure.
"""

from datetime import date
from pipeline.models import FinancialObservation, DataSource
from pipeline.metrics import validate_metric_id


def parse_budget_be_2026_27(data: dict[str, float]) -> list[FinancialObservation]:
    """
    Parse Budget Estimates for FY 2026-27.

    Args:
        data: Dictionary mapping metric IDs to amounts in ₹ crore

    Returns:
        List of FinancialObservation objects
    """
    observations = []

    # Common source metadata
    source = DataSource(
        organization="Ministry of Finance, Government of India",
        document="Union Budget 2026-27 - Budget at a Glance",
        url="https://www.indiabudget.gov.in/",
        table="Budget at a Glance",
        published_at="2026-02-01",
        retrieved_at=date.today().isoformat(),
        data_status="final",
        notes="Budget Estimates as presented to Parliament on February 1, 2026",
    )

    for metric_id, amount in data.items():
        # Validate metric ID
        if not validate_metric_id(metric_id):
            raise ValueError(f"Unknown metric ID: {metric_id}")

        obs = FinancialObservation(
            jurisdiction="india",
            jurisdiction_type="union",
            financial_year="2026-27",
            period=None,  # Full year
            period_type="annual",
            metric=metric_id,
            amount=amount,
            unit="crore",
            currency="INR",
            estimate_type="BE",
            source=source,
        )

        observations.append(obs)

    return observations


def load_sample_budget_be() -> list[FinancialObservation]:
    """
    Load sample Budget BE data for FY 2026-27.

    NOTE: This uses SAMPLE DATA for pipeline development.
    Replace with actual parser when official source is accessible.
    """
    # Sample data structure matching Budget at a Glance
    sample_data = {
        "revenue_receipts": 3003992,
        "tax_revenue_net": 2516293,
        "non_tax_revenue": 487699,
        "non_debt_capital_receipts": 109574,
        "total_receipts": 3113566,
        "revenue_expenditure": 3909468,
        "capital_expenditure": 1111111,
        "total_expenditure": 5020579,
        "interest_payments": 1190178,
        "fiscal_deficit": 1907013,
    }

    return parse_budget_be_2026_27(sample_data)
