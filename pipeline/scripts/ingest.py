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
    validate_deficit_identities,
    validate_execution_rate,
)
from pipeline.models import DerivedMetric
from pipeline.source_manifest import create_source_manifest


FISCAL_MONTH_ORDER = {
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
    "jan": 13,
    "feb": 14,
    "mar": 15,
}


def period_end_month(period: str | None) -> int:
    if not period:
        return 0
    return FISCAL_MONTH_ORDER.get(period.split("-")[-1], 0)


def period_display(period: str) -> str:
    month = period.split("-")[-1]
    return {
        "apr": "April",
        "may": "May",
        "jun": "June",
        "jul": "July",
        "aug": "August",
        "sep": "September",
        "oct": "October",
        "nov": "November",
        "dec": "December",
        "jan": "January",
        "feb": "February",
        "mar": "March",
    }.get(month, period)


def run_ingestion():
    """
    Main ingestion pipeline
    """
    print("=" * 60)
    print("ARTHREKHA DATA INGESTION PIPELINE")
    print("=" * 60)
    print()

    # Step 1: Load all sources
    print(f"Step 1: Loading all sources for FY {FINANCIAL_YEAR}...")
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

    # Non-borrowed receipts should equal revenue + non-debt capital receipts.
    receipts_reconciliation = validate_reconciliation(
        all_observations,
        "non_borrowed_receipts",
        ["revenue_receipts", "non_debt_capital_receipts"],
    )

    if receipts_reconciliation["all_reconcile"]:
        print("  ✓ Non-borrowed receipts reconcile")
    else:
        print("  ✗ Non-borrowed receipts reconciliation failed")
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

    # Budget total receipts include both revenue and capital receipts.
    total_receipts_reconciliation = validate_reconciliation(
        all_observations,
        "total_receipts",
        ["revenue_receipts", "capital_receipts"],
    )
    if total_receipts_reconciliation["all_reconcile"]:
        print("  ✓ Total receipts including borrowing reconcile")
    else:
        print("  ✗ Total receipts including borrowing reconciliation failed")

    # Deficit accounting identities (Fiscal, Revenue, Effective Revenue, Primary Deficit)
    deficit_reconciliation = validate_deficit_identities(all_observations)
    if deficit_reconciliation["all_reconcile"]:
        print("  ✓ Deficit accounting identities reconcile")
    else:
        print("  ✗ Deficit accounting identities reconciliation failed")
        for check in deficit_reconciliation["checks"]:
            if not check["reconciles"]:
                print(f"    {check['group']}: {check['identity']} - Expected: {check['expected']}, Got: {check['calculated']}")

    if not (
        receipts_reconciliation["all_reconcile"]
        and revenue_reconciliation["all_reconcile"]
        and expenditure_reconciliation["all_reconcile"]
        and total_receipts_reconciliation["all_reconcile"]
        and deficit_reconciliation["all_reconcile"]
    ):
        print("\n  ⚠ Reconciliation checks failed")
        return False

    print()

    # Step 4: Calculate derived metrics (execution rates)
    print("Step 4: Calculating execution rates...")
    derived_metrics = []

    # Separate BE and latest actual observations
    be_observations = [obs for obs in all_observations if obs.estimate_type == "BE"]
    actual_observations = [obs for obs in all_observations if obs.estimate_type == "provisional"]

    latest_period = max(
        (obs.period for obs in actual_observations if obs.period),
        key=period_end_month,
        default=None,
    )
    if latest_period is None:
        print("  ✗ No provisional actual period is available")
        return False
    latest_actuals = [obs for obs in actual_observations if obs.period == latest_period]

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
                description=f"Execution rate for {metric_id} as of {period_display(latest_period)} 2026",
            )

            derived_metrics.append(derived)

    ratio_specs = [
        ("fiscal_deficit_gdp_ratio", "fiscal_deficit", "nominal_gdp", "Fiscal deficit ÷ nominal GDP × 100"),
        ("revenue_deficit_gdp_ratio", "revenue_deficit", "nominal_gdp", "Revenue deficit ÷ nominal GDP × 100"),
        ("effective_revenue_deficit_gdp_ratio", "effective_revenue_deficit", "nominal_gdp", "Effective revenue deficit ÷ nominal GDP × 100"),
        ("primary_deficit_gdp_ratio", "primary_deficit", "nominal_gdp", "Primary deficit ÷ nominal GDP × 100"),
        ("capital_expenditure_share", "capital_expenditure", "total_expenditure", "Capital expenditure ÷ total expenditure × 100"),
        ("effective_capital_expenditure_share", "effective_capital_expenditure", "total_expenditure", "Effective capital expenditure ÷ total expenditure × 100"),
        ("interest_revenue_receipts_ratio", "interest_payments", "revenue_receipts", "Interest payments ÷ revenue receipts × 100"),
    ]

    for ratio_id, numerator_id, denominator_id, formula in ratio_specs:
        numerator = be_by_metric.get(numerator_id)
        denominator = be_by_metric.get(denominator_id)
        if not numerator or not denominator or denominator.amount == 0:
            continue
        derived_metrics.append(DerivedMetric(
            metric=ratio_id,
            formula=formula,
            inputs=[numerator.id or "", denominator.id or ""],
            value=numerator.amount / denominator.amount * 100,
            unit="percentage",
            description=f"Arthrekha-derived ratio for {numerator_id} using compatible FY {FINANCIAL_YEAR} Budget Estimate inputs",
        ))

    print(f"  ✓ Calculated {len(derived_metrics)} execution rates and analytical ratios")
    print()

    # Step 5: Generate output
    print("Step 5: Generating application-ready datasets...")

    output_dir = Path("datasets/processed/union")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Discover and manifest each loaded CGA reporting period
    cga_files = sorted(
        Path("datasets/raw").glob(f"cga_{FINANCIAL_YEAR}_*.json"),
        key=lambda path: {"apr": 0, "may": 1, "jun": 2, "jul": 3, "aug": 4, "sep": 5,
                          "oct": 6, "nov": 7, "dec": 8, "jan": 9, "feb": 10, "mar": 11}.get(
                              path.stem.rsplit("_", 1)[-1], 99
                          ),
    )

    sources = [
        create_source_manifest(
            source_id=f"union-budget-{FINANCIAL_YEAR}-be",
            organization="Ministry of Finance, Government of India",
            document_name=f"Union Budget {FINANCIAL_YEAR} - Budget at a Glance",
            url="https://www.indiabudget.gov.in/doc/Budget_at_Glance/budget_at_a_glance.pdf",
            financial_year=FINANCIAL_YEAR,
            estimate_type="BE",
            source_format="pdf",
            parser_used="pipeline.parsers.json_parser",
            metrics=list(be_by_metric.keys()),
            publication_date="2026-02-01",
            raw_file_path=f"datasets/raw/union_budget_{FINANCIAL_YEAR}_budget_at_a_glance.pdf",
            notes="Budget Estimates transcribed from the official Budget at a Glance PDF; page and table references are retained on each observation",
        ),
    ]

    for cga_file in cga_files:
        try:
            with open(cga_file, "r") as cf:
                cga_data = json.load(cf)
        except Exception:
            continue
        cga_src = cga_data.get("source", {})
        reporting_period = cga_data.get("reporting_period", cga_file.stem.rsplit("_", 1)[-1])
        cga_metrics = list(cga_data.get("data", {}).keys())
        sources.append(
            create_source_manifest(
                source_id=f"cga-{FINANCIAL_YEAR}-{reporting_period}",
                organization=cga_src.get("organization", "Controller General of Accounts, Government of India"),
                document_name=cga_src.get("document", f"Union Government Accounts at a Glance - {reporting_period}"),
                url=cga_src.get("url", "https://cga.nic.in/"),
                financial_year=FINANCIAL_YEAR,
                reporting_period=reporting_period,
                estimate_type="provisional",
                source_format="html",
                parser_used="pipeline.parsers.json_parser",
                metrics=cga_metrics,
                publication_date=cga_src.get("publication_date"),
                raw_file_path=f"datasets/raw/{cga_file.name}",
                notes="Provisional actuals, cumulative YTD. Subject to CAG audit.",
            )
        )

    # Budget summary dataset
    budget_summary = {
        "financialYear": FINANCIAL_YEAR,
        "asOfDate": date.today().isoformat(),
        "observations": [obs.to_dict() for obs in all_observations],
        "derivedMetrics": [dm.to_dict() for dm in derived_metrics],
        "metadata": {
            "generated": date.today().isoformat(),
            "totalObservations": len(all_observations),
            "sources": [f"Union Budget {FINANCIAL_YEAR} BE"] + [
                f"CGA {s['reporting_period']}" for s in sources if s.get("estimate_type") == "provisional"
            ],
            "latestPeriod": latest_period,
            "dataStatus": "Real data from official government sources",
        },
    }

    output_file = output_dir / f"budget-summary-{FINANCIAL_YEAR}.json"
    with open(output_file, "w") as f:
        json.dump(budget_summary, f, indent=2)

    print(f"  ✓ Written: {output_file}")

    # Source manifest
    metadata_dir = Path("datasets/metadata")
    metadata_dir.mkdir(parents=True, exist_ok=True)

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
    print(f"  Financial Year: {FINANCIAL_YEAR}")
    print(f"  Latest Period: {period_display(latest_period)} 2026")
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
    print(f"  - Union Budget {FINANCIAL_YEAR}: indiabudget.gov.in")
    print("  - CGA Monthly Accounts: cga.nic.in")
    print("  - Raw data preserved in: datasets/raw/")
    print()

    return True


if __name__ == "__main__":
    success = run_ingestion()
    exit(0 if success else 1)
