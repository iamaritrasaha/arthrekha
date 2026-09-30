"""
Automated tests for the PRIMARY SOURCE → STRUCTURED RAW DATA boundary.
Verifies all 44 BE metrics against the official Budget at a Glance PDF
and all CGA monthly records for mathematical and provenance integrity.
"""

from pipeline.source_verifier import verify_be_source_evidence, verify_cga_monthly_consistency


def test_be_source_evidence_against_official_pdf():
    report = verify_be_source_evidence()
    assert report["total_metrics"] == 44
    assert report["failed"] == 0
    assert report["verified"] == 44
    assert report["all_passed"] is True

    # Specifically check the core fiscal anchors
    checked_metrics = {c["metric"]: c for c in report["checks"]}
    assert checked_metrics["fiscal_deficit"]["amount"] == 1695768
    assert checked_metrics["total_expenditure"]["amount"] == 5347315
    assert checked_metrics["revenue_receipts"]["amount"] == 3533150
    assert checked_metrics["nominal_gdp"]["amount"] == 39300393
    assert checked_metrics["nominal_gdp"]["type"] == "footnote"
    assert checked_metrics["non_borrowed_receipts"]["amount"] == 3651547
    assert checked_metrics["non_borrowed_receipts"]["type"] == "derived_aggregate"


def test_cga_monthly_provenance_and_identities():
    report = verify_cga_monthly_consistency()
    assert report["files_checked"] == 4
    assert set(report["periods"]) == {"apr", "apr-may", "apr-jun", "apr-jul"}
    assert report["all_reconciled"] is True

    for item in report["details"]:
        assert item["financial_year"] == "2026-27"
        assert item["estimate_type"] == "provisional"
        assert all(item["identities"].values())


def test_negative_wrong_row_on_same_page_rejected():
    """Prove that assigning a correct value to the wrong row on the same page fails."""
    override = {
        "revenue_receipts": {
            "metric": "revenue_receipts",
            "printed_page": 1,
            "pdf_page": 5,
            "table_name": "Budget at a Glance",
            "row_label": "4. Capital Receipts",  # Wrong row on same page (Row 4 has 1814165, not 3533150)
            "expected_amount": 3533150,
            "verification_type": "printed_cell",
        }
    }
    report = verify_be_source_evidence(evidence_override=override)
    assert report["all_passed"] is False
    assert report["failed"] == 1
    assert "Semantic mismatch" in report["checks"][0]["reason"] or "Amount 3533150 not found" in report["checks"][0]["reason"]


def test_negative_fiscal_deficit_and_borrowings_swap_rejected():
    """Prove that swapping Fiscal Deficit and Borrowings (same amount 1695768) fails semantic check."""
    override = {
        "fiscal_deficit": {
            "metric": "fiscal_deficit",
            "printed_page": 1,
            "pdf_page": 5,
            "table_name": "Budget at a Glance",
            "row_label": "7. Borrowings and Other Liabilities",  # Swapped with Borrowings
            "expected_amount": 1695768,
            "verification_type": "printed_cell",
        }
    }
    report = verify_be_source_evidence(evidence_override=override)
    assert report["all_passed"] is False
    assert report["failed"] == 1
    assert "Semantic mismatch" in report["checks"][0]["reason"]


def test_negative_total_receipts_and_total_expenditure_swap_rejected():
    """Prove that swapping Total Receipts and Total Expenditure (same amount 5347315) fails semantic check."""
    override = {
        "total_receipts": {
            "metric": "total_receipts",
            "printed_page": 1,
            "pdf_page": 5,
            "table_name": "Budget at a Glance",
            "row_label": "9. Total Expenditure (10+13)",  # Swapped with Total Expenditure
            "expected_amount": 5347315,
            "verification_type": "printed_cell",
        }
    }
    report = verify_be_source_evidence(evidence_override=override)
    assert report["all_passed"] is False
    assert report["failed"] == 1
    assert "Semantic mismatch" in report["checks"][0]["reason"]


def test_negative_wrong_pdf_page_or_folio_rejected():
    """Prove that supplying the wrong PDF physical page or wrong printed folio fails verification."""
    # Case A: Wrong PDF page (Page 8 instead of Page 5)
    override_wrong_page = {
        "revenue_receipts": {
            "metric": "revenue_receipts",
            "printed_page": 1,
            "pdf_page": 8,  # Page 8 is Deficit Statistics (folio 4), not Page 5 (folio 1)
            "table_name": "Budget at a Glance",
            "row_label": "1. Revenue Receipts",
            "expected_amount": 3533150,
            "verification_type": "printed_cell",
        }
    }
    report_page = verify_be_source_evidence(evidence_override=override_wrong_page)
    assert report_page["all_passed"] is False
    assert "Printed folio 1 not found on PDF page 8" in report_page["checks"][0]["reason"]

    # Case B: Wrong printed folio (Folio 99 on Page 5)
    override_wrong_folio = {
        "revenue_receipts": {
            "metric": "revenue_receipts",
            "printed_page": 99,
            "pdf_page": 5,
            "table_name": "Budget at a Glance",
            "row_label": "1. Revenue Receipts",
            "expected_amount": 3533150,
            "verification_type": "printed_cell",
        }
    }
    report_folio = verify_be_source_evidence(evidence_override=override_wrong_folio)
    assert report_folio["all_passed"] is False
    assert "Printed folio 99 not found" in report_folio["checks"][0]["reason"]


def test_negative_tampered_amount_rejected():
    """Prove that changing the expected amount fails verification."""
    override = {
        "fiscal_deficit": {
            "metric": "fiscal_deficit",
            "printed_page": 1,
            "pdf_page": 5,
            "table_name": "Budget at a Glance",
            "row_label": "17. Fiscal Deficit",
            "expected_amount": 1695769,  # Off by 1 (tampered)
            "verification_type": "printed_cell",
        }
    }
    report = verify_be_source_evidence(evidence_override=override)
    assert report["all_passed"] is False
    assert report["failed"] == 1
    assert "Amount mismatch" in report["checks"][0]["reason"] or "Amount 1695769 not found" in report["checks"][0]["reason"]


if __name__ == "__main__":
    test_be_source_evidence_against_official_pdf()
    print("✓ test_be_source_evidence_against_official_pdf")

    test_cga_monthly_provenance_and_identities()
    print("✓ test_cga_monthly_provenance_and_identities")

    test_negative_wrong_row_on_same_page_rejected()
    print("✓ test_negative_wrong_row_on_same_page_rejected")

    test_negative_fiscal_deficit_and_borrowings_swap_rejected()
    print("✓ test_negative_fiscal_deficit_and_borrowings_swap_rejected")

    test_negative_total_receipts_and_total_expenditure_swap_rejected()
    print("✓ test_negative_total_receipts_and_total_expenditure_swap_rejected")

    test_negative_wrong_pdf_page_or_folio_rejected()
    print("✓ test_negative_wrong_pdf_page_or_folio_rejected")

    test_negative_tampered_amount_rejected()
    print("✓ test_negative_tampered_amount_rejected")

    print("\nAll source provenance positive and negative regression tests passed!")
