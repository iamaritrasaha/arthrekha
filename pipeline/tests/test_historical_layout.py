"""Structural contract tests; path helpers must not create historical datasets."""

import json
from pathlib import Path

from pipeline.historical_layout import (
    COMPARABILITY_MANIFEST_PATH,
    HISTORICAL_PROCESSED_ROOT,
    HISTORICAL_RAW_ROOT,
    HISTORICAL_SOURCE_MANIFEST_ROOT,
    historical_processed_path,
    historical_raw_directory,
    historical_source_manifest_path,
    validate_financial_year,
)


def test_historical_layout_resolves_documented_paths_without_creating_them():
    # Constants describe paths only. No directories or placeholder year files are created.
    assert historical_raw_directory("2025-26") == HISTORICAL_RAW_ROOT / "2025-26"
    assert historical_processed_path("2025-26") == HISTORICAL_PROCESSED_ROOT / "2025-26.json"
    assert historical_source_manifest_path("2025-26") == HISTORICAL_SOURCE_MANIFEST_ROOT / "2025-26.json"
    assert COMPARABILITY_MANIFEST_PATH == HISTORICAL_SOURCE_MANIFEST_ROOT.parent / "comparability.json"


def test_historical_layout_accepts_consecutive_canonical_years():
    for financial_year in ["2025-26", "2021-22", "2000-01"]:
        assert validate_financial_year(financial_year) == financial_year


def test_historical_layout_rejects_noncanonical_or_nonconsecutive_years():
    for financial_year in ["2025-2026", "25-26", "2025-27", "2026-25"]:
        try:
            validate_financial_year(financial_year)
        except ValueError:
            continue
        raise AssertionError(f"Expected invalid fiscal year to be rejected: {financial_year}")


def test_published_historical_index_resolves_only_validated_dataset_and_manifest_files():
    index = json.loads(Path("datasets/metadata/historical-index.json").read_text(encoding="utf-8"))
    assert index["schemaVersion"] == 1
    years = [entry["financialYear"] for entry in index["datasets"]]
    assert years == sorted(set(years))
    for entry in index["datasets"]:
        financial_year = validate_financial_year(entry["financialYear"])
        dataset = json.loads(historical_processed_path(financial_year).read_text(encoding="utf-8"))
        manifest = json.loads(historical_source_manifest_path(financial_year).read_text(encoding="utf-8"))
        assert dataset["financialYear"] == manifest["financialYear"] == financial_year
        assert entry["path"] == f"{financial_year}.json"
        assert entry["sourceManifestPath"] == f"manifests/{financial_year}.json"
