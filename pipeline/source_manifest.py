"""
Source Manifest Schema

Defines the structure for documenting official data sources.
"""

from datetime import date
from typing import Literal, TypedDict


SourceFormat = Literal["pdf", "csv", "xlsx", "html", "json"]
EstimateType = Literal["BE", "RE", "actual", "provisional"]
DataStatus = Literal["final", "provisional", "estimated"]


class SourceManifest(TypedDict):
    """
    Machine-readable manifest for a data source
    """
    # Identification
    source_id: str
    source_organization: str
    document_name: str
    canonical_url: str

    # Time scope
    financial_year: str  # "2026-27"
    reporting_period: str | None  # "apr-jun" | "q1" | None for full year

    # Provenance
    publication_date: str | None  # ISO date if available
    retrieval_date: str  # ISO date when we retrieved it

    # Classification
    source_format: SourceFormat
    estimate_type: EstimateType
    data_status: DataStatus

    # Processing
    parser_used: str  # Name of parser function/module
    raw_file_path: str | None  # Path in datasets/raw/

    # Metadata
    authoritative_status: str  # "primary" | "secondary"
    notes: str | None

    # Metrics available
    metrics_available: list[str]  # List of metric IDs from registry


def create_source_manifest(
    source_id: str,
    organization: str,
    document_name: str,
    url: str,
    financial_year: str,
    estimate_type: EstimateType,
    source_format: SourceFormat,
    parser_used: str,
    metrics: list[str],
    reporting_period: str | None = None,
    publication_date: str | None = None,
    raw_file_path: str | None = None,
    notes: str | None = None,
) -> SourceManifest:
    """
    Create a source manifest entry
    """
    return {
        "source_id": source_id,
        "source_organization": organization,
        "document_name": document_name,
        "canonical_url": url,
        "financial_year": financial_year,
        "reporting_period": reporting_period,
        "publication_date": publication_date,
        "retrieval_date": date.today().isoformat(),
        "source_format": source_format,
        "estimate_type": estimate_type,
        "data_status": "provisional" if estimate_type == "provisional" else "final",
        "parser_used": parser_used,
        "raw_file_path": raw_file_path,
        "authoritative_status": "primary",
        "notes": notes,
        "metrics_available": metrics,
    }
