"""FY-explicit, source-first historical ingestion acceptance tests."""

import copy
import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory

import pytest

from pipeline.historical_layout import historical_processed_path, historical_source_manifest_path
from pipeline.scripts.ingest_history import ingest


def _manifest() -> dict:
    return json.loads(historical_source_manifest_path("2025-26").read_text(encoding="utf-8"))


def _dataset() -> dict:
    return json.loads(historical_processed_path("2025-26").read_text(encoding="utf-8"))


def test_fy_2025_26_has_three_separate_states_and_no_final_actual():
    data = _dataset()
    assert data["financialYear"] == "2025-26"
    assert len(data["observations"]) == 36
    counts = {state: sum(o["estimateType"] == state for o in data["observations"]) for state in ("BE", "RE", "provisional", "final_actual")}
    assert counts == {"BE": 12, "RE": 12, "provisional": 12, "final_actual": 0}
    assert data["availableEstimateStates"] == ["BE", "RE", "provisional"]
    assert data["unavailableEstimateStates"]["final_actual"]["status"] == "absent"
    assert "final_actual" not in {o["estimateType"] for o in data["observations"]}
    assert {o["source"]["releaseId"] for o in data["observations"] if o["estimateType"] == "BE"}.isdisjoint(
        {o["source"]["releaseId"] for o in data["observations"] if o["estimateType"] == "RE"}
    )
    assert all(o["source"]["dataStatus"] == "provisional" for o in data["observations"] if o["estimateType"] == "provisional")


def test_historical_records_are_v2_with_source_release_hash_and_exact_locators():
    data = _dataset()
    source_mappings = [m for m in data["evidenceMappings"] if "sourceLabel" in m]
    assert len(source_mappings) == 36
    assert all(m["traceStatus"] == "verified_artifact_to_row_to_transcription_to_observation" for m in source_mappings)
    assert all(m["sourceId"] and m["releaseId"] and len(m["sourceHash"]) == 64 for m in source_mappings)
    assert all(m["canonicalDefinition"] and m["definitionVersion"] == "1" for m in source_mappings)
    assert all(m["sourceWording"] == m["sourceLabel"] for m in source_mappings)
    for observation in data["observations"]:
        assert observation["identityVersion"] == 2
        source = observation["source"]
        assert source["sourceId"] and source["releaseId"]
        assert len(source["sourceHash"]) == 64
        assert source["page"] or source["row"]
        assert source["definition"]
        assert observation["canonicalDefinition"]
        assert observation["definitionVersion"] == "1"
        assert observation["comparisonEligibility"]["status"] in {"comparable", "comparable_with_note", "not_comparable"}


def test_derived_metrics_keep_each_states_inputs_formula_and_are_not_source_reported():
    data = _dataset()
    ids = {o["id"] for o in data["observations"]}
    assert len(data["derivedMetrics"]) == 6
    assert {(m["metric"], m["estimateType"]) for m in data["derivedMetrics"]} == {
        (metric, state)
        for metric in ("non_debt_capital_receipts", "non_borrowed_receipts")
        for state in ("BE", "RE", "provisional")
    }
    assert all(m["inputs"] and set(m["inputs"]) <= ids and m["formula"] for m in data["derivedMetrics"])
    assert all(m["sourceReported"] is False for m in data["evidenceMappings"] if "sourceReported" in m)


def test_source_hashes_and_manifest_artifacts_are_verified():
    for source in _manifest()["sources"]:
        artifact = Path(source["artifactPath"])
        sidecar = json.loads(Path(source["sidecarPath"]).read_text(encoding="utf-8"))
        digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
        assert digest == source["sourceHash"] == sidecar["source_hash"]
    assert all(record["status"] == "passed" for record in _dataset()["reconciliations"])


