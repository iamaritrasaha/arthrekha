"""
Financial Observation Model

Python implementation of the Arthrekha financial observation schema.
Mirrors the TypeScript definitions in src/types/financial.ts
"""

from dataclasses import dataclass
from typing import Literal
import hashlib
import json


JurisdictionType = Literal["union", "state", "ut"]
PeriodType = Literal["annual", "quarterly", "monthly", "cumulative", "ytd"]
EstimateType = Literal["BE", "RE", "actual", "provisional"]
DataStatus = Literal["final", "provisional", "estimated", "derived"]


@dataclass
class DataSource:
    """
    Provenance information for every observation.
    Every number must be traceable.
    """
    organization: str
    document: str
    url: str | None = None
    table: str | None = None
    published_at: str | None = None  # ISO date
    retrieved_at: str | None = None  # ISO date
    data_status: DataStatus = "provisional"
    notes: str | None = None
    definition: str | None = None


@dataclass
class FinancialObservation:
    """
    The atomic unit of fiscal data in Arthrekha.

    All amounts stored in ₹ crore.
    """
    # Jurisdiction
    jurisdiction: str
    jurisdiction_type: JurisdictionType

    # Time
    financial_year: str  # "2026-27"
    period_type: PeriodType

    # Classification
    metric: str

    # Value (always in ₹ crore)
    amount: float

    # Fields with defaults must come after fields without defaults
    period: str | None = None  # "apr-jun" | "q1" | None
    category: str | None = None
    subcategory: str | None = None
    unit: str = "crore"
    currency: str = "INR"
    estimate_type: EstimateType = "actual"
    source: DataSource | None = None
    id: str | None = None

    def __post_init__(self):
        """Generate deterministic ID after initialization"""
        if self.id is None:
            self.id = self.generate_id()

    def generate_id(self) -> str:
        """
        Generate deterministic hash ID from key fields
        """
        key_parts = [
            self.jurisdiction,
            self.jurisdiction_type,
            self.financial_year,
            self.period or "full-year",
            self.period_type,
            self.metric,
            self.category or "",
            self.subcategory or "",
            self.estimate_type,
        ]
        key_string = "|".join(key_parts)
        return hashlib.sha256(key_string.encode()).hexdigest()[:16]

    def to_dict(self) -> dict:
        """
        Convert to dictionary for JSON serialization
        """
        result = {
            "id": self.id,
            "jurisdiction": self.jurisdiction,
            "jurisdictionType": self.jurisdiction_type,
            "financialYear": self.financial_year,
            "periodType": self.period_type,
            "metric": self.metric,
            "amount": self.amount,
            "unit": self.unit,
            "currency": self.currency,
            "estimateType": self.estimate_type,
        }

        if self.period:
            result["period"] = self.period

        if self.category:
            result["category"] = self.category

        if self.subcategory:
            result["subcategory"] = self.subcategory

        if self.source:
            result["source"] = {
                "organization": self.source.organization,
                "document": self.source.document,
                "url": self.source.url,
                "table": self.source.table,
                "publishedAt": self.source.published_at,
                "retrievedAt": self.source.retrieved_at,
                "dataStatus": self.source.data_status,
                "notes": self.source.notes,
                "definition": self.source.definition,
            }

        return result


@dataclass
class DerivedMetric:
    """
    Calculated values with explicit formulas
    """
    metric: str
    formula: str
    inputs: list[str]  # IDs of source observations
    value: float
    unit: str
    description: str | None = None

    def to_dict(self) -> dict:
        return {
            "metric": self.metric,
            "formula": self.formula,
            "inputs": self.inputs,
            "value": self.value,
            "unit": self.unit,
            "description": self.description,
        }


def validate_observation(obs: FinancialObservation) -> list[str]:
    """
    Validate a financial observation.
    Returns list of validation errors (empty if valid).
    """
    errors = []

    # Required fields
    if not obs.jurisdiction:
        errors.append("jurisdiction is required")

    if not obs.financial_year:
        errors.append("financial_year is required")

    if not obs.metric:
        errors.append("metric is required")

    # Unit validation
    if obs.unit != "crore":
        errors.append(f"unit must be 'crore', got '{obs.unit}'")

    if obs.currency != "INR":
        errors.append(f"currency must be 'INR', got '{obs.currency}'")

    # Amount validation
    if obs.amount is None:
        errors.append("amount is required")

    # FY format validation
    if obs.financial_year and not _is_valid_fy_format(obs.financial_year):
        errors.append(f"invalid financial year format: {obs.financial_year}")

    # Provenance
    if obs.source is None:
        errors.append("source provenance is required")
    elif not obs.source.organization:
        errors.append("source.organization is required")
    elif not obs.source.document:
        errors.append("source.document is required")

    return errors


def _is_valid_fy_format(fy: str) -> bool:
    """Check if FY string matches expected format: YYYY-YY"""
    import re
    return bool(re.match(r"^\d{4}-\d{2}$", fy))
