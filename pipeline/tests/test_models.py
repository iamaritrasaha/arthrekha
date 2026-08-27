"""
Tests for financial data models and validation
"""

from pipeline.models import FinancialObservation, DataSource, validate_observation


def test_financial_observation_creation():
    """Test creating a valid financial observation"""
    source = DataSource(
        organization="Ministry of Finance",
        document="Union Budget 2026-27",
        retrieved_at="2026-08-27",
        data_status="final",
    )

    obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period=None,
        period_type="annual",
        metric="revenue_receipts",
        amount=3003992,
        estimate_type="BE",
        source=source,
    )

    assert obs.jurisdiction == "india"
    assert obs.amount == 3003992
    assert obs.unit == "crore"
    assert obs.currency == "INR"
    assert obs.id is not None
    assert len(obs.id) == 16


def test_observation_validation_valid():
    """Test validation of valid observation"""
    source = DataSource(
        organization="Test Org",
        document="Test Doc",
        retrieved_at="2026-08-27",
        data_status="final",
    )

    obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period=None,
        period_type="annual",
        metric="total_expenditure",
        amount=5020579,
        estimate_type="BE",
        source=source,
    )

    errors = validate_observation(obs)
    assert len(errors) == 0


def test_observation_validation_missing_source():
    """Test validation catches missing source"""
    obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period=None,
        period_type="annual",
        metric="total_expenditure",
        amount=5020579,
        estimate_type="BE",
        source=None,
    )

    errors = validate_observation(obs)
    assert "source provenance is required" in errors


def test_observation_validation_invalid_unit():
    """Test validation catches invalid unit"""
    source = DataSource(
        organization="Test",
        document="Test",
        retrieved_at="2026-08-27",
        data_status="final",
    )

    obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period=None,
        period_type="annual",
        metric="total_expenditure",
        amount=5020579,
        unit="million",  # Wrong! Should be crore
        estimate_type="BE",
        source=source,
    )

    errors = validate_observation(obs)
    assert any("unit must be 'crore'" in e for e in errors)


def test_observation_to_dict():
    """Test serialization to dict"""
    source = DataSource(
        organization="MoF",
        document="Budget 2026-27",
        url="https://example.com",
        retrieved_at="2026-08-27",
        data_status="final",
    )

    obs = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2026-27",
        period="apr-jun",
        period_type="cumulative",
        metric="fiscal_deficit",
        amount=536924,
        estimate_type="provisional",
        source=source,
    )

    d = obs.to_dict()

    assert d["jurisdiction"] == "india"
    assert d["jurisdictionType"] == "union"
    assert d["financialYear"] == "2026-27"
    assert d["period"] == "apr-jun"
    assert d["metric"] == "fiscal_deficit"
    assert d["amount"] == 536924
    assert d["estimateType"] == "provisional"
    assert "source" in d
    assert d["source"]["organization"] == "MoF"


if __name__ == "__main__":
    test_financial_observation_creation()
    print("✓ test_financial_observation_creation")

    test_observation_validation_valid()
    print("✓ test_observation_validation_valid")

    test_observation_validation_missing_source()
    print("✓ test_observation_validation_missing_source")

    test_observation_validation_invalid_unit()
    print("✓ test_observation_validation_invalid_unit")

    test_observation_to_dict()
    print("✓ test_observation_to_dict")

    print("\nAll tests passed!")
