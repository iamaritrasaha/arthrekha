"""
Automated Source-Evidence Verification Layer

Verifies the PRIMARY SOURCE → STRUCTURED RAW DATA boundary:
1. Validates each metric in datasets/raw/union_budget_2026-27_be.json against the
   official Budget at a Glance PDF text cells, footnotes, and derivations.
2. Disambiguates duplicated figures (e.g. Fiscal Deficit vs Borrowings, Total Receipts vs Total Expenditure).
3. Verifies mathematical and period consistency across all CGA provisional actual files.
"""

import json
import re
import subprocess
from pathlib import Path
from typing import Any


FIXTURE_PATH = Path("pipeline/fixtures/source_evidence_2026_27.json")
DEFAULT_PDF_PATH = Path("datasets/raw/union_budget_2026-27_budget_at_a_glance.pdf")
DEFAULT_BE_PATH = Path("datasets/raw/union_budget_2026-27_be.json")


def load_evidence_fixture(path: Path = FIXTURE_PATH) -> dict[str, Any]:
    with open(path, "r") as f:
        return json.load(f)


def extract_pdf_page_layout(pdf_path: Path, page_index: int) -> str:
    """Extract layout text for a specific 1-indexed PDF page."""
    res = subprocess.run(
        ["pdftotext", "-layout", "-f", str(page_index), "-l", str(page_index), str(pdf_path), "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    return res.stdout


SEMANTIC_METRIC_KEYWORDS = {
    "fiscal_deficit": ["fiscal deficit", "deficit", "घाटा", "राजकोषीय"],
    "borrowings_and_other_liabilities": ["borrowing", "liabilities", "उिार", "देयताएं"],
    "total_receipts": ["total receipts", "receipts", "प्रावियां"],
    "total_expenditure": ["total expenditure", "expenditure", "व्यय"],
    "revenue_receipts": ["revenue receipts", "राजस्व प्रावियां"],
    "revenue_expenditure": ["revenue account", "revenue expenditure", "राजस्व लेखा"],
    "capital_expenditure": ["capital account", "capital expenditure", "पंजीगत लेखा"],
    "revenue_deficit": ["revenue deficit", "राजस्व घाटा", "घाटा"],
    "primary_deficit": ["primary deficit", "प्राथवमक घाटा", "घाटा"],
    "effective_revenue_deficit": ["effective revenue deficit", "प्रिावी राजस्व घाटा", "घाटा"],
    "effective_capital_expenditure": ["effective capital expenditure", "प्रिावी पंजीगत व्यय"],
}


def verify_be_source_evidence(
    pdf_path: Path = DEFAULT_PDF_PATH,
    be_json_path: Path = DEFAULT_BE_PATH,
    fixture_path: Path = FIXTURE_PATH,
    evidence_override: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Verify all 44 BE raw metrics against official PDF layout text and evidence fixture.
    """
    evidence_map = evidence_override if evidence_override is not None else load_evidence_fixture(fixture_path)
    with open(be_json_path, "r") as f:
        be_data = json.load(f)

    raw_values = be_data.get("data", {})
    metadata_map = be_data.get("metric_metadata", {})

    report = {
        "total_metrics": len(evidence_map),
        "verified": 0,
        "failed": 0,
        "checks": [],
        "all_passed": False,
    }

    # Cache extracted pages to avoid repeated pdftotext calls
    page_cache: dict[int, str] = {}

    for metric_id, spec in evidence_map.items():
        expected_amount = spec["expected_amount"]
        pdf_page = spec["pdf_page"]
        verification_type = spec["verification_type"]

        # Check raw JSON contains metric with matching amount
        if metric_id not in raw_values:
            report["failed"] += 1
            report["checks"].append({
                "metric": metric_id,
                "status": "FAILED",
                "reason": "Missing from raw JSON",
            })
            continue

        raw_amount = raw_values[metric_id]
        if raw_amount != expected_amount:
            report["failed"] += 1
            report["checks"].append({
                "metric": metric_id,
                "status": "FAILED",
                "reason": f"Amount mismatch: raw {raw_amount} != expected {expected_amount}",
            })
            continue

        # Extract page text if not cached
        if pdf_page not in page_cache:
            try:
                page_cache[pdf_page] = extract_pdf_page_layout(pdf_path, pdf_page)
            except Exception as e:
                report["failed"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "FAILED",
                    "reason": f"Failed to extract PDF page {pdf_page}: {e}",
                })
                continue

        page_text = page_cache[pdf_page]
        # Clean comma separators within numbers for matching
        cleaned_text = re.sub(r"(\d),(\d)", r"\1\2", page_text)

        # 1. Printed folio verification
        expected_folio = spec.get("printed_page")
        if expected_folio is not None:
            page_lines = page_text.splitlines()
            header_tokens = [w for l in page_lines[:4] for w in l.split()]
            footer_tokens = [w for l in page_lines[-4:] for w in l.split()]
            if str(expected_folio) not in header_tokens and str(expected_folio) not in footer_tokens:
                report["failed"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "FAILED",
                    "reason": f"Printed folio {expected_folio} not found on PDF page {pdf_page}",
                })
                continue

        if verification_type == "printed_cell":
            val_str = str(expected_amount)
            if val_str not in cleaned_text:
                report["failed"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "FAILED",
                    "reason": f"Value {val_str} not found on PDF page {pdf_page}",
                })
                continue

            row_label_key = spec["row_label"]
            label_lower = row_label_key.lower()

            # 2. Semantic congruence between metric ID and row label
            if metric_id in SEMANTIC_METRIC_KEYWORDS:
                keywords = SEMANTIC_METRIC_KEYWORDS[metric_id]
                if not any(k in label_lower for k in keywords):
                    report["failed"] += 1
                    report["checks"].append({
                        "metric": metric_id,
                        "status": "FAILED",
                        "reason": f"Semantic mismatch: metric '{metric_id}' does not match row label '{row_label_key}'",
                    })
                    continue

            # 3. Row-level layout block verification
            lines = page_text.splitlines()
            m_row = re.match(r"^(\d+[a-z]?|[A-Z]+)\.\s*(.*)", row_label_key)
            prefix = m_row.group(1) if m_row else None
            keyword = (m_row.group(2) if m_row else row_label_key).split()[0].lower()

            matching_line_indices = []
            for i, line in enumerate(lines):
                clean_line = re.sub(r"(\d),(\d)", r"\1\2", line)
                line_lower = clean_line.lower()
                if prefix and re.search(r"(^|\s)" + re.escape(prefix) + r"(\.|\s)", clean_line):
                    matching_line_indices.append(i)
                elif not prefix and keyword in line_lower:
                    matching_line_indices.append(i)

            if not matching_line_indices:
                report["failed"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "FAILED",
                    "reason": f"Row label '{row_label_key}' not found on PDF page {pdf_page}",
                })
                continue

            row_found = False
            for idx in matching_line_indices:
                context = " ".join(lines[max(0, idx - 1):min(len(lines), idx + 2)])
                clean_context = re.sub(r"(\d),(\d)", r"\1\2", context)
                if val_str in clean_context:
                    row_found = True
                    break

            if not row_found:
                report["failed"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "FAILED",
                    "reason": f"Amount {val_str} not found in row block for '{row_label_key}' on page {pdf_page}",
                })
                continue

            report["verified"] += 1
            report["checks"].append({
                "metric": metric_id,
                "status": "PASSED",
                "amount": raw_amount,
                "pdf_page": pdf_page,
                "table": spec["table_name"],
                "row_verified": True,
                "type": verification_type,
            })

        elif verification_type == "footnote":
            # Footnote verification (e.g. GDP in Note (i))
            val_str = str(expected_amount)
            if val_str in cleaned_text and "Note" in page_text:
                report["verified"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "PASSED",
                    "amount": raw_amount,
                    "pdf_page": pdf_page,
                    "type": verification_type,
                    "notes": spec.get("notes"),
                })
            else:
                report["failed"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "FAILED",
                    "reason": f"Footnote value {val_str} not verified in notes on page {pdf_page}",
                })

        elif verification_type == "derived_aggregate":
            # Explicit derivation check (e.g. non_borrowed_receipts)
            rev_receipts = raw_values.get("revenue_receipts", 0)
            non_debt_cap = raw_values.get("non_debt_capital_receipts", 0)
            if raw_amount == rev_receipts + non_debt_cap:
                report["verified"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "PASSED",
                    "amount": raw_amount,
                    "type": verification_type,
                    "derivation": f"{rev_receipts} + {non_debt_cap} = {raw_amount}",
                })
            else:
                report["failed"] += 1
                report["checks"].append({
                    "metric": metric_id,
                    "status": "FAILED",
                    "reason": f"Derivation failed: {rev_receipts} + {non_debt_cap} != {raw_amount}",
                })

    report["all_passed"] = report["failed"] == 0 and report["verified"] == len(evidence_map)
    return report


def verify_cga_monthly_consistency(cga_dir: Path = Path("datasets/raw")) -> dict[str, Any]:
    """
    Verify all raw CGA JSON files for accounting and period consistency.
    """
    # Provenance sidecars share the monthly data-file prefix, but are not raw
    # metric datasets and must not be counted as separate reporting periods.
    cga_files = sorted(
        path for path in cga_dir.glob("cga_2026-27_*.json")
        if not path.name.endswith(".provenance.json")
    )
    report = {
        "files_checked": len(cga_files),
        "periods": [],
        "all_reconciled": True,
        "details": [],
    }

    for path in cga_files:
        with open(path, "r") as f:
            data = json.load(f)

        d = data.get("data", {})
        period = data.get("reporting_period")
        fy = data.get("financial_year")
        est_type = data.get("estimate_type")

        # Identity 1: Net Tax + Non Tax == Revenue Receipts
        tax_rev = d.get("tax_revenue_net", 0)
        non_tax = d.get("non_tax_revenue", 0)
        rev_rec = d.get("revenue_receipts", 0)
        id1_ok = (tax_rev + non_tax) == rev_rec

        # Identity 2: Revenue Receipts + Non-Debt Capital == Non-Borrowed Receipts
        non_debt_cap = d.get("non_debt_capital_receipts", 0)
        non_borrowed = d.get("non_borrowed_receipts", 0)
        id2_ok = (rev_rec + non_debt_cap) == non_borrowed

        # Identity 3: Revenue Exp + Capital Exp == Total Exp
        rev_exp = d.get("revenue_expenditure", 0)
        cap_exp = d.get("capital_expenditure", 0)
        tot_exp = d.get("total_expenditure", 0)
        id3_ok = (rev_exp + cap_exp) == tot_exp

        # Identity 4: Total Exp - Non-Borrowed Receipts == Fiscal Deficit
        fiscal_def = d.get("fiscal_deficit", 0)
        id4_ok = (tot_exp - non_borrowed) == fiscal_def

        period_ok = (
            id1_ok and id2_ok and id3_ok and id4_ok
            and fy == "2026-27"
            and est_type == "provisional"
        )

        if not period_ok:
            report["all_reconciled"] = False

        report["periods"].append(period)
        report["details"].append({
            "file": path.name,
            "period": period,
            "financial_year": fy,
            "estimate_type": est_type,
            "reconciles": period_ok,
            "identities": {
                "revenue_receipts": id1_ok,
                "non_borrowed_receipts": id2_ok,
                "total_expenditure": id3_ok,
                "fiscal_deficit": id4_ok,
            },
        })

    return report
