# Arthrekha — Data Sources

## Current coverage

Arthrekha currently covers the Union Government of India for FY 2026–27. Budget Estimates come from the Ministry of Finance. Provisional cumulative actuals run through June 2026 and come from the Controller General of Accounts.

## Union Budget 2026–27

- **Organization:** Ministry of Finance, Government of India
- **Publication:** Budget at a Glance 2026–27
- **Official document:** https://www.indiabudget.gov.in/doc/Budget_at_Glance/budget_at_a_glance.pdf
- **Published:** 1 February 2026
- **Estimate type:** annual Budget Estimate
- **Stored source:** `datasets/raw/union_budget_2026-27_budget_at_a_glance.pdf`
- **Structured transcription:** `datasets/raw/union_budget_2026-27_be.json`

The current structured source contains 44 metrics from the following official tables:

- Budget at a Glance
- Receipts
- Expenditure
- Major Items of Expenditure
- Transfer of Resources to States and Union Territories with Legislature
- Sources of Financing the Deficit

Coverage includes receipts, expenditure, deficits, nominal GDP, selected tax components, transfers, scheme aggregates and debt-financing instruments. Each metric records its table/page/row reference and official definition where available.

`total_receipts` follows the official Budget-at-a-Glance meaning and includes borrowings and other liabilities. `non_borrowed_receipts` is a separately labelled Arthrekha-derived aggregate of revenue receipts and non-debt capital receipts. These concepts are never silently substituted for one another.

## Controller General of Accounts

- **Organization:** Controller General of Accounts, Ministry of Finance
- **Publication:** Monthly Accounts / Accounts at a Glance
- **Official site:** https://cga.nic.in/
- **Estimate type:** cumulative provisional actual
- **Current periods:** April, April–May and April–June 2026
- **Status:** provisional and unaudited

The CGA observations remain the ten validated current-year execution metrics established in Milestone 1. Values are cumulative year-to-date; Arthrekha does not manufacture monthly flows by subtracting cumulative observations.

## Source precedence

Different observation types are preserved rather than overwritten:

1. CAG audited actuals — final but lagged, not yet ingested
2. CGA provisional actuals — timely, unaudited
3. Budget Revised Estimates — not yet ingested
4. Budget Estimates — annual plan

## Provenance requirements

Every production observation contains:

- source organization and document
- canonical URL
- table/page reference where available
- publication and retrieval dates
- data status
- observation type and period
- source definition or notes where available

The interface presents this as an evidence trace. Arthrekha-derived calculations are labelled separately from official source values.

## Out of scope

No historical series, state finances, ministry-level execution, audited CAG accounts or external RBI debt stock has been added in Milestone 3. The debt domain currently explains and exposes only the official FY 2026–27 financing components present in Budget at a Glance.

**Last updated:** 27 August 2026
**Latest actual period:** June 2026
