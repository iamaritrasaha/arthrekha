# Arthrekha — Data Sources

This document lists all official data sources used in Arthrekha, their provenance, and update schedules.

## Primary Sources — Union Government

### 1. Union Budget (Ministry of Finance)

**Organization**: Ministry of Finance, Government of India  
**Website**: https://www.indiabudget.gov.in/  
**Authoritative Status**: Primary  
**Update Frequency**: Annual (typically February 1)

**Documents Used**:
- **Budget at a Glance** — Summary tables with headline fiscal figures
- **Expenditure Budget Vol 1** — Ministry-wise expenditure allocations
- **Receipts Budget** — Detailed revenue and capital receipts

**Estimate Types**:
- **BE (Budget Estimate)** — Presented in February for the upcoming financial year
- **RE (Revised Estimate)** — Mid-year revision presented in next year's budget

**Data Extracted**:
- Revenue receipts (tax and non-tax)
- Non-debt capital receipts
- Total receipts
- Revenue expenditure
- Capital expenditure
- Total expenditure
- Interest payments
- Fiscal deficit

**Publication Schedule**:
- Budget presented to Parliament on February 1 each year
- Covers financial year April–March

### 2. Controller General of Accounts (CGA)

**Organization**: Controller General of Accounts, Department of Expenditure, Ministry of Finance  
**Website**: https://cga.nic.in/  
**Authoritative Status**: Primary  
**Update Frequency**: Monthly

**Documents Used**:
- **Accounts at a Glance** — Monthly fiscal position summary
- **Monthly Accounts** — Detailed receipts and expenditure accounts

**Estimate Type**:
- **Provisional Actuals** — Monthly execution data, subject to audit by CAG

**Data Extracted**:
- Month-wise and cumulative (YTD) actuals for:
  - Revenue receipts
  - Revenue expenditure
  - Capital expenditure
  - Fiscal deficit
  - All components matching Budget structure

**Publication Schedule**:
- Monthly reports typically published by end of following month
- Example: June 2026 actuals published by July 31, 2026

**Data Characteristics**:
- **Cumulative YTD** — CGA reports show year-to-date cumulative figures
- **Provisional** — Subject to final audit by Comptroller and Auditor General (CAG)
- **Unaudited** — Final audited figures published much later by CAG

### 3. Economic Survey (Ministry of Finance)

**Organization**: Ministry of Finance, Economic Division  
**Website**: https://www.indiabudget.gov.in/economicsurvey/  
**Authoritative Status**: Primary  
**Update Frequency**: Annual (typically January, before Budget)

**Data Extracted**:
- GDP estimates and projections
- Macroeconomic context
- Fiscal policy analysis

**Usage in Arthrekha**:
- Reference for fiscal deficit as % of GDP calculations
- Economic context and background

### 4. Reserve Bank of India (RBI)

**Organization**: Reserve Bank of India  
**Website**: https://www.rbi.org.in/  
**Authoritative Status**: Primary  
**Update Frequency**: Varies by publication

**Documents Used** (future milestones):
- **Handbook of Statistics on Indian Economy** — Historical fiscal and debt data
- **State Finances: A Study of Budgets** — Consolidated state-level fiscal data
- **Annual Report** — Government debt, market borrowings

**Data Extracted** (future):
- Outstanding government debt (Centre and States)
- Debt composition (domestic vs external)
- Interest rates on government securities
- Market borrowings

### 5. Comptroller and Auditor General (CAG)

**Organization**: Comptroller and Auditor General of India  
**Website**: https://cag.gov.in/  
**Authoritative Status**: Primary (audited final figures)  
**Update Frequency**: Annual

**Documents Used** (future milestones):
- **Union Government Finance Accounts** — Final audited accounts
- **Appropriation Accounts** — Expenditure vs grants
- **Audit Reports** — Compliance and performance audits

**Data Characteristics**:
- **Final Audited** — Most authoritative fiscal data
- **Lagged** — Published with significant delay (6-12 months after FY end)

---

## Data Hierarchy and Precedence

When multiple sources provide the same data point:

1. **CAG audited figures** (final, but lagged)
2. **CGA provisional actuals** (timely, unaudited)
3. **Budget Revised Estimates** (mid-year update)
4. **Budget Estimates** (forward-looking plan)

Arthrekha stores all estimate types separately with explicit `estimateType` metadata.

---

## State and UT Sources (Future Milestones)

Each state and union territory publishes its own budget and accounts:

- State budget websites (varies by state)
- RBI's consolidated **State Finances** report
- CAG state-specific audit reports

State data ingestion planned for later milestones.

---

## Data Not From Official Sources

Arthrekha **does not use**:
- Third-party budget analysis websites
- News aggregators
- Unofficial Excel trackers
- Social media data
- Crowdsourced data

**Rationale**: Every data point must be traceable to an official first-party government publication.

---

## Source Verification

For every observation in Arthrekha:

```typescript
source: {
  organization: string;    // Official entity name
  document: string;        // Specific publication name
  url: string;             // Canonical source URL
  table?: string;          // Table/page reference
  publishedAt: string;     // ISO date when govt published
  retrievedAt: string;     // ISO date when we retrieved
  dataStatus: DataStatus;  // "final" | "provisional" | "estimated"
  notes?: string;          // Clarifications
}
```

Users can click any number in Arthrekha to see its complete source provenance.

---

## Known Limitations

1. **CGA actuals lag by ~1 month** — June data available end of July
2. **Budget documents are PDFs** — Extraction requires careful parsing
3. **Some tables use lakh crore** — Arthrekha normalizes to crore
4. **Accounting classifications evolve** — Historical comparisons need care
5. **State data less standardized** — Format varies across states

---

## Update Schedule

| Source | Frequency | Typical Publication |
|--------|-----------|---------------------|
| Union Budget | Annual | February 1 |
| CGA Monthly Accounts | Monthly | End of next month |
| Economic Survey | Annual | Late January |
| CAG Union Accounts | Annual | October (for prior FY) |
| RBI Handbook | Annual | October |

---

## Future Data Sources (Planned)

- GST revenue (GST Council reports)
- Ministry-wise detailed expenditure
- Scheme-wise allocations
- State budgets and accounts
- Local body finances (NITI Aayog)
- Debt Registry (RBI)

---

**Last Updated**: August 27, 2026  
**Financial Year Covered**: 2026-27  
**Latest Actuals Period**: June 2026
