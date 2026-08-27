"""
Arthrekha Metric Registry

Canonical metric definitions for Union Budget FY 2026-27.

Each metric has:
- id: stable machine identifier
- display_name: human-readable name
- short_description: one-sentence explanation
- long_description: beginner-friendly explanation
- unit_type: crore | percentage | ratio
- category: receipts | expenditure | deficit | debt
- accounting_interpretation: fiscal meaning
"""

from typing import Literal, TypedDict

UnitType = Literal["crore", "percentage", "ratio"]
CategoryType = Literal["receipts", "expenditure", "deficit", "debt", "other"]


class MetricDefinition(TypedDict):
    id: str
    display_name: str
    short_description: str
    long_description: str
    unit_type: UnitType
    category: CategoryType
    accounting_interpretation: str
    compatible_comparisons: list[str]


# Canonical metric registry
METRICS: dict[str, MetricDefinition] = {
    # RECEIPTS
    "revenue_receipts": {
        "id": "revenue_receipts",
        "display_name": "Revenue Receipts",
        "short_description": "Money the government receives without creating debt",
        "long_description": (
            "Revenue receipts include all money the government receives that does not "
            "create a liability (debt). This primarily includes tax revenue and "
            "non-tax revenue like dividends from public sector enterprises."
        ),
        "unit_type": "crore",
        "category": "receipts",
        "accounting_interpretation": "Current account income",
        "compatible_comparisons": ["total_receipts", "revenue_expenditure"],
    },
    "tax_revenue_net": {
        "id": "tax_revenue_net",
        "display_name": "Tax Revenue (Net to Centre)",
        "short_description": "Tax collections after sharing with states",
        "long_description": (
            "Tax revenue is what the government collects through various taxes "
            "(income tax, GST, customs duties, etc.). 'Net to Centre' means after "
            "the Centre's share of taxes has been distributed to state governments "
            "as per the Finance Commission formula."
        ),
        "unit_type": "crore",
        "category": "receipts",
        "accounting_interpretation": "Tax revenue retained by Union Government",
        "compatible_comparisons": ["revenue_receipts", "non_tax_revenue"],
    },
    "non_tax_revenue": {
        "id": "non_tax_revenue",
        "display_name": "Non-Tax Revenue",
        "short_description": "Government income from sources other than taxes",
        "long_description": (
            "Non-tax revenue includes dividends from public sector companies, "
            "interest receipts, fees, fines, and receipts from services provided "
            "by the government. This does not include borrowing or disinvestment."
        ),
        "unit_type": "crore",
        "category": "receipts",
        "accounting_interpretation": "Non-tax current income",
        "compatible_comparisons": ["tax_revenue_net", "revenue_receipts"],
    },
    "non_debt_capital_receipts": {
        "id": "non_debt_capital_receipts",
        "display_name": "Non-Debt Capital Receipts",
        "short_description": "Capital receipts that do not create debt",
        "long_description": (
            "Capital receipts from sources other than borrowing. This primarily "
            "includes proceeds from disinvestment (selling government stakes in "
            "public companies) and recovery of loans given by the government."
        ),
        "unit_type": "crore",
        "category": "receipts",
        "accounting_interpretation": "Capital account receipts without borrowing",
        "compatible_comparisons": ["total_receipts"],
    },
    "total_receipts": {
        "id": "total_receipts",
        "display_name": "Total Receipts",
        "short_description": "All government receipts excluding borrowing",
        "long_description": (
            "The total of all receipts the government receives, excluding borrowed "
            "funds. This equals revenue receipts plus non-debt capital receipts. "
            "The gap between total receipts and total expenditure is the fiscal deficit."
        ),
        "unit_type": "crore",
        "category": "receipts",
        "accounting_interpretation": "Total non-borrowed receipts",
        "compatible_comparisons": ["total_expenditure"],
    },
    # EXPENDITURE
    "revenue_expenditure": {
        "id": "revenue_expenditure",
        "display_name": "Revenue Expenditure",
        "short_description": "Day-to-day operating expenses of government",
        "long_description": (
            "Revenue expenditure includes all spending that does not create assets. "
            "This covers salaries, pensions, interest payments, subsidies, and "
            "operating expenses. It's the government's 'running costs'."
        ),
        "unit_type": "crore",
        "category": "expenditure",
        "accounting_interpretation": "Current account expenditure",
        "compatible_comparisons": ["capital_expenditure", "total_expenditure", "revenue_receipts"],
    },
    "capital_expenditure": {
        "id": "capital_expenditure",
        "display_name": "Capital Expenditure",
        "short_description": "Spending that creates long-term assets",
        "long_description": (
            "Capital expenditure is spending on infrastructure and assets like "
            "roads, bridges, buildings, and equipment. This also includes loans "
            "to states and public enterprises for capital projects."
        ),
        "unit_type": "crore",
        "category": "expenditure",
        "accounting_interpretation": "Capital account expenditure / investment",
        "compatible_comparisons": ["revenue_expenditure", "total_expenditure"],
    },
    "total_expenditure": {
        "id": "total_expenditure",
        "display_name": "Total Expenditure",
        "short_description": "All government spending",
        "long_description": (
            "The total of all government spending, including both revenue expenditure "
            "(day-to-day costs) and capital expenditure (infrastructure and assets). "
            "This is what the government plans to spend during the financial year."
        ),
        "unit_type": "crore",
        "category": "expenditure",
        "accounting_interpretation": "Total government outlay",
        "compatible_comparisons": ["total_receipts"],
    },
    "interest_payments": {
        "id": "interest_payments",
        "display_name": "Interest Payments",
        "short_description": "Cost of servicing government debt",
        "long_description": (
            "Interest payments are what the government pays to service its "
            "accumulated debt. This is a major component of revenue expenditure. "
            "The difference between fiscal deficit and interest payments is the "
            "primary deficit."
        ),
        "unit_type": "crore",
        "category": "expenditure",
        "accounting_interpretation": "Debt servicing cost",
        "compatible_comparisons": ["revenue_expenditure", "fiscal_deficit"],
    },
    # DEFICITS
    "fiscal_deficit": {
        "id": "fiscal_deficit",
        "display_name": "Fiscal Deficit",
        "short_description": "Gap between government spending and non-borrowed receipts",
        "long_description": (
            "Fiscal deficit is total expenditure minus total receipts (excluding "
            "borrowing). It represents how much the government needs to borrow. "
            "A positive fiscal deficit means expenditure exceeds receipts. "
            "Formula: Total Expenditure - Total Receipts (excluding borrowing)"
        ),
        "unit_type": "crore",
        "category": "deficit",
        "accounting_interpretation": "Net borrowing requirement",
        "compatible_comparisons": ["revenue_deficit", "primary_deficit"],
    },
}


def get_metric(metric_id: str) -> MetricDefinition | None:
    """Get metric definition by ID"""
    return METRICS.get(metric_id)


def get_metrics_by_category(category: CategoryType) -> list[MetricDefinition]:
    """Get all metrics in a category"""
    return [m for m in METRICS.values() if m["category"] == category]


def validate_metric_id(metric_id: str) -> bool:
    """Check if metric ID is registered"""
    return metric_id in METRICS
