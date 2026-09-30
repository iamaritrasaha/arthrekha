import os
import pytest

@pytest.fixture(scope='session')
def financial_year():
    return os.environ.get('FINANCIAL_YEAR', '2026-27')
