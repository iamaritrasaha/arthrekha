"""Reproducibly normalize one explicitly selected historical Union FY.

This path is intentionally independent of active_financial_year() and the
current CGA refresh workflow. It consumes a committed per-FY source manifest
and its hash-addressed source packet only.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from pipeline.historical_layout import (
    historical_processed_path,
    historical_source_artifact_path,
    historical_source_manifest_path,
)
from pipeline.metrics import METRICS
from pipeline.models import DataSource, DerivedMetric, FinancialObservation, validate_observation
from pipeline.source_verifier import extract_pdf_page_layout


class TableRows(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.rows: list[list[str]] = []
        self.row: list[str] | None = None
        self.cell: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "tr":
            self.row = []
        elif tag.lower() in {"td", "th"} and self.row is not None:
            self.cell = []

    def handle_data(self, data: str) -> None:
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"td", "th"} and self.cell is not None:
            self.row.append(" ".join(" ".join(self.cell).split()))
            self.cell = None
        elif tag.lower() == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _clean_amount(value: str) -> str:
    return re.sub(r"[^0-9]", "", value)


def _verify_locator(source: dict[str, Any], mapping: dict[str, Any]) -> None:
    artifact = Path(source["artifactPath"])
    locator = mapping["locator"]
    if source["format"] == "pdf":
        page = int(locator["page"])
        text = extract_pdf_page_layout(artifact, page)
        if item_unit := mapping.get("unit"):
            if item_unit == "crore" and "crore" not in text.lower():
                raise ValueError(f"PDF unit declaration not found: {mapping['metric']} {locator}")
        if locator.get("kind") == "finance_accounts_statement1":
            label_tokens = [token for token in re.findall(r"[a-z]+", mapping["sourceLabel"].lower()) if len(token) > 2]
            value = f"{float(mapping['amount']):.2f}"
            lines = text.splitlines()
            matched = False
            for index in range(len(lines)):
                row_window = " ".join(lines[index:index + 5])
                flat_window = re.sub(r"\s+", " ", row_window).lower()
                if all(token in flat_window for token in label_tokens) and value in re.sub(r"[ ,]", "", row_window):
                    matched = True
                    break
            if not matched:
                raise ValueError(f"Finance Accounts row/value verification failed: {mapping['metric']} {locator}")
            return
        flat = re.sub(r"\s+", " ", text).lower()
        label_tokens = [token for token in re.findall(r"[a-z]+", mapping["sourceLabel"].lower()) if len(token) > 1]
        row_marker = f'{locator["row"]}.'
        lines = text.splitlines()
        row_indices = [i for i, line in enumerate(lines) if re.search(rf"^\s*{re.escape(str(locator['row']))}\.", line)]
        if not row_indices:
            raise ValueError(f"PDF row locator not found: {mapping['metric']} {locator}")
        row_text = " ".join(lines[row_indices[0]:row_indices[0] + 4]).lower()
        row_flat = re.sub(r"\s+", " ", row_text)
        row_amounts = [int(token.replace(",", "")) for token in re.findall(r"\d[\d,]{4,}", row_text)]
        # Budget at a Glance lists four adjacent fiscal-year values: the final
        # column is 2025-26 BE in the original document, and the third is
        # 2025-26 RE in the later Budget document.
        expected_column = int(locator.get("columnIndex", 3 if source["estimateType"] == "BE" else 2))
        if (
            not all(token in row_flat for token in label_tokens)
            or len(row_amounts) <= expected_column
            or row_amounts[expected_column] != int(mapping["amount"])
        ):
            raise ValueError(f"PDF row/column/value verification failed: {mapping['metric']} {locator}")
    else:
        parser = TableRows()
        parser.feed(artifact.read_text(encoding="utf-8", errors="replace"))
        row_number = str(locator["row"])
        expected_label = mapping["sourceLabel"].lower()
        matching = [row for row in parser.rows if row and row[0].strip(".") == row_number]
        if not matching:
            raise ValueError(f"HTML row locator not found: {mapping['metric']} {locator}")
        row_text = " ".join(matching[0]).lower()
        if expected_label not in row_text:
            raise ValueError(f"HTML row label mismatch: {mapping['metric']} {locator}")
        # CGA table columns are: row number, label, detail, Revised Estimate,
        # provisional actual, execution %, GDP %. Select the provisional
        # actual column explicitly; never accept the adjacent RE by accident.
        cells = [_clean_amount(cell) for cell in matching[0]]
        if source["estimateType"] != "provisional" or len(cells) < 5 or cells[4] != str(mapping["amount"]):
            raise ValueError(f"HTML row/column amount mismatch: {mapping['metric']} {locator}, expected {mapping['amount']}")


def ingest(financial_year: str, manifest_path: Path | None = None, output_path: Path | None = None) -> dict[str, Any]:
    if financial_year == "2024-25":
        return _ingest_fy_2024_25(manifest_path, output_path)
    manifest_path = manifest_path or historical_source_manifest_path(financial_year)
    output_path = output_path or historical_processed_path(financial_year)
    manifest = _load_json(manifest_path)
    if manifest.get("financialYear") != financial_year:
        raise ValueError(f"manifest FY {manifest.get('financialYear')} does not match requested FY {financial_year}")
    if manifest.get("schemaVersion") != 1:
        raise ValueError("unsupported historical manifest schemaVersion")

    expected_sources = {tuple(item) for item in manifest.get("requiredSourceReleases", [])}
    sources: dict[tuple[str, str], dict[str, Any]] = {}
    for source in manifest.get("sources", []):
        if source["financialYear"] != financial_year:
            raise ValueError(f"wrong FY on source {source['sourceId']}/{source['releaseId']}")
        key = (source["sourceId"], source["releaseId"])
        if key in sources:
            raise ValueError(f"duplicate declared source release: {key}")
        artifact = Path(source["artifactPath"])
        sidecar_path = artifact.parent / "provenance.json"
        if not artifact.is_file() or not sidecar_path.is_file():
            raise ValueError(f"missing declared source artifact or sidecar: {artifact}")
        sidecar = _load_json(sidecar_path)
        digest = _sha256(artifact)
        if digest != source["sourceHash"] or digest != sidecar.get("source_hash"):
            raise ValueError(f"source hash mismatch: {artifact}")
        extension = source["format"]
        expected_artifact = historical_source_artifact_path(
            financial_year, source["sourceId"], source["releaseId"], digest, extension
        )
        if artifact != expected_artifact:
            raise ValueError(f"artifact is outside its declared hash-addressed release path: {artifact}")
        for field, sidecar_field in (("sourceId", "source_id"), ("releaseId", "release_id"), ("url", "original_url")):
            if source[field] != sidecar.get(sidecar_field):
                raise ValueError(f"source sidecar mismatch for {field}: {artifact}")
        if source.get("retrievedAt") != sidecar.get("retrieval_date"):
            raise ValueError(f"source sidecar mismatch for retrieval date: {artifact}")
        sidecar_publication_date = sidecar.get("published_at", sidecar.get("publication_date"))
        if source.get("publishedAt") != sidecar_publication_date:
            raise ValueError(f"source sidecar mismatch for publication date: {artifact}")
        source["_artifact"] = artifact
        sources[key] = source
    if expected_sources and set(sources) != expected_sources:
        raise ValueError(f"declared source releases do not match required packet: {set(sources)} != {expected_sources}")

    transcriptions: list[dict[str, Any]] = []
    for source in sources.values():
        if not source.get("transcriptionPath"):
            continue
        transcription_path = Path(source["transcriptionPath"])
        if not transcription_path.is_file():
            raise ValueError(f"missing declared structured transcription: {transcription_path}")
        transcription = _load_json(transcription_path)
        if transcription.get("financialYear") != financial_year:
            raise ValueError(f"wrong FY in structured transcription: {transcription_path}")
        if transcription.get("sourceId") != source["sourceId"] or transcription.get("releaseId") != source["releaseId"]:
            raise ValueError(f"transcription source/release mismatch: {transcription_path}")
        if transcription.get("sourceHash") != source["sourceHash"]:
            raise ValueError(f"transcription source hash mismatch: {transcription_path}")
        for item in transcription["observations"]:
            item["_source"] = source
            _verify_locator(source, item)
            transcriptions.append(item)

    keys: dict[tuple[str, str, str, str, str], float] = {}
    observations: list[FinancialObservation] = []
    evidence: list[dict[str, Any]] = []
    id_by_metric_state: dict[tuple[str, str], str] = {}
    for item in transcriptions:
        metric = item["metric"]
        source = item["_source"]
        state = item["estimateType"]
        if metric not in METRICS:
            raise ValueError(f"unknown metric id: {metric}")
        if state not in {"BE", "RE", "provisional"}:
            raise ValueError(f"invalid estimate state in proof packet: {state}")
        if item["financialYear"] != financial_year or item["unit"] != "crore" or item["currency"] != "INR":
            raise ValueError(f"wrong FY or unsupported units in {metric}")
        if state != source["estimateType"]:
            raise ValueError(f"estimate state/source mismatch for {metric}")
        if item["comparability"] in {"not_comparable", "comparable_with_note"} and not item.get("rationale"):
            raise ValueError(f"{item['comparability']} requires rationale: {metric} {state}")
        key = (financial_year, state, source["sourceId"], source["releaseId"], metric)
        if key in keys:
            if keys[key] != item["amount"]:
                raise ValueError(f"conflicting values for logical release key {key}")
            raise ValueError(f"duplicate release-qualified observation key {key}")
        keys[key] = float(item["amount"])
        data_source = DataSource(
            organization=source["organization"], document=source["document"], url=source["url"],
            table=item["locator"].get("table"), page=str(item["locator"].get("page", "")) or None,
            row=str(item["locator"].get("row", "")) or None,
            published_at=source.get("publishedAt"), retrieved_at=source["retrievedAt"],
            data_status="provisional" if state == "provisional" else "estimated",
            notes=source.get("notes"), definition=item["sourceWording"], source_id=source["sourceId"],
            release_id=source["releaseId"], source_hash=source["sourceHash"],
        )
        observation = FinancialObservation(
            jurisdiction="india", jurisdiction_type="union", financial_year=financial_year,
            period_type="annual", metric=metric, amount=float(item["amount"]), estimate_type=state,
            source=data_source, definition_id=metric, coverage="Union Government of India",
            classification_type=METRICS[metric]["domain"], parent_metric=METRICS[metric]["parent_metric"],
            canonical_definition=METRICS[metric]["accounting_interpretation"],
            definition_version=METRICS[metric]["definition_version"],
            comparison_eligibility={"status": item["comparability"], **({"rationale": item["rationale"]} if item.get("rationale") else {})},
            identity_version=2,
        )
        errors = validate_observation(observation)
        if errors:
            raise ValueError(f"invalid historical observation {metric}: {errors}")
        observations.append(observation)
        id_by_metric_state[(metric, state)] = observation.id
        evidence.append({
            **{key: value for key, value in item.items() if not key.startswith("_")},
            "sourceId": source["sourceId"], "releaseId": source["releaseId"], "sourceHash": source["sourceHash"],
            "canonicalDefinition": METRICS[metric]["accounting_interpretation"],
            "definitionVersion": METRICS[metric]["definition_version"],
            "traceStatus": "verified_artifact_to_row_to_transcription_to_observation",
        })

    # Core annual-account reconciliations, with source reported rows retained.
    value = {(o.metric, o.estimate_type): o.amount for o in observations}
    reconciliations: list[dict[str, Any]] = []
    for state in ("BE", "RE", "provisional"):
        pairs = [
            ("total_expenditure_equals_components", value["total_expenditure", state], value["revenue_expenditure", state] + value["capital_expenditure", state]),
            ("revenue_deficit_equals_revenue_expenditure_minus_receipts", value["revenue_deficit", state], value["revenue_expenditure", state] - value["revenue_receipts", state]),
            ("fiscal_deficit_equals_expenditure_minus_nonborrowed_receipts", value["fiscal_deficit", state], value["total_expenditure", state] - (value["revenue_receipts", state] + value["recovery_of_loans", state] + value["other_capital_receipts", state])),
            ("primary_deficit_equals_fiscal_deficit_minus_interest", value["primary_deficit", state], value["fiscal_deficit", state] - value["interest_payments", state]),
            ("revenue_receipts_equals_net_tax_plus_nontax", value["revenue_receipts", state], value["tax_revenue_net", state] + value["non_tax_revenue", state]),
        ]
        for name, reported, calculated in pairs:
            if reported != calculated:
                raise ValueError(f"accounting reconciliation failed: {state} {name}: {reported} != {calculated}")
            reconciliations.append({"estimateType": state, "identity": name, "reported": reported, "calculated": calculated, "status": "passed"})

    derived: list[DerivedMetric] = []
    derived_evidence: list[dict[str, Any]] = []
    for state in ("BE", "RE", "provisional"):
        loans_id = id_by_metric_state["recovery_of_loans", state]
        other_id = id_by_metric_state["other_capital_receipts", state]
        receipts_id = id_by_metric_state["revenue_receipts", state]
        ndc = value["recovery_of_loans", state] + value["other_capital_receipts", state]
        nbr = value["revenue_receipts", state] + ndc
        derived.extend([
            DerivedMetric(metric="non_debt_capital_receipts", formula="recovery_of_loans + other_capital_receipts", inputs=[loans_id, other_id], value=ndc, unit="crore", description="Derived from source-reported components; not source-reported as a single value in this packet.", financial_year=financial_year, estimate_type=state),
            DerivedMetric(metric="non_borrowed_receipts", formula="revenue_receipts + recovery_of_loans + other_capital_receipts", inputs=[receipts_id, loans_id, other_id], value=nbr, unit="crore", description="Derived from source-reported components; Budget 'Total Receipts' includes borrowing and is not used as this metric.", financial_year=financial_year, estimate_type=state),
        ])
        def input_refs(metrics: list[str]) -> list[dict[str, Any]]:
            return [{"metric": metric, "observationId": id_by_metric_state[(metric, state)], "sourceId": next(o.source.source_id for o in observations if o.id == id_by_metric_state[(metric, state)]), "releaseId": next(o.source.release_id for o in observations if o.id == id_by_metric_state[(metric, state)]), "sourceHash": next(o.source.source_hash for o in observations if o.id == id_by_metric_state[(metric, state)])} for metric in metrics]
        derived_evidence.extend([
            {"metric": "non_debt_capital_receipts", "estimateType": state, "amount": ndc, "unit": "crore", "sourceReported": False, "formula": "recovery_of_loans + other_capital_receipts", "inputObservationIds": [loans_id, other_id], "inputEvidence": input_refs(["recovery_of_loans", "other_capital_receipts"]), "comparability": "comparable_with_note", "rationale": "Derived from official component rows; CGA separately reports 83,757 crore non-debt capital receipts, used as a validation cross-check.", "traceStatus": "derived_from_verified_input_observations"},
            {"metric": "non_borrowed_receipts", "estimateType": state, "amount": nbr, "unit": "crore", "sourceReported": False, "formula": "revenue_receipts + recovery_of_loans + other_capital_receipts", "inputObservationIds": [receipts_id, loans_id, other_id], "inputEvidence": input_refs(["revenue_receipts", "recovery_of_loans", "other_capital_receipts"]), "comparability": "comparable_with_note", "rationale": "Derived using the common receipt identity. Budget 'Total Receipts' includes borrowing and is intentionally excluded from this mapping.", "traceStatus": "derived_from_verified_input_observations"},
        ])
    actual_ndc = value["recovery_of_loans", "provisional"] + value["other_capital_receipts", "provisional"]
    actual_nbr = value["revenue_receipts", "provisional"] + actual_ndc
    if actual_ndc != 83757 or actual_nbr != 3385982:
        raise ValueError("CGA reported receipt aggregates do not reconcile to derived components")
    reconciliations.extend([
        {"estimateType": "provisional", "identity": "derived_non_debt_capital_receipts_matches_cga_reported", "reported": 83757, "calculated": actual_ndc, "status": "passed"},
        {"estimateType": "provisional", "identity": "derived_non_borrowed_receipts_matches_cga_reported", "reported": 3385982, "calculated": actual_nbr, "status": "passed"},
    ])
    derived_counts = Counter(d.estimate_type for d in derived)
    if dict(derived_counts) != manifest.get("expectedDerivedMetricCounts"):
        raise ValueError(f"derived metric count mismatch: {dict(derived_counts)} != {manifest.get('expectedDerivedMetricCounts')}")

    expected = manifest["expectedObservationCounts"]
    counts = Counter(o.estimate_type for o in observations)
    if dict(counts) != expected:
        raise ValueError(f"observation count mismatch: {dict(counts)} != {expected}")
    expected_metrics = set(manifest["commonCoreMetricIds"])
    for state in ("BE", "RE", "provisional"):
        state_metrics = {o.metric for o in observations if o.estimate_type == state}
        if state_metrics != expected_metrics:
            raise ValueError(f"common-core metric coverage mismatch for {state}: {state_metrics} != {expected_metrics}")
    if any(o.estimate_type == "final_actual" for o in observations):
        raise ValueError("final_actual must remain absent until verified official final accounts exist")
    if any(o.identity_version != 2 for o in observations):
        raise ValueError("all historical observations must use identity v2")

    output = {
        "schemaVersion": 1,
        "financialYear": financial_year,
        "jurisdiction": "india",
        "jurisdictionType": "union",
        "observations": [o.to_dict() for o in observations],
        "derivedMetrics": [d.to_dict() for d in derived],
        "availableEstimateStates": ["BE", "RE", "provisional"],
        "unavailableEstimateStates": {"final_actual": {"status": "absent", "reason": manifest["finalActualAbsence"]["reason"], "evidenceSourceId": manifest["finalActualAbsence"]["evidenceSourceId"], "evidenceReleaseId": manifest["finalActualAbsence"]["evidenceReleaseId"], "sourceHash": manifest["finalActualAbsence"]["sourceHash"]}},
        "sourceManifestPath": str(manifest_path),
        "evidenceMappings": evidence + derived_evidence,
        "reconciliations": reconciliations,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return output


def _ingest_fy_2024_25(manifest_path: Path | None, output_path: Path | None) -> dict[str, Any]:
    """Normalize the four FY24-25 release states, retaining both BE vintages."""
    financial_year = "2024-25"
    manifest_path = manifest_path or historical_source_manifest_path(financial_year)
    output_path = output_path or historical_processed_path(financial_year)
    manifest = _load_json(manifest_path)
    if manifest.get("financialYear") != financial_year:
        raise ValueError(f"manifest FY {manifest.get('financialYear')} does not match requested FY {financial_year}")
    if manifest.get("schemaVersion") != 1:
        raise ValueError("unsupported historical manifest schemaVersion")

    sources: dict[tuple[str, str], dict[str, Any]] = {}
    for source in manifest.get("sources", []):
        if source.get("financialYear") != financial_year:
            raise ValueError(f"wrong FY on source {source.get('sourceId')}/{source.get('releaseId')}")
        key = (source["sourceId"], source["releaseId"])
        if key in sources:
            raise ValueError(f"duplicate declared source release: {key}")
        artifact = Path(source["artifactPath"])
        sidecar_path = Path(source["sidecarPath"])
        if not artifact.is_file() or not sidecar_path.is_file():
            raise ValueError(f"missing declared source artifact or sidecar: {artifact}")
        sidecar = _load_json(sidecar_path)
        digest = _sha256(artifact)
        if digest != source["sourceHash"] or digest != sidecar.get("source_hash"):
            raise ValueError(f"source hash mismatch: {artifact}")
        artifact_fy = source.get("artifactFinancialYear", financial_year)
        expected_artifact = historical_source_artifact_path(
            artifact_fy, source["sourceId"], source["releaseId"], digest, source["format"]
        )
        if artifact != expected_artifact:
            raise ValueError(f"artifact is outside its declared hash-addressed release path: {artifact}")
        for field, sidecar_field in (("sourceId", "source_id"), ("releaseId", "release_id"), ("url", "original_url")):
            if source[field] != sidecar.get(sidecar_field):
                raise ValueError(f"source sidecar mismatch for {field}: {artifact}")
        if source.get("retrievedAt") != sidecar.get("retrieval_date"):
            raise ValueError(f"source sidecar mismatch for retrieval date: {artifact}")
        sidecar_publication_date = sidecar.get("published_at", sidecar.get("publication_date"))
        if source.get("publishedAt") != sidecar_publication_date:
            raise ValueError(f"source sidecar mismatch for publication date: {artifact}")
        source["_artifact"] = artifact
        sources[key] = source
    required = {tuple(item) for item in manifest.get("requiredSourceReleases", [])}
    if set(sources) != required:
        raise ValueError(f"declared source releases do not match required packet: {set(sources)} != {required}")

    records: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for source in sources.values():
        if not source.get("transcriptionPath"):
            continue
        transcription_path = Path(source["transcriptionPath"])
        if not transcription_path.is_file():
            raise ValueError(f"missing declared structured transcription: {transcription_path}")
        transcription = _load_json(transcription_path)
        if (transcription.get("financialYear") != financial_year or
            transcription.get("sourceId") != source["sourceId"] or
            transcription.get("releaseId") != source["releaseId"] or
            transcription.get("sourceHash") != source["sourceHash"]):
            raise ValueError(f"transcription provenance mismatch: {transcription_path}")
        for item in transcription.get("observations", []):
            _verify_locator(source, item)
            records.append((source, item))

    supporting_evidence: list[dict[str, Any]] = []
    for item in manifest.get("reconciliationAdjustments", []):
        source = sources.get((item["sourceId"], item["releaseId"]))
        if not source or source["sourceHash"] != item["sourceHash"]:
            raise ValueError(f"missing or mismatched reconciliation support source: {item.get('metric')}")
        _verify_locator(source, item)
        supporting_evidence.append({**item, "traceStatus": "verified_artifact_to_row_value_supporting_reconciliation"})

    observations: list[FinancialObservation] = []
    evidence: list[dict[str, Any]] = []
    seen: dict[tuple[str, str, str, str, str], float] = {}
    ids: dict[tuple[str, str, str], str] = {}
    by_id: dict[str, FinancialObservation] = {}
    for source, item in records:
        metric, state = item["metric"], item["estimateType"]
        if metric not in METRICS:
            raise ValueError(f"unknown metric id: {metric}")
        if state not in {"BE", "RE", "provisional", "actual", "audited_actual", "final_actual"}:
            raise ValueError(f"invalid estimate state in proof packet: {state}")
        if (item.get("financialYear") != financial_year or item.get("unit") != "crore" or
            item.get("currency") != "INR" or state != source["estimateType"]):
            raise ValueError(f"wrong FY, units, currency, or estimate state in {metric}")
        if item.get("comparability") in {"not_comparable", "comparable_with_note"} and not item.get("rationale"):
            raise ValueError(f"{item['comparability']} requires rationale: {metric} {state}")
        release_id = source["releaseId"]
        key = (financial_year, state, source["sourceId"], release_id, metric)
        if key in seen:
            if seen[key] != float(item["amount"]):
                raise ValueError(f"conflicting values for logical release key {key}")
            raise ValueError(f"duplicate release-qualified observation key {key}")
        seen[key] = float(item["amount"])
        locator = item["locator"]
        data_source = DataSource(
            organization=source["organization"], document=source["document"], url=source["url"],
            table=locator.get("table"), page=str(locator.get("page", "")) or None,
            row=str(locator.get("row", "")) or None, published_at=source.get("publishedAt"),
            retrieved_at=source["retrievedAt"], data_status="final" if state == "final_actual" else "estimated",
            notes=("CGA Finance Accounts final annual actual; release date not stated on the captured artifact listing." if state == "final_actual" and not source.get("publishedAt") else None),
            definition=item["sourceWording"], source_id=source["sourceId"], release_id=release_id,
            source_hash=source["sourceHash"],
        )
        observation = FinancialObservation(
            jurisdiction="india", jurisdiction_type="union", financial_year=financial_year,
            period_type="annual", metric=metric, amount=float(item["amount"]), estimate_type=state,
            source=data_source, definition_id=metric, coverage="Union Government of India",
            classification_type=METRICS[metric]["domain"], parent_metric=METRICS[metric]["parent_metric"],
            canonical_definition=METRICS[metric]["accounting_interpretation"],
            definition_version=item["definitionVersion"],
            comparison_eligibility={"status": item["comparability"], **({"rationale": item["rationale"]} if item.get("rationale") else {})},
            identity_version=2,
        )
        errors = validate_observation(observation)
        if errors:
            raise ValueError(f"invalid historical observation {metric}: {errors}")
        observations.append(observation)
        by_id[observation.id] = observation
        ids[(metric, state, release_id)] = observation.id
        evidence.append({
            **item, "sourceId": source["sourceId"], "releaseId": release_id,
            "sourceHash": source["sourceHash"], "canonicalDefinition": observation.canonical_definition,
            "definitionVersion": item["definitionVersion"],
            "traceStatus": "verified_artifact_to_row_to_transcription_to_observation",
        })

    counts_by_release: Counter[str] = Counter(o.source.release_id for o in observations)
    if dict(counts_by_release) != manifest["expectedObservationCountsByRelease"]:
        raise ValueError(f"observation counts by release mismatch: {dict(counts_by_release)} != {manifest['expectedObservationCountsByRelease']}")
    if any(o.identity_version != 2 for o in observations):
        raise ValueError("all FY 2024-25 historical observations must use identity v2")

    derived: list[DerivedMetric] = []
    derived_evidence: list[dict[str, Any]] = []
    groups = sorted({(o.estimate_type, o.source.release_id) for o in observations})
    for state, release_id in groups:
        group_values = {o.metric: o for o in observations if o.estimate_type == state and o.source.release_id == release_id}
        formulas: list[tuple[str, str, list[str], float, str]] = []
        if {"recovery_of_loans", "other_capital_receipts"} <= group_values.keys():
            loans, other = group_values["recovery_of_loans"], group_values["other_capital_receipts"]
            formulas.append(("non_debt_capital_receipts", "recovery_of_loans + other_capital_receipts", [loans.id, other.id], loans.amount + other.amount, "Derived from the official recovery-of-loans and other-receipts rows; not directly reported as one value."))
        if {"revenue_receipts", "recovery_of_loans", "other_capital_receipts"} <= group_values.keys():
            receipts, loans, other = group_values["revenue_receipts"], group_values["recovery_of_loans"], group_values["other_capital_receipts"]
            formulas.append(("non_borrowed_receipts", "revenue_receipts + recovery_of_loans + other_capital_receipts", [receipts.id, loans.id, other.id], receipts.amount + loans.amount + other.amount, "Derived from source rows. Budget 'Total Receipts' includes borrowing and is intentionally not used."))
        if state == "final_actual" and {"revenue_expenditure", "capital_expenditure"} <= group_values.keys():
            rev, cap = group_values["revenue_expenditure"], group_values["capital_expenditure"]
            formulas.append(("total_expenditure", "revenue_expenditure + capital_expenditure", [rev.id, cap.id], rev.amount + cap.amount, "Derived from the final annual-account revenue and capital expenditure totals; not a single source-reported row."))
        for metric, formula, input_ids, amount, description in formulas:
            derived.append(DerivedMetric(metric=metric, formula=formula, inputs=input_ids, value=amount, unit="crore", description=description, financial_year=financial_year, estimate_type=state))
            derived_evidence.append({"metric": metric, "estimateType": state, "releaseId": release_id, "amount": amount, "unit": "crore", "sourceReported": False, "formula": formula, "inputObservationIds": input_ids, "inputEvidence": [{"observationId": obsid, "sourceId": by_id[obsid].source.source_id, "releaseId": by_id[obsid].source.release_id, "sourceHash": by_id[obsid].source.source_hash} for obsid in input_ids], "comparability": "comparable_with_note", "rationale": description, "traceStatus": "derived_from_verified_input_observations"})

    # Validate source-present accounting identities per release. Interim Budget
    # rounding can differ by one crore, as its own publication notes.
    tolerance = float(manifest.get("reconciliationToleranceCrore", 0))
    reconciliations: list[dict[str, Any]] = []
    for state, release_id in groups:
        vals = {o.metric: o.amount for o in observations if o.estimate_type == state and o.source.release_id == release_id}
        if state == "final_actual":
            total_expenditure = next(d.value for d in derived if d.metric == "total_expenditure" and d.estimate_type == state)
        else:
            total_expenditure = vals["total_expenditure"]
        comparisons = [("total_expenditure_equals_revenue_plus_capital_expenditure", total_expenditure, vals["revenue_expenditure"] + vals["capital_expenditure"])]
        if "revenue_deficit" in vals:
            comparisons.append(("revenue_deficit_equals_revenue_expenditure_minus_receipts", vals["revenue_deficit"], vals["revenue_expenditure"] - vals["revenue_receipts"]))
        if "fiscal_deficit" in vals:
            comparisons.append(("fiscal_deficit_equals_expenditure_minus_nonborrowed_receipts", vals["fiscal_deficit"], vals["total_expenditure"] - (vals["revenue_receipts"] + vals["recovery_of_loans"] + vals["other_capital_receipts"])))
            comparisons.append(("primary_deficit_equals_fiscal_deficit_minus_interest", vals["primary_deficit"], vals["fiscal_deficit"] - vals["interest_payments"]))
        if {"revenue_receipts", "tax_revenue_net", "non_tax_revenue"} <= vals.keys():
            # Final accounts add separately reported grant-in-aid receipts to
            # net tax and non-tax receipts; budget estimate tables do not.
            adjustment = next((float(item["amount"]) for item in supporting_evidence if item.get("estimateType") == state and item.get("metric") == "grants_in_aid_receipts"), 0.0)
            comparisons.append(("revenue_receipts_equals_net_tax_plus_nontax_and_reported_grants", vals["revenue_receipts"], vals["tax_revenue_net"] + vals["non_tax_revenue"] + adjustment))
        for name, reported, calculated in comparisons:
            if abs(reported - calculated) > tolerance:
                raise ValueError(f"accounting reconciliation failed: {release_id} {name}: {reported} != {calculated}")
            reconciliations.append({"estimateType": state, "releaseId": release_id, "identity": name, "reported": reported, "calculated": calculated, "toleranceCrore": tolerance, "status": "passed"})

    counts_by_state = Counter(o.estimate_type for o in observations)
    if dict(counts_by_state) != manifest["expectedObservationCounts"]:
        raise ValueError(f"observation counts by estimate state mismatch: {dict(counts_by_state)} != {manifest['expectedObservationCounts']}")
    derived_counts = Counter(d.estimate_type for d in derived)
    if dict(derived_counts) != manifest["expectedDerivedMetricCounts"]:
        raise ValueError(f"derived metric counts mismatch: {dict(derived_counts)} != {manifest['expectedDerivedMetricCounts']}")
    output = {
        "schemaVersion": 1, "financialYear": financial_year, "jurisdiction": "india", "jurisdictionType": "union",
        "observations": [o.to_dict() for o in observations], "derivedMetrics": [d.to_dict() for d in derived],
        "availableEstimateStates": ["BE", "RE", "final_actual"],
        "releaseCatalog": [
            {"sourceId": source["sourceId"], "releaseId": source["releaseId"], "estimateType": source["estimateType"], "publishedAt": source.get("publishedAt"), "sourceHash": source["sourceHash"], "defaultComparisonRelease": source["releaseId"] == manifest.get("defaultComparisonReleaseByState", {}).get(source["estimateType"])}
            for source in sources.values() if source.get("role") == "observation_source"
        ],
        "unavailableEstimateStates": {"provisional": {"status": "absent", "reason": "No provisional estimate is substituted for the verified final CGA Finance Accounts release."}},
        "unavailableMetricStates": {metric: {"estimateType": "final_actual", "status": "absent", "reason": reason} for metric, reason in manifest["finalActualExcludedMetricIds"].items()},
        "sourceManifestPath": str(manifest_path), "evidenceMappings": evidence + derived_evidence,
        "supportingEvidenceMappings": supporting_evidence, "reconciliations": reconciliations,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fy", required=True, help="Explicit Union financial year, e.g. 2025-26")
    args = parser.parse_args()
    result = ingest(args.fy)
    print(f"Wrote {historical_processed_path(args.fy)}: {len(result['observations'])} observations, {len(result['derivedMetrics'])} derived metrics")


if __name__ == "__main__":
    main()
