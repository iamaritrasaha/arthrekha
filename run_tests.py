#!/usr/bin/env python3
"""
Simple test runner - runs all pipeline tests
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("=" * 60)
print("ARTHREKHA PIPELINE TESTS")
print("=" * 60)
print()

# Run model tests
print("Running model tests...")
try:
    from pipeline.tests import test_models
    test_models.test_financial_observation_creation()
    print("  ✓ test_financial_observation_creation")

    test_models.test_observation_validation_valid()
    print("  ✓ test_observation_validation_valid")

    test_models.test_observation_validation_missing_source()
    print("  ✓ test_observation_validation_missing_source")

    test_models.test_observation_validation_invalid_unit()
    print("  ✓ test_observation_validation_invalid_unit")

    test_models.test_observation_to_dict()
    print("  ✓ test_observation_to_dict")
    print()
except Exception as e:
    print(f"  ✗ Model tests failed: {e}")
    sys.exit(1)

# Run parser tests
print("Running parser tests...")
try:
    from pipeline.tests import test_parsers
    test_parsers.test_budget_parser()
    print("  ✓ test_budget_parser")

    test_parsers.test_cga_parser()
    print("  ✓ test_cga_parser")

    test_parsers.test_parser_validates_metric_ids()
    print("  ✓ test_parser_validates_metric_ids")
    print()
except Exception as e:
    print(f"  ✗ Parser tests failed: {e}")
    sys.exit(1)

print("=" * 60)
print("ALL TESTS PASSED")
print("=" * 60)
