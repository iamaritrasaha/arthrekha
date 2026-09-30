"""
End-to-end integration and schema contract tests for the pipeline outputs:
- datasets/processed/union/budget-summary-2026-27.json
- datasets/metadata/sources.json
"""

import json
from pathlib import Path


VALID_DATA_STATUSES = {"final", "provisional", "estimated", "derived", "audited"}
VALID_ESTIMATE_TYPES = {"BE", "RE", "actual", "provisional"}


def test_processed_budget_summary_schema_and_integrity():
    summary_path = Path("datasets/processed/union/budget-summary-2026-27.json")
    assert summary_path.exists(), "budget-summary-2026-27.json must exist"

    with open(summary_path, "r") as f:
        data = json.load(f)

    assert data["financialYear"] == "2026-27"
    assert data["metadata"]["latestPeriod"] == "apr-jul"
    assert data["metadata"]["totalObservations"] == 84
    assert len(data["observations"]) == 84
    assert len(data["derivedMetrics"]) >= 17

    # Validate that NO observation has invalid dataStatus like "BE"
    for obs in data["observations"]:
        assert obs["source"]["dataStatus"] in VALID_DATA_STATUSES, (
            f"Observation {obs['metric']} has invalid dataStatus: {obs['source']['dataStatus']}"
        )
        assert obs["estimateType"] in VALID_ESTIMATE_TYPES, (
            f"Observation {obs['metric']} has invalid estimateType: {obs['estimateType']}"
        )

    # Ensure BE has all 44 metrics
    be_obs = [obs for obs in data["observations"] if obs["estimateType"] == "BE"]
    assert len(be_obs) == 44

    # Ensure CGA has 40 observations (10 metrics * 4 periods)
    cga_obs = [obs for obs in data["observations"] if obs["estimateType"] == "provisional"]
    assert len(cga_obs) == 40
    periods = {obs["period"] for obs in cga_obs}
    assert periods == {"apr", "apr-may", "apr-jun", "apr-jul"}


def test_sources_manifest_completeness_and_attribution():
    sources_path = Path("datasets/metadata/sources.json")
    assert sources_path.exists(), "sources.json must exist"

    with open(sources_path, "r") as f:
        sources = json.load(f)

    assert len(sources) == 5  # 1 BE + 4 CGA months

    source_ids = {s["source_id"] for s in sources}
    assert "union-budget-2026-27-be" in source_ids
    assert "cga-2026-27-apr" in source_ids
    assert "cga-2026-27-apr-may" in source_ids
    assert "cga-2026-27-apr-jun" in source_ids
    assert "cga-2026-27-apr-jul" in source_ids

    for s in sources:
        assert s["parser_used"] == "pipeline.parsers.json_parser"
        assert s["data_status"] in VALID_DATA_STATUSES
        assert Path(s["raw_file_path"]).exists()
        assert len(s["metrics_available"]) > 0


if __name__ == "__main__":
    test_processed_budget_summary_schema_and_integrity()
    print("✓ test_processed_budget_summary_schema_and_integrity")

    test_sources_manifest_completeness_and_attribution()
    print("✓ test_sources_manifest_completeness_and_attribution")

    print("\nAll pipeline E2E tests passed!")
