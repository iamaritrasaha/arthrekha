"""
Tests for pipeline validation functions:
- validate_observations
- validate_reconciliation
- validate_deficit_identities
- validate_execution_rate
"""

from pipeline.models import DataSource, FinancialObservation
from pipeline.parsers.json_parser import load_all_sources
from pipeline.validators import (
    ValidationError,
    validate_deficit_identities,
    validate_execution_rate,
    validate_observations,
    validate_reconciliation,
)


def test_validate_observations():
    source = DataSource(
        organization="Test Org",
        document="Test Doc",
        retrieved_at="2026-08-27",
        data_status="final",
    )
    valid_obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period=None,
        period_type="annual",
        metric="total_expenditure",
        amount=5347315,
        estimate_type="BE",
        source=source,
    )
    invalid_obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period=None,
        period_type="annual",
        metric="total_expenditure",
        amount=5347315,
        unit="usd",  # invalid
        estimate_type="BE",
        source=source,
    )

    result = validate_observations([valid_obs, invalid_obs])
    assert result["total"] == 2
    assert result["valid"] == 1
    assert result["invalid"] == 1
    assert len(result["errors"]) == 1


def test_validate_deficit_identities_on_official_data():
    observations, _ = load_all_sources()
    result = validate_deficit_identities(observations)

    assert result["all_reconcile"] is True
    assert len(result["checks"]) > 0

    # Ensure all four identities are represented
    metrics_checked = {c["metric"] for c in result["checks"]}
    assert "fiscal_deficit" in metrics_checked
    assert "revenue_deficit" in metrics_checked
    assert "effective_revenue_deficit" in metrics_checked
    assert "primary_deficit" in metrics_checked

    # Check differences are all 0 or within tolerance
    for check in result["checks"]:
        assert check["difference"] <= 1.0, f"Identity {check['metric']} failed with diff {check['difference']}"


def test_validate_reconciliation_on_official_data():
    observations, _ = load_all_sources()

    receipts_rec = validate_reconciliation(
        observations,
        "non_borrowed_receipts",
        ["revenue_receipts", "non_debt_capital_receipts"],
    )
    assert receipts_rec["all_reconcile"] is True

    exp_rec = validate_reconciliation(
        observations,
        "total_expenditure",
        ["revenue_expenditure", "capital_expenditure"],
    )
    assert exp_rec["all_reconcile"] is True


def test_validate_execution_rate_valid_and_invalid():
    source_be = DataSource(
        organization="MoF",
        document="Budget 2026-27",
        retrieved_at="2026-08-27",
        data_status="final",
    )
    source_cga = DataSource(
        organization="CGA",
        document="Accounts at a Glance - July 2026",
        retrieved_at="2026-09-09",
        data_status="provisional",
    )
    be_obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period=None,
        period_type="annual",
        metric="fiscal_deficit",
        amount=1695768,
        estimate_type="BE",
        source=source_be,
    )
    actual_obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period="2026-07",
        period_type="cumulative",
        metric="fiscal_deficit",
        amount=455144,
        estimate_type="provisional",
        source=source_cga,
    )

    rate = validate_execution_rate(be_obs, actual_obs)
    assert rate["metric"] == "fiscal_deficit"
    assert round(rate["execution_rate"], 1) == 26.8

    # Mismatched metrics should raise ValidationError
    mismatched_obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period="2026-07",
        period_type="cumulative",
        metric="revenue_receipts",
        amount=1267573,
        estimate_type="provisional",
        source=source_cga,
    )
    try:
        validate_execution_rate(be_obs, mismatched_obs)
        assert False, "Should have raised ValidationError"
    except ValidationError:
        pass


def test_validate_deficit_identities_negative_failure():
    """Accounting identity failure is properly detected when components do not sum to deficit."""
    source = DataSource(organization="Test", document="Test", data_status="provisional")
    # Total Expenditure (100) - Non-Borrowed Receipts (40) should give Fiscal Deficit = 60.
    # We intentionally set Fiscal Deficit to 999.
    obs = [
        FinancialObservation(
            jurisdiction="india", jurisdiction_type="union", financial_year="2026-27",
            period="apr-jul", period_type="annual", metric="total_expenditure", amount=100.0,
            estimate_type="provisional", source=source,
        ),
        FinancialObservation(
            jurisdiction="india", jurisdiction_type="union", financial_year="2026-27",
            period="apr-jul", period_type="annual", metric="non_borrowed_receipts", amount=40.0,
            estimate_type="provisional", source=source,
        ),
        FinancialObservation(
            jurisdiction="india", jurisdiction_type="union", financial_year="2026-27",
            period="apr-jul", period_type="annual", metric="fiscal_deficit", amount=999.0,
            estimate_type="provisional", source=source,
        ),
    ]
    res = validate_deficit_identities(obs)
    assert res["all_reconcile"] is False
    assert len(res["checks"]) == 1
    assert res["checks"][0]["metric"] == "fiscal_deficit"
    assert res["checks"][0]["reconciles"] is False
    assert res["checks"][0]["difference"] == 939.0



if __name__ == "__main__":
    test_validate_observations()
    print("✓ test_validate_observations")

    test_validate_deficit_identities_on_official_data()
    print("✓ test_validate_deficit_identities_on_official_data")

    test_validate_reconciliation_on_official_data()
    print("✓ test_validate_reconciliation_on_official_data")

    test_validate_execution_rate_valid_and_invalid()
    print("✓ test_validate_execution_rate_valid_and_invalid")

    print("\nAll validator tests passed!")
