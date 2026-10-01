"""
Tests for financial data models and validation
"""

import json
from pathlib import Path

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


def test_observation_validation_invalid_data_status():
    """Test validation catches invalid data_status like 'BE'"""
    source = DataSource(
        organization="Test",
        document="Test",
        retrieved_at="2026-08-27",
        data_status="BE",  # Invalid! Not in DataStatus union
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
    assert any("data_status" in e and "must be one of" in e for e in errors)


def test_observation_validation_invalid_estimate_type():
    """Test validation catches invalid estimate_type"""
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
        estimate_type="INVALID_TYPE",
        source=source,
    )

    errors = validate_observation(obs)
    assert any("estimate_type" in e and "must be one of" in e for e in errors)


def test_observation_validation_valid_data_statuses():
    """Test validation accepts canonical data_statuses"""
    for status in ["final", "provisional", "derived", "estimated", "audited"]:
        source = DataSource(
            organization="Test",
            document="Test",
            retrieved_at="2026-08-27",
            data_status=status,
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
        assert len(errors) == 0, f"Expected {status} to be valid, got: {errors}"


def _release_observation(
    estimate_type: str,
    release_id: str,
    *,
    source_hash: str | None = None,
    amount: float = 100.0,
) -> FinancialObservation:
    return FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2025-26",
        period_type="annual",
        metric="fiscal_deficit",
        amount=amount,
        estimate_type=estimate_type,
        identity_version=2,
        source=DataSource(
            organization="Ministry of Finance",
            document="Budget at a Glance",
            url="https://www.indiabudget.gov.in/budget2025-26/",
            definition="Fiscal deficit as printed in the source",
            source_id="mof-budget-at-a-glance",
            release_id=release_id,
            source_hash=source_hash,
            data_status="provisional" if estimate_type == "provisional" else "audited" if estimate_type in {"final_actual", "audited_actual"} else "final",
        ),
        canonical_definition="Total expenditure less non-borrowed receipts",
        definition_version="1",
    )


def test_release_qualified_identity_uses_source_and_release_not_artifact_hash():
    first = _release_observation("BE", "budget-2025-02", source_hash="a" * 64)
    second = _release_observation("BE", "budget-2025-07")
    identical_download = _release_observation("BE", "budget-2025-02", source_hash="a" * 64)
    rehosted_artifact = _release_observation("BE", "budget-2025-02", source_hash="b" * 64)
    silently_revised_artifact = _release_observation(
        "BE", "budget-2025-02", source_hash="c" * 64, amount=101.0
    )
    corrected_release = _release_observation("BE", "budget-2025-02-corrected", source_hash="c" * 64, amount=101.0)

    assert first.id != second.id
    assert first.id == identical_download.id
    assert first.id == rehosted_artifact.id
    assert first.id == silently_revised_artifact.id
    assert first.source.url == silently_revised_artifact.source.url
    assert first.source.source_hash != rehosted_artifact.source.source_hash
    assert silently_revised_artifact.source.source_hash == corrected_release.source.source_hash
    assert silently_revised_artifact.id != corrected_release.id
    assert first.generate_id() == first.id


def test_estimate_states_remain_distinct_within_one_fy_and_release():
    be = _release_observation("BE", "budget-2025-02")
    re = _release_observation("RE", "budget-2026-02")
    provisional = _release_observation("provisional", "cga-provisional-close-2026")
    final = _release_observation("final_actual", "cga-finance-accounts-2026")

    assert len({be.id, re.id, provisional.id, final.id}) == 4
    assert validate_observation(final) == []


def test_release_provenance_and_definition_wording_serialize_separately():
    observation = _release_observation("BE", "budget-2025-02", source_hash="b" * 64)
    encoded = observation.to_dict()

    assert encoded["identityVersion"] == 2
    assert encoded["definitionVersion"] == "1"
    assert encoded["canonicalDefinition"] == "Total expenditure less non-borrowed receipts"
    assert encoded["source"]["definition"] == "Fiscal deficit as printed in the source"
    assert encoded["source"]["sourceId"] == "mof-budget-at-a-glance"
    assert encoded["source"]["releaseId"] == "budget-2025-02"
    assert encoded["source"]["sourceHash"] == "b" * 64


def test_v2_identity_requires_source_and_release_identity_and_valid_hash():
    missing_identity = FinancialObservation(
        jurisdiction="india",
        jurisdiction_type="union",
        financial_year="2025-26",
        period_type="annual",
        metric="fiscal_deficit",
        amount=100.0,
        estimate_type="BE",
        identity_version=2,
        id="manual-validation-only",
        source=DataSource(organization="MoF", document="Budget", data_status="final"),
    )
    errors = validate_observation(missing_identity)
    assert "identity_version=2 requires source.source_id" in errors
    assert "identity_version=2 requires source.release_id" in errors

    invalid_hash = _release_observation("BE", "budget-2025-02", source_hash="not-a-sha256")
    assert "source.source_hash must be a 64-character SHA-256 hex digest" in validate_observation(invalid_hash)


def test_existing_fy_2026_27_production_ids_and_derived_references_are_unchanged():
    dataset_path = Path("datasets/processed/union/budget-summary-2026-27.json")
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    generated_ids = set()

    for record in dataset["observations"]:
        source_data = record["source"]
        source = DataSource(
            organization=source_data["organization"],
            document=source_data["document"],
            url=source_data.get("url"),
            table=source_data.get("table"),
            published_at=source_data.get("publishedAt"),
            retrieved_at=source_data.get("retrievedAt"),
            data_status=source_data["dataStatus"],
            notes=source_data.get("notes"),
            definition=source_data.get("definition"),
        )
        observation = FinancialObservation(
            jurisdiction=record["jurisdiction"],
            jurisdiction_type=record["jurisdictionType"],
            financial_year=record["financialYear"],
            period_type=record["periodType"],
            metric=record["metric"],
            amount=record["amount"],
            period=record.get("period"),
            category=record.get("category"),
            subcategory=record.get("subcategory"),
            estimate_type=record["estimateType"],
            source=source,
        )
        assert observation.id == record["id"]
        generated_ids.add(observation.id)

    assert len(generated_ids) == len(dataset["observations"])
    assert all(input_id in generated_ids for derived in dataset["derivedMetrics"] for input_id in derived["inputs"])


if __name__ == "__main__":
    test_financial_observation_creation()
    print("✓ test_financial_observation_creation")

    test_observation_validation_valid()
    print("✓ test_observation_validation_valid")

    test_observation_validation_missing_source()
    print("✓ test_observation_validation_missing_source")

    test_observation_validation_invalid_unit()
    print("✓ test_observation_validation_invalid_unit")

    test_observation_validation_invalid_data_status()
    print("✓ test_observation_validation_invalid_data_status")

    test_observation_validation_invalid_estimate_type()
    print("✓ test_observation_validation_invalid_estimate_type")

    test_observation_validation_valid_data_statuses()
    print("✓ test_observation_validation_valid_data_statuses")

    test_observation_to_dict()
    print("✓ test_observation_to_dict")

    print("\nAll tests passed!")
