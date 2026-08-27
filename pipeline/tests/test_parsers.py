"""
Tests for parsers
"""

from pipeline.parsers.budget_parser import parse_budget_be_2026_27
from pipeline.parsers.cga_parser import parse_cga_actuals


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


if __name__ == "__main__":
    test_budget_parser()
    print("✓ test_budget_parser")

    test_cga_parser()
    print("✓ test_cga_parser")

    test_parser_validates_metric_ids()
    print("✓ test_parser_validates_metric_ids")

    print("\nAll parser tests passed!")
