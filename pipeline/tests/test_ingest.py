import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

from pipeline.scripts.ingest import period_display


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def test_ingestion_entrypoint_resolves_financial_year_from_environment():
    with tempfile.TemporaryDirectory() as temp_dir:
        working_dir = Path(temp_dir)
        shutil.copytree(PROJECT_ROOT / "datasets/raw", working_dir / "datasets/raw")
        environment = os.environ.copy()
        environment["FINANCIAL_YEAR"] = "2026-27"
        environment["PYTHONPATH"] = str(PROJECT_ROOT)

        result = subprocess.run(
            [sys.executable, "-m", "pipeline.scripts.ingest"],
            cwd=working_dir,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )

        assert result.returncode == 0, result.stdout + result.stderr
        assert "Financial Year: 2026-27" in result.stdout
        output = working_dir / "datasets/processed/union/budget-summary-2026-27.json"
        assert output.exists()
        assert json.loads(output.read_text())["metadata"]["latestPeriod"] == "apr-jul"
        manifest = json.loads((working_dir / "datasets/metadata/sources.json").read_text())
        budget = next(item for item in manifest if item["estimate_type"] == "BE")
        assert budget["publication_date"] == "2026-02-01"


def test_period_display_uses_fy_end_calendar_year_for_january_to_march():
    assert period_display("apr-jul", "2026-27") == "July 2026"
    assert period_display("apr-jan", "2026-27") == "January 2027"
    assert period_display("apr-mar", "2026-27") == "March 2027"
