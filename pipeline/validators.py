"""
Data validation utilities
"""

from typing import Any
from pipeline.models import FinancialObservation, validate_observation


class ValidationError(Exception):
    """Raised when validation fails"""
    pass


def validate_observations(observations: list[FinancialObservation]) -> dict[str, Any]:
    """
    Validate a list of financial observations.

    Returns:
        Dictionary with validation results
    """
    results = {
        "total": len(observations),
        "valid": 0,
        "invalid": 0,
        "errors": [],
        "warnings": [],
    }

    seen_ids = set()

    for i, obs in enumerate(observations):
        # Validate individual observation
        errors = validate_observation(obs)

        if errors:
            results["invalid"] += 1
            results["errors"].append({
                "index": i,
                "observation": obs.to_dict(),
                "errors": errors,
            })
        else:
            results["valid"] += 1

        # Check for duplicate IDs
        if obs.id in seen_ids:
            results["warnings"].append({
                "type": "duplicate_id",
                "id": obs.id,
                "message": f"Duplicate observation ID: {obs.id}",
            })
        seen_ids.add(obs.id)

    return results


def validate_reconciliation(
    observations: list[FinancialObservation],
    expected_total_metric: str,
    component_metrics: list[str],
) -> dict[str, Any]:
    """
    Validate that component observations sum to expected total.

    Example:
        validate_reconciliation(
            observations,
            "total_receipts",
            ["revenue_receipts", "non_debt_capital_receipts"]
        )
    """
    results = {
        "reconciles": False,
        "expected_total": None,
        "calculated_total": None,
        "difference": None,
        "components": {},
    }

    # Group by FY, period, estimate_type
    grouped: dict[tuple, dict[str, float]] = {}

    for obs in observations:
        key = (obs.financial_year, obs.period, obs.estimate_type)

        if key not in grouped:
            grouped[key] = {}

        grouped[key][obs.metric] = obs.amount

    # Check reconciliation for each group
    reconciliation_checks = []

    for key, metrics in grouped.items():
        if expected_total_metric not in metrics:
            continue

        expected = metrics[expected_total_metric]

        # Calculate sum of components
        calculated = sum(metrics.get(m, 0) for m in component_metrics)

        difference = abs(expected - calculated)
        tolerance = expected * 0.01  # 1% tolerance for rounding

        reconciles = difference <= tolerance

        reconciliation_checks.append({
            "key": key,
            "expected": expected,
            "calculated": calculated,
            "difference": difference,
            "reconciles": reconciles,
            "components": {m: metrics.get(m, 0) for m in component_metrics},
        })

    results["checks"] = reconciliation_checks
    results["all_reconcile"] = all(c["reconciles"] for c in reconciliation_checks)

    return results


def validate_execution_rate(
    budget_estimate: FinancialObservation,
    actual_ytd: FinancialObservation,
) -> dict[str, Any]:
    """
    Validate execution rate calculation
    """
    if budget_estimate.estimate_type != "BE":
        raise ValidationError("First observation must be Budget Estimate")

    if actual_ytd.estimate_type not in ["actual", "provisional"]:
        raise ValidationError("Second observation must be actual or provisional")

    if budget_estimate.metric != actual_ytd.metric:
        raise ValidationError("Metrics must match for execution rate calculation")

    execution_rate = (actual_ytd.amount / budget_estimate.amount * 100) if budget_estimate.amount > 0 else 0

    return {
        "metric": budget_estimate.metric,
        "budget_estimate": budget_estimate.amount,
        "actual_ytd": actual_ytd.amount,
        "execution_rate": execution_rate,
        "formula": "actual_ytd / budget_estimate × 100",
    }
