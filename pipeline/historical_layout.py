"""Path contracts for future year-partitioned historical fiscal data.

This module only resolves paths. It does not create directories, add a fiscal
year index, or change the current-year ingestion/refresh pipeline.
"""

from pathlib import Path
import re


HISTORICAL_RAW_ROOT = Path("datasets/raw/union")
HISTORICAL_PROCESSED_ROOT = Path("datasets/processed/union/history")
HISTORICAL_SOURCE_MANIFEST_ROOT = Path("datasets/metadata/source-manifests")
COMPARABILITY_MANIFEST_PATH = Path("datasets/metadata/comparability.json")


def validate_financial_year(financial_year: str) -> str:
    """Validate the canonical YYYY-YY format used by Arthrekha observations."""
    match = re.fullmatch(r"(\d{4})-(\d{2})", financial_year)
    if not match:
        raise ValueError(f"Financial year must use 'YYYY-YY' format, got {financial_year!r}")
    start = int(match.group(1))
    expected_end = str((start + 1) % 100).zfill(2)
    if match.group(2) != expected_end:
        raise ValueError(f"Financial year must span consecutive years, got {financial_year!r}")
    return financial_year


def historical_raw_directory(financial_year: str) -> Path:
    return HISTORICAL_RAW_ROOT / validate_financial_year(financial_year)


def historical_source_release_directory(financial_year: str, source_id: str, release_id: str) -> Path:
    """Resolve a release packet directory without creating it."""
    for label, value in (("source_id", source_id), ("release_id", release_id)):
        if not value or not re.fullmatch(r"[a-z0-9][a-z0-9._-]*", value):
            raise ValueError(f"{label} must be a non-empty lowercase path-safe identifier")
    return historical_raw_directory(financial_year) / source_id / release_id


def historical_source_artifact_path(
    financial_year: str,
    source_id: str,
    release_id: str,
    source_hash: str,
    extension: str,
) -> Path:
    """Resolve a content-addressed artifact path from the Phase 1 contract."""
    if not re.fullmatch(r"[0-9a-fA-F]{64}", source_hash):
        raise ValueError("source_hash must be a 64-character SHA-256 hex digest")
    normalized_extension = extension.removeprefix(".").lower()
    if not re.fullmatch(r"[a-z0-9]{1,8}", normalized_extension):
        raise ValueError("extension must be a simple file extension")
    return historical_source_release_directory(financial_year, source_id, release_id) / f"{source_hash.lower()}.{normalized_extension}"


def historical_processed_path(financial_year: str) -> Path:
    return HISTORICAL_PROCESSED_ROOT / f"{validate_financial_year(financial_year)}.json"


def historical_source_manifest_path(financial_year: str) -> Path:
    return HISTORICAL_SOURCE_MANIFEST_ROOT / f"{validate_financial_year(financial_year)}.json"
