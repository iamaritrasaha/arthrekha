"""
Financial Observation Model

Python implementation of the Arthrekha financial observation schema.
Mirrors the TypeScript definitions in src/types/financial.ts
"""

from dataclasses import dataclass
from typing import Literal, TypedDict
import hashlib
import json
import re


JurisdictionType = Literal["union", "state", "ut"]
PeriodType = Literal["annual", "quarterly", "monthly", "cumulative", "ytd"]
EstimateType = Literal["BE", "RE", "actual", "provisional", "audited_actual", "final_actual"]
DataStatus = Literal["final", "provisional", "estimated", "derived", "audited"]
ComparisonStatus = Literal["comparable", "comparable_with_note", "not_comparable"]
IdentityVersion = Literal[1, 2]


class ComparisonEligibility(TypedDict, total=False):
    status: ComparisonStatus
    rationale: str


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
    definition: str | None = None  # Wording/definition as published by the source
    source_id: str | None = None
    release_id: str | None = None
    source_hash: str | None = None  # SHA-256 of preserved raw source bytes
    page: str | None = None
    row: str | None = None


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
    definition_id: str | None = None
    coverage: str | None = None
    classification_type: str | None = None
    parent_metric: str | None = None
    debt_category: str | None = None
    ratio_denominator: str | None = None
    canonical_definition: str | None = None
    definition_version: str | None = None
    comparison_eligibility: ComparisonEligibility | None = None
    identity_version: IdentityVersion = 1
    id: str | None = None

    def __post_init__(self):
        """Generate deterministic ID after initialization"""
        if self.id is None:
            self.id = self.generate_id()

    def generate_id(self) -> str:
        """
        Generate deterministic hash ID from key fields.

        Identity v1 is the frozen FY 2026-27 production algorithm. Identity v2
        is release-qualified and must be opted into explicitly for historical
        or multi-release observations. Source hashes are provenance and
        integrity metadata, not semantic release identity.
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
        if self.identity_version == 1:
            key_string = "|".join(key_parts)
        elif self.identity_version == 2:
            if not self.source or not self.source.source_id or not self.source.release_id:
                raise ValueError("identity_version=2 requires source.source_id and source.release_id")
            key_string = "|".join([
                "identity-v2",
                *key_parts,
                self.source.source_id,
                self.source.release_id,
            ])
        else:
            raise ValueError(f"unsupported observation identity version: {self.identity_version}")
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
            source_dict = {
                "organization": self.source.organization,
                "document": self.source.document,
                "url": self.source.url,
                "table": self.source.table,
                "page": self.source.page,
                "row": self.source.row,
                "publishedAt": self.source.published_at,
                "retrievedAt": self.source.retrieved_at,
                "dataStatus": self.source.data_status,
                "notes": self.source.notes,
                "definition": self.source.definition,
            }
            source_dict.update({
                key: value for key, value in {
                    "sourceId": self.source.source_id,
                    "releaseId": self.source.release_id,
                    "sourceHash": self.source.source_hash,
                }.items() if value is not None
            })
            result["source"] = source_dict

        optional_metadata = {
            "definitionId": self.definition_id,
            "coverage": self.coverage,
            "classificationType": self.classification_type,
            "parentMetric": self.parent_metric,
            "debtCategory": self.debt_category,
            "ratioDenominator": self.ratio_denominator,
            "canonicalDefinition": self.canonical_definition,
            "definitionVersion": self.definition_version,
            "comparisonEligibility": self.comparison_eligibility,
        }
        result.update({key: value for key, value in optional_metadata.items() if value is not None})

        # Keep the production v1 payload unchanged; only release-qualified
        # records need to announce the non-default identity strategy.
        if self.identity_version != 1:
            result["identityVersion"] = self.identity_version

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
    financial_year: str | None = None
    estimate_type: EstimateType | None = None

    def to_dict(self) -> dict:
        result = {
            "metric": self.metric,
            "formula": self.formula,
            "inputs": self.inputs,
            "value": self.value,
            "unit": self.unit,
            "description": self.description,
        }
        if self.financial_year is not None:
            result["financialYear"] = self.financial_year
        if self.estimate_type is not None:
            result["estimateType"] = self.estimate_type
        return result


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

    # Estimate type validation
    valid_estimate_types = {"BE", "RE", "actual", "provisional", "audited_actual", "final_actual"}
    if obs.estimate_type not in valid_estimate_types:
        errors.append(f"invalid estimate_type: '{obs.estimate_type}', must be one of {sorted(valid_estimate_types)}")

    # Provenance and data status
    if obs.source is None:
        errors.append("source provenance is required")
    else:
        if not obs.source.organization:
            errors.append("source.organization is required")
        if not obs.source.document:
            errors.append("source.document is required")
        valid_data_statuses = {"final", "provisional", "estimated", "derived", "audited"}
        if obs.source.data_status not in valid_data_statuses:
            errors.append(f"invalid data_status: '{obs.source.data_status}', must be one of {sorted(valid_data_statuses)}")
        if obs.identity_version == 2:
            if not obs.source.source_id:
                errors.append("identity_version=2 requires source.source_id")
            if not obs.source.release_id:
                errors.append("identity_version=2 requires source.release_id")
        if obs.source.source_hash and not re.fullmatch(r"[0-9a-fA-F]{64}", obs.source.source_hash):
            errors.append("source.source_hash must be a 64-character SHA-256 hex digest")

    if obs.identity_version not in (1, 2):
        errors.append(f"invalid identity_version: {obs.identity_version}")

    if obs.comparison_eligibility:
        valid_comparison_statuses = {"comparable", "comparable_with_note", "not_comparable"}
        if obs.comparison_eligibility.get("status") not in valid_comparison_statuses:
            errors.append("comparison_eligibility.status must be comparable, comparable_with_note, or not_comparable")
        if obs.comparison_eligibility.get("status") == "comparable_with_note" and not obs.comparison_eligibility.get("rationale"):
            errors.append("comparable_with_note requires comparison_eligibility.rationale")

    return errors


def _is_valid_fy_format(fy: str) -> bool:
    """Check if FY string matches expected format: YYYY-YY"""
    import re
    return bool(re.match(r"^\d{4}-\d{2}$", fy))
