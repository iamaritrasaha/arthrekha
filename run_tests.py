#!/usr/bin/env python3
"""
Test runner - automatically discovers and runs all pipeline tests in pipeline/tests/
"""
import importlib
import inspect
from pathlib import Path
import sys

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))


def main():
    print("=" * 60)
    print("ARTHREKHA PIPELINE TEST SUITE")
    print("=" * 60)
    print()

    tests_dir = PROJECT_ROOT / "pipeline" / "tests"
    test_files = sorted(tests_dir.glob("test_*.py"))

    total_tests = 0
    passed_tests = 0
    failed_tests = []

    for test_file in test_files:
        module_name = f"pipeline.tests.{test_file.stem}"
        try:
            mod = importlib.import_module(module_name)
        except Exception as e:
            print(f"✗ Failed to import {module_name}: {e}")
            failed_tests.append((module_name, "import", str(e)))
            continue

        # Get all test functions defined in this module
        test_funcs = [
            (name, func)
            for name, func in inspect.getmembers(mod, inspect.isfunction)
            if name.startswith("test_") and func.__module__ == module_name
        ]

        if not test_funcs:
            continue

        print(f"[{test_file.stem}]")
        for name, func in test_funcs:
            total_tests += 1
            try:
                func()
                print(f"  ✓ {name}")
                passed_tests += 1
            except Exception as e:
                print(f"  ✗ {name}: {e}")
                failed_tests.append((module_name, name, str(e)))
        print()

    print("=" * 60)
    if failed_tests:
        print(f"FAILED: {len(failed_tests)}/{total_tests} tests failed.")
        for mod, name, err in failed_tests:
            print(f"  - {mod}.{name}: {err}")
        print("=" * 60)
        sys.exit(1)
    else:
        print(f"ALL {total_tests} TESTS PASSED SUCCESSFULLY")
        print("=" * 60)
        sys.exit(0)


if __name__ == "__main__":
    main()
