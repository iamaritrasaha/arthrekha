"""
Real data parser for JSON-structured raw sources

Parses structured JSON files from datasets/raw/ containing
official government financial data.
"""

import json
from pathlib import Path
import re
from pipeline.scripts.fy_utils import active_financial_year

FINANCIAL_YEAR = active_financial_year()
from pipeline.models import FinancialObservation, DataSource
from pipeline.metrics import get_metric, validate_metric_id


def parse_json_source(file_path: str) -> list[FinancialObservation]:
    """
    Parse a structured JSON source file.

    Args:
        file_path: Path to JSON file in datasets/raw/

    Returns:
        List of FinancialObservation objects
    """
    with open(file_path, 'r') as f:
        raw = json.load(f)

    observations = []

    # Extract source metadata
    source_meta = raw['source']
    metric_metadata = raw.get('metric_metadata', {})

    # Parse each metric
    for metric_id, amount in raw['data'].items():
        # Validate metric ID
        if not validate_metric_id(metric_id):
            raise ValueError(f"Unknown metric ID in {file_path}: {metric_id}")

        metric_meta = metric_metadata.get(metric_id, {})
        registry_definition = get_metric(metric_id)
        data_status = metric_meta.get(
            'data_status',
            raw.get('data_status') or ('final' if raw.get('estimate_type') == 'BE' else 'provisional'),
        )
        source = DataSource(
            organization=source_meta['organization'],
            document=source_meta['document'],
            url=source_meta.get('url'),
            table=metric_meta.get('table', source_meta.get('table')),
            page=metric_meta.get('page', source_meta.get('page')),
            row=metric_meta.get('row', source_meta.get('row')),
            published_at=source_meta.get('publication_date'),
            retrieved_at=source_meta['retrieval_date'],
            data_status=data_status,
            notes=source_meta.get('notes'),
            definition=metric_meta.get('source_definition', metric_meta.get('definition')),
            source_id=source_meta.get('source_id', source_meta.get('sourceId')),
            release_id=source_meta.get('release_id', source_meta.get('releaseId')),
            source_hash=source_meta.get('source_hash', source_meta.get('sourceHash')),
        )

        # Handle period for actuals vs budget estimates
        period = raw.get('reporting_period')
        period_type = raw.get('period_type', 'annual')

        obs = FinancialObservation(
            jurisdiction="india",
            jurisdiction_type="union",
            financial_year=raw['financial_year'],
            period=period,
            period_type=period_type,
            metric=metric_id,
            amount=float(amount),
            unit=raw.get('unit', 'crore'),
            currency=raw.get('currency', 'INR'),
            estimate_type=raw['estimate_type'],
            source=source,
            definition_id=metric_id,
            coverage="Union Government of India",
            classification_type=(registry_definition or {}).get("domain"),
            parent_metric=(registry_definition or {}).get("parent_metric"),
            debt_category=metric_meta.get('debt_category'),
            ratio_denominator=metric_meta.get('ratio_denominator'),
            canonical_definition=metric_meta.get('canonical_definition', metric_meta.get('canonicalDefinition')),
            definition_version=metric_meta.get('definition_version', metric_meta.get('definitionVersion')),
            comparison_eligibility=metric_meta.get('comparison_eligibility', metric_meta.get('comparisonEligibility')),
            identity_version=raw.get('identity_version', raw.get('identityVersion', 1)),
        )

        observations.append(obs)

    return observations


def load_budget_be() -> list[FinancialObservation]:
    """
    Load Budget Estimates FY 2026-27 from raw data.
    """
    file_path = f"datasets/raw/union_budget_{FINANCIAL_YEAR}_be.json"
    return parse_json_source(file_path)


def load_cga_actuals(period: str) -> list[FinancialObservation]:
    """
    Load CGA actuals for FY 2026-27.

    Args:
        period: "apr", "apr-may", "apr-jun", etc.
    """
    period_end = period.split("-")[-1]
    if period == "apr":
        suffix = "apr"
    elif re.fullmatch(r"[a-z]{3}", period_end):
        suffix = period_end
    else:
        raise ValueError(f"No data available for period: {period}")

    file_path = f"datasets/raw/cga_{FINANCIAL_YEAR}_{suffix}.json"
    return parse_json_source(file_path)


# Backwards-compatible aliases for earlier imports
load_budget_be_2026_27 = load_budget_be
load_cga_actuals_2026_27 = load_cga_actuals



def load_all_sources() -> tuple[list[FinancialObservation], dict[str, any]]:
    """
    Load all available sources for FY 2026-27.

    Returns:
        Tuple of (all observations, metadata dict)
    """
    observations = []
    sources_loaded = []

    # Load Budget Estimates
    be_obs = load_budget_be()
    observations.extend(be_obs)
    sources_loaded.append({
        "type": "Budget Estimate",
        "count": len(be_obs),
        "file": f"union_budget_{FINANCIAL_YEAR}_be.json"
    })

    # Load all available CGA actuals in fiscal-year order.
    actual_files = sorted(
        (
            path
            for path in Path("datasets/raw").glob(f"cga_{FINANCIAL_YEAR}_*.json")
            if not path.name.endswith(".provenance.json")
        ),
        key=lambda path: {"apr": 0, "may": 1, "jun": 2, "jul": 3, "aug": 4, "sep": 5,
                          "oct": 6, "nov": 7, "dec": 8, "jan": 9, "feb": 10, "mar": 11}.get(
                              path.stem.rsplit("_", 1)[-1], 99
                          ),
    )
    for file_path in actual_files:
        raw = json.loads(file_path.read_text())
        period = raw.get("reporting_period")
        if not period:
            continue
        cga_obs = parse_json_source(str(file_path))
        observations.extend(cga_obs)
        sources_loaded.append({
            "type": f"CGA Actuals {period}",
            "count": len(cga_obs),
            "file": file_path.name,
        })

    metadata = {
        "sources_loaded": sources_loaded,
        "total_observations": len(observations),
        "financial_year": FINANCIAL_YEAR,
    }

    return observations, metadata
