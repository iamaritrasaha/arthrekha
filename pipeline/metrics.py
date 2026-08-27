"""Canonical Union fiscal metric registry used by the ingestion pipeline."""

from typing import Literal, TypedDict

UnitType = Literal["crore", "percentage", "ratio"]
DomainType = Literal["receipts", "expenditure", "deficit", "debt", "federal", "accounts"]


class MetricDefinition(TypedDict):
    id: str
    display_name: str
    unit_type: UnitType
    domain: DomainType
    parent_metric: str | None
    accounting_interpretation: str
    compatible_comparisons: list[str]


def _metric(
    metric_id: str,
    display_name: str,
    domain: DomainType,
    interpretation: str,
    parent: str | None = None,
    comparisons: list[str] | None = None,
) -> MetricDefinition:
    return {
        "id": metric_id,
        "display_name": display_name,
        "unit_type": "crore",
        "domain": domain,
        "parent_metric": parent,
        "accounting_interpretation": interpretation,
        "compatible_comparisons": comparisons or [],
    }


METRICS: dict[str, MetricDefinition] = {
    # Money in
    "revenue_receipts": _metric("revenue_receipts", "Revenue Receipts", "receipts", "Revenue-account receipts", comparisons=["revenue_expenditure"]),
    "gross_tax_revenue": _metric("gross_tax_revenue", "Gross Tax Revenue", "receipts", "Tax revenue before deductions and devolution", "revenue_receipts"),
    "tax_revenue_net": _metric("tax_revenue_net", "Tax Revenue (Net to Centre)", "receipts", "Tax revenue retained by the Union", "revenue_receipts"),
    "corporation_tax": _metric("corporation_tax", "Corporation Tax", "receipts", "Tax on company profits", "gross_tax_revenue"),
    "income_tax": _metric("income_tax", "Taxes on Income", "receipts", "Taxes on non-corporate income", "gross_tax_revenue"),
    "gst": _metric("gst", "Goods and Services Tax", "receipts", "Union GST receipts", "gross_tax_revenue"),
    "customs": _metric("customs", "Customs", "receipts", "Taxes on international trade", "gross_tax_revenue"),
    "union_excise_duties": _metric("union_excise_duties", "Union Excise Duties", "receipts", "Union excise receipts", "gross_tax_revenue"),
    "state_share_of_taxes": _metric("state_share_of_taxes", "States' Share of Taxes", "federal", "Tax devolution deducted from gross Union tax revenue", "gross_tax_revenue"),
    "non_tax_revenue": _metric("non_tax_revenue", "Non-Tax Revenue", "receipts", "Revenue receipts other than tax", "revenue_receipts"),
    "capital_receipts": _metric("capital_receipts", "Capital Receipts", "receipts", "Capital-account receipts including borrowing"),
    "recovery_of_loans": _metric("recovery_of_loans", "Recovery of Loans", "receipts", "Non-debt capital receipt", "non_debt_capital_receipts"),
    "other_capital_receipts": _metric("other_capital_receipts", "Other Capital Receipts", "receipts", "Other non-debt capital receipts", "non_debt_capital_receipts"),
    "non_debt_capital_receipts": _metric("non_debt_capital_receipts", "Non-Debt Capital Receipts", "receipts", "Capital receipts that do not create liabilities", "capital_receipts"),
    "borrowings_and_other_liabilities": _metric("borrowings_and_other_liabilities", "Borrowings and Other Liabilities", "debt", "Financing receipts including cash-balance drawdown", "capital_receipts"),
    "non_borrowed_receipts": _metric("non_borrowed_receipts", "Non-Borrowed Receipts", "receipts", "Revenue receipts plus non-debt capital receipts", comparisons=["total_expenditure"]),
    "total_receipts": _metric("total_receipts", "Total Receipts", "receipts", "Receipts including borrowing", comparisons=["total_expenditure"]),
    # Money out
    "total_expenditure": _metric("total_expenditure", "Total Expenditure", "expenditure", "Total revenue and capital expenditure"),
    "revenue_expenditure": _metric("revenue_expenditure", "Revenue Expenditure", "expenditure", "Expenditure on revenue account", "total_expenditure"),
    "capital_expenditure": _metric("capital_expenditure", "Capital Expenditure", "expenditure", "Expenditure on capital account", "total_expenditure"),
    "grants_for_capital_assets": _metric("grants_for_capital_assets", "Grants for Capital Assets", "expenditure", "Revenue grants used to create capital assets", "effective_capital_expenditure"),
    "effective_capital_expenditure": _metric("effective_capital_expenditure", "Effective Capital Expenditure", "expenditure", "Capital expenditure plus grants for capital assets", "total_expenditure"),
    "interest_payments": _metric("interest_payments", "Interest Payments", "expenditure", "Debt-service cost", "revenue_expenditure"),
    "pensions": _metric("pensions", "Pensions", "expenditure", "Pension expenditure", "revenue_expenditure"),
    "defence_expenditure": _metric("defence_expenditure", "Defence", "expenditure", "Defence expenditure", "total_expenditure"),
    "fertiliser_subsidy": _metric("fertiliser_subsidy", "Fertiliser Subsidy", "expenditure", "Fertiliser subsidy", "revenue_expenditure"),
    "food_subsidy": _metric("food_subsidy", "Food Subsidy", "expenditure", "Food subsidy", "revenue_expenditure"),
    "petroleum_subsidy": _metric("petroleum_subsidy", "Petroleum Subsidy", "expenditure", "Petroleum subsidy", "revenue_expenditure"),
    "central_sector_schemes": _metric("central_sector_schemes", "Central Sector Schemes", "expenditure", "Union-funded schemes and projects", "total_expenditure"),
    "centrally_sponsored_schemes": _metric("centrally_sponsored_schemes", "Centrally Sponsored Schemes", "federal", "Union transfers for shared schemes", "total_expenditure"),
    # Deficit
    "fiscal_deficit": _metric("fiscal_deficit", "Fiscal Deficit", "deficit", "Net borrowing requirement"),
    "revenue_deficit": _metric("revenue_deficit", "Revenue Deficit", "deficit", "Revenue expenditure minus revenue receipts"),
    "effective_revenue_deficit": _metric("effective_revenue_deficit", "Effective Revenue Deficit", "deficit", "Revenue deficit minus grants for capital assets", "revenue_deficit"),
    "primary_deficit": _metric("primary_deficit", "Primary Deficit", "deficit", "Fiscal deficit minus interest payments", "fiscal_deficit"),
    # Debt and borrowing
    "debt_receipts_net": _metric("debt_receipts_net", "Debt Receipts (Net)", "debt", "Net debt financing of the fiscal deficit"),
    "market_borrowings_net": _metric("market_borrowings_net", "Market Borrowings (Net)", "debt", "Net government-security market borrowing", "debt_receipts_net"),
    "short_term_borrowing": _metric("short_term_borrowing", "Short-Term Borrowing", "debt", "Short-term borrowing including Treasury Bills", "debt_receipts_net"),
    "securities_against_small_savings": _metric("securities_against_small_savings", "Securities Against Small Savings", "debt", "Securities issued against small savings", "debt_receipts_net"),
    "external_debt_net": _metric("external_debt_net", "External Debt Receipts (Net)", "debt", "Net external debt financing", "debt_receipts_net"),
    # Federal finance
    "finance_commission_grants": _metric("finance_commission_grants", "Finance Commission Grants", "federal", "Grants under Finance Commission recommendations"),
    "other_grants_loans_transfers": _metric("other_grants_loans_transfers", "Other Grants, Loans and Transfers", "federal", "Other Union transfers"),
    "tax_devolution_states": _metric("tax_devolution_states", "Tax Devolution to States", "federal", "States' share in Union taxes"),
    "total_transfers_states_uts": _metric("total_transfers_states_uts", "Total Transfers to States and UTs", "federal", "Total transfers to States and UTs with legislature"),
    # Denominator
    "nominal_gdp": _metric("nominal_gdp", "Nominal GDP", "accounts", "Current-price GDP denominator used in Budget ratios"),
}


def get_metric(metric_id: str) -> MetricDefinition | None:
    return METRICS.get(metric_id)


def get_metrics_by_category(category: DomainType) -> list[MetricDefinition]:
    return [metric for metric in METRICS.values() if metric["domain"] == category]


def validate_metric_id(metric_id: str) -> bool:
    return metric_id in METRICS
