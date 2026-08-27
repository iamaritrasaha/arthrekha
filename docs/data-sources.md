# Data Sources for FY 2026-27

## Status: Research Blocked

**Date**: August 27, 2026

## Issue

Unable to access official Government of India sources due to environment network restrictions:
- `indiabudget.gov.in` returns HTTP 403 Forbidden
- WebSearch returns no indexed results
- Cannot retrieve actual FY 2026-27 Budget documents or CGA monthly reports

## Required Official Sources

### 1. Union Budget 2026-27 - Budget Estimates

**Source**: Ministry of Finance, Government of India  
**Expected URL**: `https://www.indiabudget.gov.in/`  
**Document**: Budget at a Glance 2026-27  
**Presented**: February 1, 2026 (typical budget day)

**Required Metrics (BE)**:
- Revenue Receipts
- Tax Revenue (Net to Centre)
- Non-Tax Revenue
- Non-Debt Capital Receipts
- Total Receipts
- Revenue Expenditure
- Capital Expenditure
- Total Expenditure
- Interest Payments
- Fiscal Deficit

### 2. CGA Monthly Accounts - FY 2026-27

**Source**: Controller General of Accounts  
**Expected URL**: `https://cga.nic.in/`  
**Documents**: Monthly Accounts April-June 2026  
**Status**: Provisional/Unaudited

**Required Metrics (Actuals YTD)**:
- Same metrics as above
- Cumulative April-June 2026 (Q1 FY 2026-27)

**Note**: As of August 27, 2026, CGA has published through June 2026. Do not fabricate July or August values.

## Alternative Approach

Since direct source access is blocked, the data ingestion pipeline can be built with:

1. **Architecture-first approach**: Build complete parser/normalization/validation infrastructure
2. **Placeholder data structure**: Create JSON fixtures matching expected official structure
3. **Clear marking**: All placeholder data clearly marked as illustrative
4. **User-provided data**: Real data can be added by user with access to official sources

## Next Steps

**Option 1**: Build complete pipeline with clearly-marked illustrative data  
**Option 2**: User provides actual Budget 2026-27 BE and CGA actuals data  
**Option 3**: Document architecture only, defer data ingestion until sources accessible

## Official Source Documentation

Even without access, we can document the expected structure:

### Budget at a Glance Structure
- Typically Table 1: Revenue and Capital Receipts
- Typically Table 2: Revenue and Capital Expenditure  
- Typically Table 3: Deficits
- Format: PDF with tables
- Values: ₹ crore

### CGA Monthly Accounts Structure
- Statement of Accounts
- Cumulative receipts and expenditure
- Format: PDF/Excel
- Values: ₹ crore
- Status: Provisional until CAG audit

## Recommendation

Proceed with **Option 1**: Build the complete data ingestion pipeline with clearly-marked sample data that mirrors the expected official structure. This proves the architecture end-to-end. User can then replace sample data with real data from official sources when accessible.
