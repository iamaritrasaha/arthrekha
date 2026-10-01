"""Acceptance checks for the FY21-22 through FY23-24 historical batch."""

import hashlib
import json
from collections import Counter
from pathlib import Path
from tempfile import TemporaryDirectory

from pipeline.historical_layout import historical_processed_path, historical_source_manifest_path
from pipeline.scripts.ingest_history import ingest


NEW_YEARS = ("2021-22", "2022-23", "2023-24")
UNCHANGED_OUTPUTS = {
    "2024-25": "3c779a8c699656689eda0a51ab6aa3ce6e893805c9be248047de8a0b2eb055a1",
    "2025-26": "b3790e0f8625217c8a78930560e1df09bfe6af606d2c0587f3675dd29da7f87e",
}
CURRENT_FY_SHA256 = "d267b36e9a17dadc9876bb18a20d06fe5fa201542857353f6c0571e8c094747d"


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_new_years_are_indexed_with_exact_annual_states_and_v2_ids():
    index = _read_json(Path("datasets/metadata/historical-index.json"))
    assert [entry["financialYear"] for entry in index["datasets"]] == [
        "2021-22", "2022-23", "2023-24", "2024-25", "2025-26"
    ]
    for financial_year in NEW_YEARS:
        data = _read_json(historical_processed_path(financial_year))
        assert data["financialYear"] == financial_year
        assert Counter(item["estimateType"] for item in data["observations"]) == {
            "BE": 12, "RE": 12, "final_actual": 8
        }
        assert all(item["identityVersion"] == 2 for item in data["observations"])
        assert len({item["id"] for item in data["observations"]}) == 32
        assert data["availableEstimateStates"] == ["BE", "RE", "final_actual"]
        assert data["unavailableEstimateStates"]["provisional"]["status"] == "absent"
        assert all(metric not in {o["metric"] for o in data["observations"] if o["estimateType"] == "final_actual"}
                   for metric in ("fiscal_deficit", "revenue_deficit", "primary_deficit"))
        assert set(data["unavailableMetricStates"]) == {"fiscal_deficit", "revenue_deficit", "primary_deficit"}
        source_reported = [item for item in data["evidenceMappings"] if "sourceLabel" in item]
        assert len(source_reported) == 32
        assert all(item["traceStatus"] == "verified_artifact_to_row_to_transcription_to_observation" for item in source_reported)
        assert all(item["sourceId"] and item["releaseId"] and len(item["sourceHash"]) == 64 for item in source_reported)
        assert all(item["locator"].get("page") and item["sourceWording"] and item["canonicalDefinition"] for item in source_reported)
        assert all(item["sourceReported"] is False for item in data["evidenceMappings"] if "sourceReported" in item)
        assert all(item["formula"] and item["inputObservationIds"] for item in data["evidenceMappings"] if "formula" in item)


def test_batch_sources_hashes_locators_and_reconciliations_fail_closed():
    for financial_year in NEW_YEARS:
        manifest = _read_json(historical_source_manifest_path(financial_year))
        assert len(manifest["sources"]) == 3
        assert {(source["sourceId"], source["releaseId"]) for source in manifest["sources"]} == {
            tuple(key) for key in manifest["requiredSourceReleases"]
        }
        assert manifest["reconciliationToleranceCrore"] == 1
        assert "printed values remain unchanged" in manifest["reconciliationToleranceRationale"]
        for source in manifest["sources"]:
            artifact = Path(source["artifactPath"])
            sidecar = _read_json(Path(source["sidecarPath"]))
            digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
            assert digest == source["sourceHash"] == sidecar["source_hash"]
            transcription = _read_json(Path(source["transcriptionPath"]))
            assert transcription["financialYear"] == financial_year
            assert transcription["sourceHash"] == digest
            date_evidence = source.get("publicationDateEvidence", {})
            if "artifactPath" in date_evidence:
                evidence_path = Path(date_evidence["artifactPath"])
                evidence_sidecar = _read_json(Path(date_evidence["sidecarPath"]))
                evidence_hash = hashlib.sha256(evidence_path.read_bytes()).hexdigest()
                assert evidence_hash == date_evidence["sourceHash"] == evidence_sidecar["source_hash"]
                assert date_evidence["locator"]["kind"] == "budget_speech_release_date"
        with TemporaryDirectory() as directory:
            first, second = Path(directory) / "first.json", Path(directory) / "second.json"
            ingest(financial_year, output_path=first)
            ingest(financial_year, output_path=second)
            assert first.read_bytes() == second.read_bytes()
            assert first.read_bytes() == historical_processed_path(financial_year).read_bytes()
        output = _read_json(historical_processed_path(financial_year))
        assert output["reconciliations"]
        assert all(item["status"] == "passed" for item in output["reconciliations"])


def test_reused_budget_and_cga_publications_keep_one_logical_release_identity():
    fy22 = _read_json(historical_source_manifest_path("2022-23"))
    fy21 = _read_json(historical_source_manifest_path("2021-22"))
    be22 = next(source for source in fy22["sources"] if source["estimateType"] == "BE")
    re21 = next(source for source in fy21["sources"] if source["estimateType"] == "RE")
    final22 = next(source for source in fy22["sources"] if source["estimateType"] == "final_actual")
    final21 = next(source for source in fy21["sources"] if source["estimateType"] == "final_actual")
    assert be22["releaseId"] == re21["releaseId"]
    assert be22["sourceHash"] == re21["sourceHash"]
    assert final22["releaseId"] == final21["releaseId"]
    assert final22["sourceHash"] == final21["sourceHash"]
    assert final21["artifactFinancialYear"] == "2022-23"
    assert final21["transcriptionPath"] != final22["transcriptionPath"]


def test_finance_accounts_comparative_column_locator_is_checked_not_just_row_amount():
    manifest = _read_json(historical_source_manifest_path("2021-22"))
    actual = next(source for source in manifest["sources"] if source["estimateType"] == "final_actual")
    transcription = _read_json(Path(actual["transcriptionPath"]))
    tax = next(item for item in transcription["observations"] if item["metric"] == "tax_revenue_net")
    assert tax["locator"]["columnIndex"] == 1
    tax["locator"]["columnIndex"] = 0
    with TemporaryDirectory() as directory:
        root = Path(directory)
        transcription_path = root / "wrong-column.json"
        transcription_path.write_text(json.dumps(transcription), encoding="utf-8")
        actual["transcriptionPath"] = str(transcription_path)
        manifest_path = root / "manifest.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        try:
            ingest("2021-22", manifest_path=manifest_path, output_path=root / "out.json")
        except ValueError as error:
            assert "Finance Accounts row/value verification failed" in str(error)
        else:
            raise AssertionError("a wrong comparative-year column must be rejected")


def test_older_outputs_and_current_production_dataset_are_byte_unchanged():
    for financial_year, expected_hash in UNCHANGED_OUTPUTS.items():
        assert hashlib.sha256(historical_processed_path(financial_year).read_bytes()).hexdigest() == expected_hash
    current = Path("datasets/processed/union/budget-summary-2026-27.json")
    assert hashlib.sha256(current.read_bytes()).hexdigest() == CURRENT_FY_SHA256
    baseline = _read_json(current)
    assert all("identityVersion" not in observation for observation in baseline["observations"])