def test_historical_ingestion_is_byte_reproducible_and_requires_explicit_fy():
    with TemporaryDirectory() as temp_dir:
        tmp_path = Path(temp_dir)
        one = tmp_path / "one.json"
        two = tmp_path / "two.json"
        first = ingest("2025-26", output_path=one)
        second = ingest("2025-26", output_path=two)
        assert one.read_bytes() == two.read_bytes()
        assert first["observations"] == second["observations"]
        with pytest.raises(ValueError, match="does not match requested FY"):
            ingest("2024-25", manifest_path=historical_source_manifest_path("2025-26"), output_path=tmp_path / "wrong-year.json")


def test_missing_declared_sources_and_source_hash_mismatch_fail_closed():
    with TemporaryDirectory() as temp_dir:
        tmp_path = Path(temp_dir)
        manifest = _manifest()
        manifest["sources"][0]["sourceHash"] = "0" * 64
        manifest_path = tmp_path / "bad-hash.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with pytest.raises(ValueError, match="source hash mismatch"):
            ingest("2025-26", manifest_path=manifest_path, output_path=tmp_path / "out.json")

        manifest = _manifest()
        manifest["sources"][0]["artifactPath"] = str(tmp_path / "missing.pdf")
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with pytest.raises(ValueError, match="missing declared source artifact"):
            ingest("2025-26", manifest_path=manifest_path, output_path=tmp_path / "out.json")

        manifest = _manifest()
        manifest["sources"].pop()
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with pytest.raises(ValueError, match="do not match required packet"):
            ingest("2025-26", manifest_path=manifest_path, output_path=tmp_path / "out.json")


def test_duplicate_release_qualified_observation_keys_fail_closed():
    with TemporaryDirectory() as temp_dir:
        tmp_path = Path(temp_dir)
        manifest = _manifest()
        source = next(s for s in manifest["sources"] if s.get("transcriptionPath"))
        transcription = json.loads(Path(source["transcriptionPath"]).read_text(encoding="utf-8"))
        transcription["observations"].append(copy.deepcopy(transcription["observations"][0]))
        transcription_path = tmp_path / "duplicate.json"
        transcription_path.write_text(json.dumps(transcription), encoding="utf-8")
        source["transcriptionPath"] = str(transcription_path)
        manifest_path = tmp_path / "manifest.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        with pytest.raises(ValueError, match="duplicate release-qualified observation key"):
            ingest("2025-26", manifest_path=manifest_path, output_path=tmp_path / "out.json")


def test_identity_v1_production_ids_are_untouched():
    # Phase 1's regression reconstructs all committed current-year IDs and
    # derived references. Confirm the dataset itself retains those same IDs.
    baseline = json.loads(Path("datasets/processed/union/budget-summary-2026-27.json").read_text(encoding="utf-8"))
    assert all("identityVersion" not in o for o in baseline["observations"])
    assert len({o["id"] for o in baseline["observations"]}) == len(baseline["observations"])


def test_fy_2024_25_keeps_interim_and_full_budget_be_releases_distinct():
    data = json.loads(historical_processed_path("2024-25").read_text(encoding="utf-8"))
    observations = data["observations"]
    be = [o for o in observations if o["estimateType"] == "BE"]
    assert len(be) == 24
    assert {o["source"]["releaseId"] for o in be} == {
        "union-interim-budget-2024-25-be-2024-02-01",
        "union-full-budget-2024-25-be-2024-07-23",
    }
    for metric in ("revenue_receipts", "fiscal_deficit", "total_expenditure"):
        assert len([o for o in be if o["metric"] == metric]) == 2
        assert len({o["id"] for o in be if o["metric"] == metric}) == 2
    assert sum(o["estimateType"] == "RE" for o in observations) == 12
    assert sum(o["estimateType"] == "final_actual" for o in observations) == 9
    assert not any(o["estimateType"] == "provisional" for o in observations)
    assert all(o["identityVersion"] == 2 for o in observations)
    assert data["unavailableMetricStates"]["fiscal_deficit"]["status"] == "absent"
    assert data["unavailableMetricStates"]["primary_deficit"]["status"] == "absent"
    defaults = [release["releaseId"] for release in data["releaseCatalog"] if release["defaultComparisonRelease"]]
    assert defaults == ["union-full-budget-2024-25-be-2024-07-23"]


