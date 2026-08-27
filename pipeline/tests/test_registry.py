from pipeline.metrics import METRICS, get_metric, get_metrics_by_category
from pipeline.parsers.json_parser import load_budget_be_2026_27
from pipeline.validators import validate_reconciliation


def test_expanded_registry_covers_first_deep_finance_batch():
    assert len(METRICS) == 44
    assert get_metric("primary_deficit")["parent_metric"] == "fiscal_deficit"
    assert get_metric("market_borrowings_net")["domain"] == "debt"
    assert len(get_metrics_by_category("federal")) >= 4


def test_official_budget_source_values_and_provenance():
    observations = load_budget_be_2026_27()
    by_metric = {observation.metric: observation for observation in observations}

    assert len(observations) == 44
    assert by_metric["total_expenditure"].amount == 5347315
    assert by_metric["primary_deficit"].amount == 291796
    assert by_metric["total_expenditure"].source.organization.startswith("Ministry of Finance")
    assert by_metric["primary_deficit"].source.table == "Budget at a Glance, page 1, row 18"
    assert by_metric["market_borrowings_net"].debt_category == "internal-market-borrowing-flow"


def test_receipts_and_expenditure_hierarchies_reconcile():
    observations = load_budget_be_2026_27()
    non_borrowed = validate_reconciliation(
        observations,
        "non_borrowed_receipts",
        ["revenue_receipts", "non_debt_capital_receipts"],
    )
    expenditure = validate_reconciliation(
        observations,
        "total_expenditure",
        ["revenue_expenditure", "capital_expenditure"],
    )
    assert non_borrowed["all_reconcile"]
    assert expenditure["all_reconcile"]


def test_derived_source_status_is_preserved():
    observation = next(item for item in load_budget_be_2026_27() if item.metric == "non_borrowed_receipts")
    assert observation.source.data_status == "derived"
    assert observation.source.definition == "Revenue receipts plus non-debt capital receipts."
