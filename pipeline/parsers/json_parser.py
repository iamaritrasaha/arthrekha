"""
Real data parser for JSON-structured raw sources

Parses structured JSON files from datasets/raw/ containing
official government financial data.
"""

import json
from pathlib import Path
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
        source = DataSource(
            organization=source_meta['organization'],
            document=source_meta['document'],
            url=source_meta.get('url'),
            table=metric_meta.get('table', source_meta.get('table')),
            published_at=source_meta.get('publication_date'),
            retrieved_at=source_meta['retrieval_date'],
            data_status=metric_meta.get('data_status', raw.get('estimate_type', 'provisional')),
            notes=source_meta.get('notes'),
            definition=metric_meta.get('definition'),
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
        )

        observations.append(obs)

    return observations


def load_budget_be_2026_27() -> list[FinancialObservation]:
    """
    Load Budget Estimates FY 2026-27 from raw data.
    """
    file_path = "datasets/raw/union_budget_2026-27_be.json"
    return parse_json_source(file_path)


def load_cga_actuals_2026_27(period: str) -> list[FinancialObservation]:
    """
    Load CGA actuals for FY 2026-27.

    Args:
        period: "apr", "apr-may", "apr-jun", etc.
    """
    # Map period to filename
    period_map = {
        "apr": "cga_2026-27_apr.json",
        "apr-may": "cga_2026-27_may.json",
        "apr-jun": "cga_2026-27_jun.json",
    }

    if period not in period_map:
        raise ValueError(f"No data available for period: {period}")

    file_path = f"datasets/raw/{period_map[period]}"
    return parse_json_source(file_path)


def load_all_sources() -> tuple[list[FinancialObservation], dict[str, any]]:
    """
    Load all available sources for FY 2026-27.

    Returns:
        Tuple of (all observations, metadata dict)
    """
    observations = []
    sources_loaded = []

    # Load Budget Estimates
    be_obs = load_budget_be_2026_27()
    observations.extend(be_obs)
    sources_loaded.append({
        "type": "Budget Estimate",
        "count": len(be_obs),
        "file": "union_budget_2026-27_be.json"
    })

    # Load all available CGA actuals
    for period in ["apr", "apr-may", "apr-jun"]:
        try:
            cga_obs = load_cga_actuals_2026_27(period)
            observations.extend(cga_obs)
            sources_loaded.append({
                "type": f"CGA Actuals {period}",
                "count": len(cga_obs),
                "file": f"cga_2026-27_{period.split('-')[-1]}.json"
            })
        except (FileNotFoundError, ValueError):
            pass  # Period not available yet

    metadata = {
        "sources_loaded": sources_loaded,
        "total_observations": len(observations),
        "financial_year": "2026-27",
    }

    return observations, metadata