def test_fy_2024_25_final_source_to_output_trace_and_accounting_checks():
    data = json.loads(historical_processed_path("2024-25").read_text(encoding="utf-8"))
    mappings = [item for item in data["evidenceMappings"] if "sourceLabel" in item]
    assert len(mappings) == 45
    assert all(item["traceStatus"] == "verified_artifact_to_row_to_transcription_to_observation" for item in mappings)
    assert all(item["sourceId"] and item["releaseId"] and len(item["sourceHash"]) == 64 for item in mappings)
    assert all(item["locator"].get("page") and item["sourceWording"] for item in mappings)
    assert all(record["status"] == "passed" for record in data["reconciliations"])
    grant_support = data["supportingEvidenceMappings"][0]
    assert grant_support["amount"] == 686.66
    assert grant_support["traceStatus"] == "verified_artifact_to_row_value_supporting_reconciliation"
    total_exp = next(item for item in data["derivedMetrics"] if item["metric"] == "total_expenditure" and item["estimateType"] == "final_actual")
    assert total_exp["formula"] == "revenue_expenditure + capital_expenditure"
    assert total_exp["inputs"] and total_exp["value"] == 4_845_629.72
    assert not any(item["sourceReported"] for item in data["evidenceMappings"] if item.get("metric") == "total_expenditure" and item.get("estimateType") == "final_actual")


def test_fy_2024_25_reuses_the_existing_fy_2025_26_re_release_without_duplicate_capture():
    manifest = json.loads(historical_source_manifest_path("2024-25").read_text(encoding="utf-8"))
    re_source = next(source for source in manifest["sources"] if source["estimateType"] == "RE")
    assert re_source["artifactFinancialYear"] == "2025-26"
    assert re_source["artifactPath"].startswith("datasets/raw/union/2025-26/")
    fy25_manifest = _manifest()
    fy25_source = next(source for source in fy25_manifest["sources"] if source["releaseId"] == re_source["releaseId"])
    assert re_source["sourceId"] == fy25_source["sourceId"]
    assert re_source["sourceHash"] == fy25_source["sourceHash"]


def test_all_fy_2024_25_packet_artifacts_match_hash_sidecars_and_declared_release_ids():
    manifest = json.loads(historical_source_manifest_path("2024-25").read_text(encoding="utf-8"))
    declared = {(source["sourceId"], source["releaseId"]) for source in manifest["sources"]}
    assert declared == {tuple(item) for item in manifest["requiredSourceReleases"]}
    assert len(declared) == len(manifest["sources"])
    for source in manifest["sources"]:
        artifact = Path(source["artifactPath"])
        sidecar = json.loads(Path(source["sidecarPath"]).read_text(encoding="utf-8"))
        digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
        assert digest == source["sourceHash"] == sidecar["source_hash"]
        assert sidecar["source_id"] == source["sourceId"]
        assert sidecar["release_id"] == source["releaseId"]


def test_both_historical_years_are_reproducible_and_fy_2025_26_output_is_unchanged():
    original_fy25 = historical_processed_path("2025-26").read_bytes()
    assert hashlib.sha256(original_fy25).hexdigest() == "b3790e0f8625217c8a78930560e1df09bfe6af606d2c0587f3675dd29da7f87e"
    with TemporaryDirectory() as temp_dir:
        for financial_year in ("2024-25", "2025-26"):
            path_a = Path(temp_dir) / f"{financial_year}-a.json"
            path_b = Path(temp_dir) / f"{financial_year}-b.json"
            ingest(financial_year, output_path=path_a)
            ingest(financial_year, output_path=path_b)
            assert path_a.read_bytes() == path_b.read_bytes()
    assert historical_processed_path("2025-26").read_bytes() == original_fy25
