"""Tests for parsers."""

import json
from pathlib import Path
from tempfile import TemporaryDirectory

from pipeline.parsers.budget_parser import parse_budget_be_2026_27
from pipeline.parsers.cga_parser import parse_cga_actuals
from pipeline.parsers.json_parser import parse_json_source


def test_budget_parser():
    """Test Budget BE parser"""
    sample_data = {
        "revenue_receipts": 3003992,
        "total_expenditure": 5020579,
        "fiscal_deficit": 1907013,
    }

    observations = parse_budget_be_2026_27(sample_data)

    assert len(observations) == 3
    assert all(obs.jurisdiction == "india" for obs in observations)
    assert all(obs.financial_year == "2026-27" for obs in observations)
    assert all(obs.estimate_type == "BE" for obs in observations)
    assert all(obs.period_type == "annual" for obs in observations)
    assert all(obs.source is not None for obs in observations)


def test_cga_parser():
    """Test CGA actuals parser"""
    sample_data = {
        "revenue_receipts": 645890,
        "total_expenditure": 1201579,
        "fiscal_deficit": 536924,
    }

    observations = parse_cga_actuals(sample_data, period="apr-jun")

    assert len(observations) == 3
    assert all(obs.jurisdiction == "india" for obs in observations)
    assert all(obs.financial_year == "2026-27" for obs in observations)
    assert all(obs.estimate_type == "provisional" for obs in observations)
    assert all(obs.period == "apr-jun" for obs in observations)
    assert all(obs.period_type == "cumulative" for obs in observations)
    assert all(obs.source.data_status == "provisional" for obs in observations)


def test_parser_validates_metric_ids():
    """Test parsers reject invalid metric IDs"""
    invalid_data = {
        "invalid_metric_name": 12345,
    }

    try:
        parse_budget_be_2026_27(invalid_data)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Unknown metric ID" in str(e)


def test_json_parser_preserves_release_identity_hash_and_definition_contract():
    raw = {
        "identityVersion": 2,
        "financial_year": "2025-26",
        "period_type": "annual",
        "estimate_type": "BE",
        "data_status": "final",
        "source": {
            "organization": "Ministry of Finance",
            "document": "Budget at a Glance",
            "source_id": "mof-budget-at-a-glance",
            "release_id": "budget-2025-02",
            "source_hash": "c" * 64,
            "retrieval_date": "2026-10-01",
        },
        "data": {"fiscal_deficit": 100},
        "metric_metadata": {
            "fiscal_deficit": {
                "definition": "The source's original wording",
                "canonical_definition": "Total expenditure less non-borrowed receipts",
                "definition_version": "1",
                "comparison_eligibility": {
                    "status": "comparable_with_note",
                    "rationale": "Source row mapping reviewed.",
                },
            }
        },
    }
    with TemporaryDirectory() as directory:
        raw_path = Path(directory) / "source.json"
        raw_path.write_text(json.dumps(raw), encoding="utf-8")
        observation = parse_json_source(str(raw_path))[0]

    assert observation.identity_version == 2
    assert observation.source.source_id == "mof-budget-at-a-glance"
    assert observation.source.release_id == "budget-2025-02"
    assert observation.source.source_hash == "c" * 64
    assert observation.source.definition == "The source's original wording"
    assert observation.canonical_definition == "Total expenditure less non-borrowed receipts"
    assert observation.definition_version == "1"
    assert observation.comparison_eligibility == {
        "status": "comparable_with_note",
        "rationale": "Source row mapping reviewed.",
    }


if __name__ == "__main__":
    test_budget_parser()
    print("✓ test_budget_parser")

    test_cga_parser()
    print("✓ test_cga_parser")

    test_parser_validates_metric_ids()
    print("✓ test_parser_validates_metric_ids")

    print("\nAll parser tests passed!")
