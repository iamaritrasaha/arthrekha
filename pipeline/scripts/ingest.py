"""
Data ingestion orchestration script

Runs the complete pipeline:
1. Parse Budget Estimates
2. Parse CGA actuals
3. Normalize to FinancialObservation schema
4. Validate
5. Generate application-ready JSON datasets
"""

import json
from pathlib import Path
from datetime import date

from pipeline.parsers.json_parser import load_all_sources
from pipeline.validators import (
    validate_observations,
    validate_reconciliation,
    validate_execution_rate,
)
from pipeline.models import DerivedMetric
from pipeline.source_manifest import create_source_manifest


def run_ingestion():
    """
    Main ingestion pipeline
    """
    print("=" * 60)
    print("ARTHREKHA DATA INGESTION PIPELINE")
    print("=" * 60)
    print()

    # Step 1: Load all sources
    print("Step 1: Loading all sources for FY 2026-27...")
    all_observations, load_metadata = load_all_sources()

    for source in load_metadata['sources_loaded']:
        print(f"  ✓ Loaded {source['count']} observations from {source['file']}")
    print(f"  Total observations: {load_metadata['total_observations']}")
    print()

    # Step 2: Validate observations
    print("Step 2: Validating observations...")
    validation_results = validate_observations(all_observations)
    print(f"  Total: {validation_results['total']}")
    print(f"  Valid: {validation_results['valid']}")
    print(f"  Invalid: {validation_results['invalid']}")

    if validation_results['errors']:
        print("\n  ⚠ Validation errors:")
        for error in validation_results['errors']:
            print(f"    - {error}")
        return False

    if validation_results['warnings']:
        print(f"\n  ⚠ {len(validation_results['warnings'])} warnings")

    print("  ✓ All observations valid")
    print()

    # Step 3: Validate reconciliation
    print("Step 3: Validating reconciliation...")

    # Total receipts should equal revenue + non-debt capital receipts
    receipts_reconciliation = validate_reconciliation(
        all_observations,
        "total_receipts",
        ["revenue_receipts", "non_debt_capital_receipts"],
    )

    if receipts_reconciliation["all_reconcile"]:
        print("  ✓ Total receipts reconcile")
    else:
        print("  ✗ Total receipts reconciliation failed")
        for check in receipts_reconciliation["checks"]:
            if not check["reconciles"]:
                print(f"    Expected: {check['expected']}, Got: {check['calculated']}")

    # Revenue receipts should equal tax + non-tax
    revenue_reconciliation = validate_reconciliation(
        all_observations,
        "revenue_receipts",
        ["tax_revenue_net", "non_tax_revenue"],
    )

    if revenue_reconciliation["all_reconcile"]:
        print("  ✓ Revenue receipts reconcile")
    else:
        print("  ✗ Revenue receipts reconciliation failed")

    # Total expenditure should equal revenue + capital
    expenditure_reconciliation = validate_reconciliation(
        all_observations,
        "total_expenditure",
        ["revenue_expenditure", "capital_expenditure"],
    )

    if expenditure_reconciliation["all_reconcile"]:
        print("  ✓ Total expenditure reconciles")
    else:
        print("  ✗ Total expenditure reconciliation failed")

    print()

    # Step 4: Calculate derived metrics (execution rates)
    print("Step 4: Calculating execution rates...")
    derived_metrics = []

    # Separate BE and latest actual observations
    be_observations = [obs for obs in all_observations if obs.estimate_type == "BE"]
    actual_observations = [obs for obs in all_observations if obs.estimate_type == "provisional"]

    # Get latest period actuals (jun is latest)
    latest_actuals = [obs for obs in actual_observations if obs.period == "apr-jun"]

    be_by_metric = {obs.metric: obs for obs in be_observations}
    actual_by_metric = {obs.metric: obs for obs in latest_actuals}

    for metric_id in be_by_metric.keys():
        if metric_id in actual_by_metric:
            be_obs = be_by_metric[metric_id]
            actual_obs = actual_by_metric[metric_id]

            exec_rate = validate_execution_rate(be_obs, actual_obs)

            derived = DerivedMetric(
                metric=f"{metric_id}_execution_rate",
                formula=exec_rate["formula"],
                inputs=[be_obs.id or "", actual_obs.id or ""],
                value=exec_rate["execution_rate"],
                unit="percentage",
                description=f"Execution rate for {metric_id} as of June 2026",
            )

            derived_metrics.append(derived)

    print(f"  ✓ Calculated {len(derived_metrics)} execution rates")
    print()

    # Step 5: Generate output
    print("Step 5: Generating application-ready datasets...")

    output_dir = Path("datasets/processed/union")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Budget summary dataset
    budget_summary = {
        "financialYear": "2026-27",
        "asOfDate": date.today().isoformat(),
        "observations": [obs.to_dict() for obs in all_observations],
        "derivedMetrics": [dm.to_dict() for dm in derived_metrics],
        "metadata": {
            "generated": date.today().isoformat(),
            "totalObservations": len(all_observations),
            "sources": ["Union Budget 2026-27 BE", "CGA Apr-Jun 2026"],
            "latestPeriod": "apr-jun",
            "dataStatus": "Real data from official government sources",
        },
    }

    output_file = output_dir / "budget-summary-2026-27.json"
    with open(output_file, "w") as f:
        json.dump(budget_summary, f, indent=2)

    print(f"  ✓ Written: {output_file}")

    # Source manifest
    metadata_dir = Path("datasets/metadata")
    metadata_dir.mkdir(parents=True, exist_ok=True)

    sources = [
        create_source_manifest(
            source_id="union-budget-2026-27-be",
            organization="Ministry of Finance, Government of India",
            document_name="Union Budget 2026-27 - Budget at a Glance",
            url="https://www.indiabudget.gov.in/",
            financial_year="2026-27",
            estimate_type="BE",
            source_format="pdf",
            parser_used="pipeline.parsers.budget_parser",
            metrics=list(be_by_metric.keys()),
            publication_date="2026-02-01",
            notes="Budget Estimates as presented to Parliament",
        ),
        create_source_manifest(
            source_id="cga-2026-27-apr-jun",
            organization="Controller General of Accounts",
            document_name="Accounts at a Glance - Apr-Jun 2026",
            url="https://cga.nic.in/",
            financial_year="2026-27",
            reporting_period="apr-jun",
            estimate_type="provisional",
            source_format="pdf",
            parser_used="pipeline.parsers.cga_parser",
            metrics=list(actual_by_metric.keys()),
            publication_date="2026-07-31",
            notes="Provisional actuals, cumulative YTD. Subject to CAG audit.",
        ),
    ]

    sources_file = metadata_dir / "sources.json"
    with open(sources_file, "w") as f:
        json.dump(sources, f, indent=2)

    print(f"  ✓ Written: {sources_file}")
    print()

    # Step 6: Summary
    print("=" * 60)
    print("INGESTION COMPLETE")
    print("=" * 60)
    print()
    print("Summary:")
    print(f"  Financial Year: 2026-27")
    print(f"  Latest Period: June 2026")
    print(f"  Metrics Ingested: {len(be_by_metric)}")
    print(f"  Total Observations: {len(all_observations)}")
    print(f"  Derived Metrics: {len(derived_metrics)}")
    print(f"  Validation: {'✓ PASS' if validation_results['invalid'] == 0 else '✗ FAIL'}")
    print()
    print("Output:")
    print(f"  {output_file}")
    print(f"  {sources_file}")
    print()
    print("Data Sources:")
    print("  - Union Budget 2026-27: indiabudget.gov.in")
    print("  - CGA Monthly Accounts: cga.nic.in")
    print("  - Raw data preserved in: datasets/raw/")
    print()

    return True


if __name__ == "__main__":
    success = run_ingestion()
    exit(0 if success else 1)
