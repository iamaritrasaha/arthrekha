"""
End-to-end integration and schema contract tests for the pipeline outputs:
- datasets/processed/union/budget-summary-{fy}.json
- datasets/metadata/sources.json
"""

import json
import os
from pathlib import Path


VALID_DATA_STATUSES = {"final", "provisional", "estimated", "derived", "audited"}
VALID_ESTIMATE_TYPES = {"BE", "RE", "actual", "provisional"}

def get_fy_and_periods():
    fy = os.environ.get("FINANCIAL_YEAR")
    cga_files = list(Path("datasets/raw").glob("cga_*_*.json"))
    if not cga_files:
        return fy or "2026-27", set()

    # If not provided, infer from the first file found
    if not fy:
        fy = cga_files[0].stem.split("_")[1]

    periods = set()
    for f in Path("datasets/raw").glob(f"cga_{fy}_*.json"):
        try:
            with open(f) as fp:
                data = json.load(fp)
                if "reporting_period" in data:
                    periods.add(data["reporting_period"])
        except Exception:
            continue
    return fy, periods

def test_processed_budget_summary_schema_and_integrity():
    fy, available_periods = get_fy_and_periods()
    summary_path = Path(f"datasets/processed/union/budget-summary-{fy}.json")
    assert summary_path.exists(), f"{summary_path.name} must exist"

    with open(summary_path, "r") as f:
        data = json.load(f)

    assert data["financialYear"] == fy

    if available_periods:
        assert data["metadata"]["latestPeriod"] in available_periods

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

    # Ensure CGA has 10 observations * number of periods
    cga_obs = [obs for obs in data["observations"] if obs["estimateType"] == "provisional"]
    assert len(cga_obs) == 10 * len(available_periods)

    periods = {obs["period"] for obs in cga_obs}
    assert periods == available_periods


def test_sources_manifest_completeness_and_attribution():
    fy, available_periods = get_fy_and_periods()
    sources_path = Path("datasets/metadata/sources.json")
    assert sources_path.exists(), "sources.json must exist"

    with open(sources_path, "r") as f:
        sources = json.load(f)

    assert len(sources) == 1 + len(available_periods)

    source_ids = {s["source_id"] for s in sources}
    assert f"union-budget-{fy}-be" in source_ids
    for p in available_periods:
        assert f"cga-{fy}-{p}" in source_ids

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
