# Historical Fiscal-Year Comparison Plan

**Status:** research plan; FY 2025–26 Phase 2 proof case implemented below  
**Scope:** Union Government of India, FY 2025–26 through FY 2021–22

## Recommendation

Start with annual observations from official Union Budget publications and CGA Finance Accounts. Keep Budget Estimates (BE), Revised Estimates (RE), provisional actuals, and final actuals as separate observations with their source publication and vintage attached. Do not make a value available simply because a chart expects it. Add historical monthly CGA observations only after the annual model works and the downloadable workbook has been reproducibly captured and checked.

Use **FY 2025–26 as the first proof case**. It is the nearest completed FY and tests an important real condition: the BE and RE exist, and CGA has published provisional full-year accounts, but final/audited actuals are not yet evidenced by CGA Finance Accounts. The UI must say “provisional actual” and leave final actual absent until its official publication arrives.

## 1. Official source inventory

India Budget maintains year-specific Ministry of Finance document portals. Budget at a Glance, Annual Financial Statement, Receipt Budget, and Expenditure Profile are the practical starting publications. Where portal-generated Excel and the PDF disagree, the portal says the PDF is final. Budget at a Glance tables provide repeated FY columns across releases, while Receipt Budget and Expenditure Profile provide detail when a summary line does not map cleanly to the registry.

| Fiscal year | Ministry of Finance / Budget evidence | CGA evidence | What an initial reconstruction can establish |
|---|---|---|---|
| **2025–26** | [Budget 2025–26 portal](https://www.indiabudget.gov.in/budget2025-26/) supplies FY25–26 BE. [Budget 2026–27 Budget at a Glance](https://www.indiabudget.gov.in/doc/Budget_at_Glance/budget_at_a_glance.pdf) supplies FY25–26 RE; capture that publication separately from the original BE release. | CGA has FY25–26 monthly reports and its [provisional accounts release notice](https://cga.nic.in/Circular/Published/375.aspx). The [monthly-account dashboard](https://cga.gov.in/MonthDashboardReport/Published/list.aspx) is an additional progressive-series source. Final Finance Accounts are not yet evidenced in the CGA archive. | BE + RE + provisional full-year actuals are available from primary sources. Do **not** call the CGA provisional figure final or audited. |
| **2024–25** | [Interim Budget 2024–25](https://www.indiabudget.gov.in/budget2024-25%28I%29/) and the later [full Budget 2024–25 portal](https://www.indiabudget.gov.in/budget2024-25/) are distinct releases. Use the full Budget for the post-election BE; use the later 2025–26 publication for RE. | [CGA monthly reports](https://cga.nic.in/MonthlyReport/Published/3/2024-2025.aspx); [CGA Finance Accounts 2024–25](https://cga.nic.in/FinanceReport/Published/2024-2025.aspx), which contains CGA and C&AG certificates and detailed annual statements. | Keep interim BE and full-Budget BE as separate vintages if both are ever shown. A final actual series can use the released Finance Accounts, while preserving its publication and accounting basis. |
| **2023–24** | [Budget 2023–24 portal](https://www.indiabudget.gov.in/budget2023-24/) supplies original BE and RE. [Budget 2025–26 tables](https://www.indiabudget.gov.in/budget2025-26/doc/Budget_at_Glance/budget_at_a_glance.pdf) include FY23–24 actuals alongside FY24–25 BE/RE and FY25–26 BE. | [CGA monthly reports](https://cga.nic.in/MonthlyReport/Published/10/2023-2024.aspx); [Finance Accounts 2023–24](https://cga.nic.in/FinanceReport/Published/2023-2024.aspx). | BE, RE, and annual actual are sourceable. The actual is not interchangeable with either estimate state. |
| **2022–23** | [Budget 2022–23 portal](https://www.indiabudget.gov.in/budget2022-23/) supplies BE; the 2023–24 Budget release supplies RE; the [2024–25 Budget at a Glance](https://www.indiabudget.gov.in/budget2024-25/doc/Budget_at_Glance/budget_at_a_glance.pdf) reports FY22–23 actuals. | [CGA monthly reports](https://cga.nic.in/MonthlyReport/Published/3/2022-2023.aspx); [Finance Accounts archive](https://cga.nic.in/FinanceReport/Published/2022-2023.aspx). | BE, RE, and final annual actual are sourceable, subject to line-by-line metric mapping. |
| **2021–22** | [Budget 2021–22 portal](https://www.indiabudget.gov.in/budget2021-22/) supplies BE; [Budget 2022–23](https://www.indiabudget.gov.in/budget2022-23/) supplies RE; [Budget 2023–24 tables](https://www.indiabudget.gov.in/budget2023-24/doc/Budget_at_Glance/budget_at_a_glance.pdf) explicitly include FY21–22 actuals. | [CGA monthly reports](https://cga.nic.in/MonthlyReport/Published/9/2021-2022.aspx); [Finance Accounts archive](https://cga.nic.in/FinanceReport/Published/2021-2022.aspx). | BE, RE, and annual actual are sourceable. This is the oldest year in this first release, not a reason to widen the initial scope. |

The [CGA Accounts at a Glance archive](https://cga.nic.in/GlanceReport/Published/2023-2024.aspx) lists completed years, and the CGA Finance Accounts provide detailed annual receipts, expenditure, debt, and accounting statements. The [CGA monthly dashboard](https://cga.gov.in/MonthDashboardReport/Published/list.aspx) says progressive monthly data can be selected for any FY since 2015–16 from a downloadable Excel workbook. CGA describes its monthly accounts as provisional and subject to change. The dashboard is therefore accessible for historical analysis, but not yet a stable, year-by-year raw file feed equivalent to Arthrekha’s archived HTML/JSON refresh inputs.

### Estimate-state rules

- **BE** is the annual plan adopted with the original Budget release.
- **RE** is a later in-year forecast and remains a forecast, not actual expenditure or receipts.
- **Provisional actual** is the CGA compiled monthly or year-end account, explicitly unaudited and revisable.
- **Final/actual** should come from the released annual accounts or a subsequent Union Budget table labelled “Actuals”; retain the exact publication and table. A later actual may still be subject to accounting adjustments, so the source vintage matters.
- Never use a later source’s actual column to overwrite the original BE or RE. A year can have more than one BE release (notably FY24–25 interim and full Budget); preserve each release.

## 2. Metric coverage and reconstruction feasibility

Arthrekha’s registry has 44 metrics and its current processed FY26–27 file contains 84 observations, but metric IDs alone do not establish historical coverage. The Budget portal’s repeated tables support a defensible common annual series for major fiscal aggregates. Detail exists in additional documents, but each row needs an exact source-to-registry mapping before inclusion.

| Metric group in current registry | FY21–22 | FY22–23 | FY23–24 | FY24–25 | FY25–26 | Assessment |
|---|---|---|---|---|---|---|
| Revenue receipts, net tax revenue, non-tax revenue, non-debt capital receipts, total receipts, revenue/capital/total expenditure | BE, RE, Actual | BE, RE, Actual | BE, RE, Actual | BE, RE, Actual | BE, RE, provisional actual | **High** for values shown under matching Budget-at-a-Glance / annual-account headings. Keep total receipts distinct from non-borrowed receipts. |
| Fiscal, revenue, effective revenue, and primary deficits; interest payments | BE, RE, Actual | BE, RE, Actual | BE, RE, Actual | BE, RE, Actual | BE, RE, provisional actual | **High to medium.** Match rupee values to the same fiscal table. GDP percentages need the paired GDP vintage and must not be compared as though denominators were immutable. |
| Gross and major tax heads (corporation tax, taxes on income, GST, customs, Union excise, States’ share) | Budget detail; Actual needs exact row check | Budget detail; Actual needs exact row check | Budget detail and/or Actual columns | Budget detail and/or Actual columns | BE/RE detail; CGA month coverage varies | **Medium.** Usually available in Budget receipt tables, but verify naming, gross/net basis, and the devolution deduction in every source. |
| Major expenditure items and subsidies (pensions, defence, food, fertiliser, petroleum) | Budget detail; Actual needs exact row check | Budget detail; Actual needs exact row check | Budget detail and/or Actual columns | Budget detail and/or Actual columns | BE/RE detail; provisional account detail varies | **Medium.** Use identical named lines and accounting basis. Break out fertiliser variants only if the historical table supports a faithful aggregation. |
| Capital grants/effective capital expenditure; Central Sector and Centrally Sponsored Schemes | Budget documents, but exact coverage varies | Budget documents, but exact coverage varies | Budget documents, but exact coverage varies | Budget documents, but exact coverage varies | Current Budget detail | **Medium to low.** These are classification- and presentation-sensitive; include only after definition and component reconciliation by year. |
| Transfers, Finance Commission grants, tax devolution, other transfers, financing instruments | Budget/Receipt detail | Budget/Receipt detail | Budget/Receipt detail | Budget/Receipt detail | Budget/Receipt detail | **Medium to low.** Available in official detail, but changing categories, overlaps, and gross/net conventions make summary comparisons unsafe without a mapping record. |
| Nominal GDP and deficit-to-GDP ratios | Budget vintage available | Budget vintage available | Budget vintage available | Budget vintage available | Budget vintage available | **Medium.** Store GDP as its own observation with estimate vintage/release; calculate or present ratios only with an explicitly compatible denominator. |
| Monthly CGA provisional actuals for the ten current execution metrics | Dashboard workbook since FY15–16; archived monthly report pages | Same | Same | Same | Monthly reports and dashboard | **Source exists; extraction not production-ready.** Dashboard workbook can provide selected-period history, but its changing workbook and disclaimer require captured bytes, checksums, and manual reconciliation before loading. |

The first historical slice should be a **validated common core**, not all 44 metrics at once: receipts, expenditure, deficit measures, and interest payments where table definitions align. Add detail groups only after exact row-by-row mapping. Derived values (such as `non_borrowed_receipts`, execution rates, and ratios) must identify their input observation IDs and formula; a derived value does not count as a source-reported metric.

**Direct answer on same-definition reconstruction:** the core annual aggregates in the existing registry can be reconstructed for all five FYs from official sources, with annual BE/RE and annual actual available for FY21–22 through FY24–25, and BE/RE plus CGA provisional full-year actual for FY25–26. As of this research, FY25–26 must remain without a final/audited actual. The full set of 44 current metric IDs cannot yet be called consistently comparable across all five years: detail, transfers, programme classifications, definitions, and source table coverage require row-level validation before enabling each comparison.

## 3. Comparability risks

1. **Estimate-state mixing.** BE, RE, provisional actual, and final actual answer different questions. A chart must not label all four “spending” or silently choose whichever exists. A provisional FY25–26 actual is not a final annual actual.
2. **Release/vintage changes.** FY24–25 has an interim and a full Budget release. REs and prior-year actuals also appear in later Budget documents. A corrected or later publication can change figures without changing the FY.
3. **Metric naming is not a complete definition.** Current registry descriptions are canonical for FY26–27; historical documents may use a similar label for a different gross/net, included/excluded, or accounting basis. `metric` must be accompanied by a source-backed definition/version and coverage.
4. **GDP denominator revisions.** The Budget’s nominal GDP estimates may be revised across releases. Deficit ratios can move because the numerator, denominator, or both changed. Never combine an older deficit with the newest GDP series without identifying that calculation as a restated ratio.
5. **Fiscal classifications move.** Schemes, transfers, subsidies, ministries, and object/head classifications can be renamed, split, merged, or moved between accounting presentations. Covid-era food subsidy and off-budget financing are particular reasons to inspect source notes rather than infer continuity from a label.
6. **Gross versus net and additive identities.** `total_receipts`, `non_borrowed_receipts`, `tax_revenue_net`, `gross_tax_revenue`, and `state_share_of_taxes` are not substitutes. Preserve each source’s definition, check identities only where inputs are compatible, and mark derived values.
7. **Cumulative monthly accounts are provisional.** A CGA April–month value is cumulative YTD, not a monthly flow. Dashboard values may be corrected and CGA warns its timing/presentation can differ from other publications. Do not derive a monthly flow by subtraction unless the exact accounting scope and revision vintage of both cumulative observations match.
8. **Nominal rupees are not real growth.** Year-over-year comparisons of crore amounts are nominal. Do not imply inflation-adjusted change unless a separate, official, explicitly chosen deflator series and method are added.

Store a per-metric/per-year comparability status: `comparable`, `comparable_with_note`, or `not_comparable`, plus the source row, definition/version, rationale, and known break. Do not show a percentage change when the comparison status is `not_comparable`.

## 4. Proposed multi-year data architecture

The existing observation schema already stores `financialYear`, `periodType`, `period`, `estimateType`, `dataStatus`, `definitionId`, and per-observation source metadata. That is a useful base. The current data path remains one-FY: one processed JSON file is imported statically; the ingestion module derives one active FY from the clock/environment and globs only `cga_{activeFY}_*.json`; selectors such as `getBudgetEstimate` and `getLatestActual` do not take an FY argument. `sources.json` is a single array with current-year source records. Therefore the observation shape is multi-year-capable, but the processed-file loader, ingestion orchestration, selector contracts, release identity, and views are not.

Add historical support as a separate path so the verified current CGA refresh keeps its existing inputs and behavior:

```text
datasets/raw/union/{fy}/{source_id}/{release_id}/{sha256}.{ext}
datasets/raw/union/{fy}/{source_id}/{release_id}/provenance.json
datasets/processed/union/history/{fy}.json
datasets/metadata/source-manifests/{fy}.json
datasets/metadata/comparability.json
```

Suggested `source_id` values identify the publisher/document (for example `mof-budget-at-a-glance`); `release_id` identifies the publication vintage and estimate state (for example `budget-2025-26-full-be-2025-02-01`). Keep immutable raw PDFs/workbooks or captured official HTML in content-addressed paths with their SHA-256 hashes, so multiple captures of one logical release cannot overwrite earlier evidence. Structured transcription must preserve table/page/row references. Source manifests should be per source/release and enumerate metric coverage and captured hashes; the current `datasets/metadata/sources.json` can remain the active-year manifest.

Extend observation provenance/identity deliberately before multiple annual releases are stored. Today the deterministic observation ID keys on FY, period, metric, and estimate type, but not source release; interim/full Budget BE could collide. Add stable `sourceId`/`releaseId` to the key, while keeping raw-source hash in provenance metadata to detect byte changes without making rehosts new logical observations. Add `definitionVersion` or equivalent and preserve source wording separately from Arthrekha’s canonical interpretation. Include publication date, retrieval date, status, URL, table/page/row, notes, and input IDs/formula for derived observations.

Use a new explicit historical ingestion entry point (for example `ingest_history --fy 2025-26`) that reads only that year’s declared manifest and never uses `active_financial_year()` to infer a historical dataset. Keep raw source capture, parsing, normalization, and validation separate from publication. Each FY output should be reproducible from committed source artifacts and should validate duplicate keys, units, table mapping, estimate states, fiscal-year periods, known accounting identities, and source hashes. A manifest/index can list which FYs and estimate states are published; do not concatenate years into an ambiguous single file.

Retain the existing canonical `YYYY-YY` data field (for example `2025-26`) and fiscal calendar: April through March. Source portal labels may spell this as `2025-2026`; normalize that only in the FY field and keep the original document wording in provenance.

Refactor data access around explicit dimensions, e.g. `getObservation(metric, fy, estimateType, sourceId?)` and `getAvailableYears(metric?, estimateType?)`. Comparison results should carry both observations and an eligibility/status explanation. Historical BE/RE/actual and current CGA YTD must not share a generic “actual” selector.

Historical CGA workbook ingestion should be a later, separate adapter. Save the exact downloaded workbook and its hash, record selected FY/month, workbook retrieval time and CGA disclaimer, and validate extracted values against the corresponding official monthly report/account. Keep each month as cumulative `provisional` observations and preserve revised workbook snapshots rather than overwriting evidence. No automated refresh should be claimed until this capture/extraction path is repeatable.

## 5. JEV evaluation and selected approach

JEV scored three strategies from 1–5 across data integrity, official-source coverage, comparability, user value, implementation simplicity (higher = simpler), and maintenance simplicity (higher = lower burden). The figures below are the unweighted mean of the six per-dimension JEV scores; use them as a structured input, not as a substitute for source and architecture review.

| Rank | Strategy | Integrity | Official coverage | Comparability | User value | Implementation simplicity | Maintenance simplicity | Mean |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | Annual official snapshots first | 3.19 | 2.91 | 3.13 | 2.95 | 2.76* | 3.13 | **3.01** |
| 2 | Staged hybrid: annual snapshots first, historical CGA monthly series later | 2.77 | 2.62* | 2.67 | 2.67 | 1.73 | 1.89 | **2.39** |
| 3 | Historical CGA dashboard workbook first, annual budgets afterward | 1.11 | 1.18 | 1.03 | 1.16 | 0.96 | 0.95 | **1.07** |

`*` JEV marked the relevant result for review rather than automatic acceptance (annual implementation simplicity: confidence 0.62; staged-hybrid coverage: 0.68). Human review agrees both are feasible, while the hybrid and spreadsheet-first routes carry more extraction/maintenance work than their early value warrants.

**Selected: annual official snapshots first.** This gives a source-auditable comparison using stable published BE/RE/annual actual values, while limiting initial scope to shared definitions. The architecture should leave room for an optional monthly series after annual comparison is reliable; that future option does not expand this milestone into monthly ingestion. Do not fill missing values from RBI, private aggregators, or other third-party datasets merely to make charts continuous.

## 6. Proposed UX for year comparison

- Keep Home and Budget → Reality defaulted to the current FY and its existing annual BE versus provisional YTD experience.
- Add one compact “Fiscal year” control in Explore, initially set to the latest FY. A small “Compare years” action reveals a second-year selector; start with two years, with an optional “Add year” for a compact maximum of three.
- Keep existing metric/domain navigation. In compare mode show one aligned row/card per selected year for the same metric, with clear stage labels (for example “RE”, “Provisional actual”, “Final actual”) and source status. Missing states display “Not published”/“Not available”, never zero.
- Let users choose estimate state when multiple annual states exist. If a year has actual and estimates, present a concise state switch or labelled values rather than overlaying every series by default.
- In Budget → Reality, offer historical annual comparison as a deliberate secondary view: selected-year BE/RE against full-year actual for the same FY, or same-state annual actuals across years. Do not plot one FY’s YTD actual against another FY’s full-year actual without an explicit same-period mode.
- Show a small comparison note only where needed: “Provisional”, “definition changed”, “different GDP vintage”, or “not directly comparable”. Link each displayed value to the existing provenance drawer/evidence trace and official source.
- Preserve the current uncluttered default: one FY and one value stage until the user requests comparison; no permanent multi-year chart or new top-level navigation item.

## 7. Phased implementation plan

1. **Schema and comparison contract:** specify release-qualified observation identity, provenance hashes, definition versions, and comparison eligibility/status. Do not change CGA refresh workflows.
2. **FY 2025–26 source packet:** capture official BE, RE source document(s), and CGA provisional full-year accounts; document final-account absence. Record raw PDFs/HTML/workbook only for the sources actually used and transcribe a bounded common-core set.
3. **Historical ingestion and validation:** add an explicit-FY historical command/manifest path; validate row references, annual/accounting identities, units, status, duplicate release keys, and reproducibility from committed raw artifacts.
4. **FY 2025–26 proof review:** reconcile the extracted observations against each cited official table; confirm the dataset represents BE, RE, and provisional actual distinctly and has no final actual field/value. Expand to FY24–25 only after this review is successful.
5. **Remaining annual years:** add FY24–25, FY23–24, FY22–23, FY21–22 in that order, recording publication vintage and metric comparability decisions. Extend only metrics with evidence-backed mappings.
6. **Selectors and UI:** add FY/state-aware selectors, two-year comparison in Explore, and a secondary annual history mode in Budget → Reality. Keep current-year default behavior.
7. **Optional CGA monthly research spike:** capture one official workbook version and verify a single earlier FY/month against the matching CGA monthly publication. Decide from that evidence whether the ongoing workbook extraction and versioning cost is justified before implementation.

At initial plan authoring, no historical source data was added. Phase 2 below records the bounded FY 2025–26 proof case. Current-year CGA refresh architecture remains unchanged.

## Phase 1 implementation contract

Phase 1 adds only schema and comparison contracts; it does not add a historical index file, historical source manifest, directory, or fiscal observation. The current `FinancialObservation` wire format remains additive and the FY26–27 baseline continues to use identity version 1.

- `DataSource.definition` remains the wording supplied by the source. `canonicalDefinition` and `definitionVersion` describe Arthrekha’s normalized interpretation; the metric registry now exposes the canonical definition version (`1`) for mappings to record.
- The JSON parser accepts optional snake_case and camelCase release/hash, canonical-definition/version, and comparison-eligibility fields from a source packet. Existing raw files omit them and continue parsing as v1; this does not change active-FY routing or the CGA refresh workflow.
- Historical/release-qualified observations opt into `identityVersion: 2`. Its deterministic key is prefixed with `identity-v2` and adds `sourceId` and `releaseId` to the exact v1 key parts. V2 requires non-empty source and release IDs. `sourceHash` is provenance/integrity metadata, not semantic identity; when present it must be a 64-character hexadecimal SHA-256 digest. This keeps an observation ID stable when the same logical release is downloaded again or rehosted with different file metadata.
- A changed hash for an existing `(sourceId, releaseId)` is a source-revision signal that must be reviewed, not silently accepted as another observation. Until resolved, fail closed on a repeated semantic observation key with a different hash or value; do not publish it as an ordinary duplicate or rely on the current duplicate-ID warning. Keep captured source artifacts immutable and recoverable by their hashes. If the bytes are only a rehosted copy and fiscal content is unchanged, retain the logical release identity and record the capture provenance. If a corrected publication or changed values are accepted as a distinct release, assign a new explicit `releaseId`; retain the earlier artifact and observation. Historical reproduction uses the archived source artifact/hash and the same `sourceId` + `releaseId`, so regeneration preserves observation IDs. Never overwrite a prior raw capture in place.
- Identity version 1 retains the original key and hash algorithm byte-for-byte. The production dataset test reconstructs all stored FY26–27 observation IDs and verifies every existing derived-metric input ID still resolves. V1 leaves `identityVersion` off serialized legacy observations; v2 emits it. Tests cover identical downloads, differing artifact hashes for one release, and a corrected release with a distinct release ID.
- Estimate states are additive: existing `BE`, `RE`, `actual`, `provisional`, and `audited_actual` values remain valid, and `final_actual` is available for explicit final-source observations. No current state is renamed or migrated.
- Pairwise comparison requires both observations, the same metric ID, estimate state, period type/coverage, unit/currency, and compatible canonical definition/version. A documented per-observation eligibility can mark a pair `comparable_with_note` or reject it as `not_comparable`. Missing definition versions produce a note. The comparison result retains both observations, FYs, states, source/release IDs, status, and rationale. Percentage change is absent and disallowed for `not_comparable`; a zero left value also makes the percentage undefined.
- `getObservation` is exact and returns a record only when the requested metric/FY/state/release identifies one observation. If multiple releases or periods match without a release selector, it returns `null` rather than picking one. Legacy selectors keep defaulting to the loaded dataset FY, which is still FY26–27.
- `pipeline/historical_layout.py` and `HistoricalDatasetIndex` define path/index shapes only. Historical paths are `datasets/raw/union/{fy}/`, `datasets/processed/union/history/{fy}.json`, and `datasets/metadata/source-manifests/{fy}.json`, with `datasets/metadata/comparability.json` for mapping decisions. Helpers validate canonical consecutive `YYYY-YY` values and do not create directories or placeholder years.
- The remaining single-year assumptions are intentionally retained for later phases: `pipeline/parsers/json_parser.py` and `pipeline/scripts/ingest.py` derive one FY from `FINANCIAL_YEAR` and emit one active-year dataset; `src/data/budgetData.ts` statically imports only the 2026–27 processed JSON and exposes scalar dataset metadata; Explore/Home/Landing/Sources still contain current-year copy. The CGA refresh/check workflow remains scoped to the active year and is unchanged. New legacy selectors default to the loaded dataset’s FY, while the new exact-year APIs can query any years supplied by a future loader.

No departure from the annual-first strategy is needed. Historical UI, ingestion, current refresh workflows, and data publication remain outside Phase 1.

## Phase 2 implementation: FY 2025–26 source packet and common core

Phase 2 implements the FY 2025–26 proof case only. It adds no FY 2024–25 or earlier data and does not add historical UI or change the FY 2026–27 CGA refresh workflow. Historical ingestion is explicit: `python -m pipeline.scripts.ingest_history --fy 2025-26`; it never infers a historical FY from the current date.

### Official source packet

Artifacts are stored under `datasets/raw/union/2025-26/{sourceId}/{releaseId}/{sha256}.{ext}`. Each artifact has a `provenance.json` sidecar; the three observation sources also have a `transcription.json` with exact amounts and source row locators. All artifacts were retrieved on 2026-10-01. Duplicate mirrors were not added as separate releases.

| Use / estimate state | Stable source ID | Release ID | Publication evidence | Official source and SHA-256 |
|---|---|---|---|---|
| Original Budget Estimate (BE) | `mof-union-budget-at-a-glance` | `union-budget-2025-26-original-be-2025-02-01` | 2025-02-01; date corroborated by [Union Budget 2025–26 speech](https://www.indiabudget.gov.in/doc/bspeech/bs2025_26.pdf) | [Budget at a Glance, physical PDF p. 3 / printed p. 1](https://www.indiabudget.gov.in/budget2025-26/doc/Budget_at_a_Glance/budget_at_a_glance.pdf), `6a87eba82f17be65a32dc9d538a0026144db272d46a5f1338ed96b631ab290dc` |
| Revised Estimate (RE) for FY 2025–26 | `mof-union-budget-at-a-glance` | `union-budget-2026-27-re-2025-26-2026-02` | Union Budget 2026–27 publication, February 2026 | [Budget at a Glance, physical PDF p. 5 / printed p. 4](https://www.indiabudget.gov.in/doc/Budget_at_a_Glance/budget_at_a_glance.pdf), `c64dde0951fa592b3b3948a4686a610bf902b77f7ada1a8eb3c9a9b2c53b5789` |
| Provisional full-year actual | `cga-union-accounts-at-a-glance` | `union-provisional-accounts-2025-26-2026-03-31` | CGA order dated 2026-03-31; [CGA release notice](https://cga.nic.in/Circular/Published/7115.aspx) | [CGA Provisional Accounts 2025–26](https://cga.nic.in/writereaddata/MonthAccount/32026/DATA2526.htm), `c322781d2d4cbf65105941e846c1339c3ba044d4986620436f3bfce5364ea83c` |
| BE release-date evidence only | `mof-union-budget-speech` | `union-budget-2025-26-speech-2025-02-01` | 2025-02-01 | Official speech PDF, `6448cfdea5152338a1134cae3cc98ca8941e8ebc1bfa8479e091e5a803a356b0` |
| Final-actual availability check only | `cga-finance-accounts-archive-check` | `finance-accounts-fy-2025-26-availability-check-2026-10-01` | Retrieved 2026-10-01; archive page did not expose a verified FY 2025–26 Finance Accounts publication | [CGA Finance Accounts archive](https://cga.nic.in/FinanceReport/Published/2025-2026.aspx), `f519864cd9b452c916c023f48c1b5219c7d9e6fdce3741de3876f1ecad6d3e37` |

No official final/audited FY 2025–26 source was verified in this packet. The CGA source labels its year-end figures as provisional/unaudited. Therefore there are **zero `final_actual` observations**; the processed output records final actual as absent with the archive capture as evidence. Provisional CGA figures are not used as final actual.

### Common-core metric coverage and comparison notes

There are 12 source-reported metrics in each of the three states (36 observations total), all in ₹ crore. Every mapping has its source wording, canonical registry definition/version, source/release/hash, and source locator in the transcription and processed evidence map.

| Arthrekha metric | BE | RE | Provisional | Comparison decision |
|---|---:|---:|---:|---|
| `revenue_receipts` | 3,420,409 | 3,342,323 | 3,302,225 | Comparable |
| `tax_revenue_net` | 2,837,409 | 2,674,661 | 2,623,264 | Comparable; source label differs slightly in CGA (`Tax Revenue (Net)`) |
| `non_tax_revenue` | 583,000 | 667,662 | 678,961 | Comparable |
| `recovery_of_loans` | 29,000 | 30,190 | 24,617 | Comparable |
| `other_capital_receipts` | 47,000 | 33,837 | 59,140 | Comparable with note: source wording is “Other Receipts”; treated as non-debt capital receipts and combined only in explicit derived metrics |
| `revenue_expenditure` | 3,944,255 | 3,869,087 | 3,836,032 | Comparable; Budget calls this “On Revenue Account” |
| `capital_expenditure` | 1,121,090 | 1,095,755 | 1,069,119 | Comparable; Budget calls this “On Capital Account” |
| `total_expenditure` | 5,065,345 | 4,964,842 | 4,905,151 | Comparable |
| `interest_payments` | 1,276,338 | 1,274,338 | 1,242,575 | Comparable |
| `fiscal_deficit` | 1,568,936 | 1,558,492 | 1,519,169 | Comparable; computed/reported under aligned expenditure less non-borrowed receipts identity |
| `revenue_deficit` | 523,846 | 526,764 | 533,807 | Comparable |
| `primary_deficit` | 292,598 | 284,154 | 276,594 | Comparable |

The processed dataset contains an additional **six derived records**: `non_debt_capital_receipts` (recovery of loans + other receipts) and `non_borrowed_receipts` (revenue receipts + non-debt capital receipts), each for BE, RE, and provisional actual. Every derived value retains its formula and source observation IDs and is explicitly marked as not source-reported. The provisional derived values reconcile to CGA’s separately reported ₹83,757 crore non-debt capital receipts and ₹3,385,982 crore Total Receipts (1+4).

Excluded from the proof common core: `capital_receipts`, `borrowings_and_other_liabilities`, and Budget “Total Receipts (1+4)” because they include borrowing and do not match the canonical non-borrowed-receipts definition; `effective_revenue_deficit` because CGA’s annual summary gives a GDP ratio rather than a comparable exact crore row; `effective_capital_expenditure` / grants for capital assets because no safely aligned same-row CGA amount was included; and all other registry metrics without a matched row across all three releases. No value is filled from a third party.

### Schema, validation, trace, and output

The per-FY manifest is `datasets/metadata/source-manifests/2025-26.json`. It declares all five captured release/evidence artifacts, required source/release pairs, source hashes, retrieval/publication metadata, estimate states, expected observation counts, and final-actual absence. Its three observation-source directories contain structured transcriptions. The reproducible processed output is `datasets/processed/union/history/2025-26.json`.

The ingestion command fails closed on missing required files/releases, mismatched sidecars or SHA-256, wrong fiscal year, unsupported units, invalid state/metric, duplicate release-qualified keys, conflicting duplicate values, unverified PDF/HTML locators, and failed accounting identities. It verifies the exact PDF page/table row label and amount and the exact CGA HTML table row, then records per-metric trace status. The run verified all 36 paths from captured artifact to locator/value to transcription to normalized observation to processed evidence mapping; six derived mappings retain verified input evidence references.

Reconciliation results: **17/17 passed** — five core accounting identities for each of BE, RE, and provisional actual (total expenditure components, revenue deficit, fiscal deficit, primary deficit, and revenue receipts components), plus two independent CGA reported-versus-derived receipt checks. The processed output has 12 BE, 12 RE, 12 provisional, and 0 final-actual observations. All 36 use identity v2 with FY/source/release qualification; the committed FY 2026–27 observations and their identity-v1 IDs remain unchanged.

Schema details are additive: `DataSource.page` and `DataSource.row` carry locators, and `DerivedMetric.estimateType` carries each annual estimate state. Existing current selectors/Explore/Budget → Reality stay as before; historical UI remains a later phase. Exact-year selection and cross-year comparison contracts are implemented for loaded datasets. No refresh workflow was changed.

## FY 2024–25 implementation: multiple BE vintages and final annual actual

FY 2024–25 proves release-qualified identity within one estimate state. The Interim Budget and the later full Budget both remain separate `BE` observation sets. The processed release catalog and manifest designate the full Budget as the comparison default while preserving the Interim release for explicit selection. A BE lookup without `releaseId` returns `null` when both are present.

### Source packet and releases

Each official capture has its own immutable content-addressed artifact and provenance sidecar. The Interim and full Budget dates are evidenced by their respective official Budget speeches. The later FY 2025–26 Budget at a Glance is reused for FY24–25 RE under its existing logical publication identity and stored artifact; it is referenced by the FY24–25 manifest without a duplicate PDF capture. Retrieval date for captures: 2026-10-01. The Finance Accounts listing did not show a publication date for Statement No. 1, so its publication date remains unknown (`null`).

| FY24–25 state / evidence | `sourceId` | `releaseId` | Official artifact / locator | SHA-256 |
|---|---|---|---|---|
| Interim BE | `mof-union-budget-at-a-glance` | `union-interim-budget-2024-25-be-2024-02-01` | [Interim Budget at a Glance](https://www.indiabudget.gov.in/budget2024-25%28I%29/doc/Budget_at_Glance/bag1.pdf), physical p. 3 / printed p. 1; publication date corroborated by [Interim Budget speech](https://www.indiabudget.gov.in/doc/Budget2024_25%28I%29/Budget_Speech.pdf) | `d9d7886b7f2fbdc9a6fafbd4562a7906047c8bd1ab846889b135391fe335762e` |
| Interim date evidence | `mof-union-budget-speech` | `union-interim-budget-speech-2024-02-01` | Official speech PDF, 2024-02-01 | `7eac22566244da39dd171d8655616247c15f9fe6424067e0ef9bec5304d23f62` |
| Full Budget BE | `mof-union-budget-at-a-glance` | `union-full-budget-2024-25-be-2024-07-23` | [Full Union Budget at a Glance](https://www.indiabudget.gov.in/budget2024-25/doc/Budget_at_Glance/bag1.pdf), physical p. 3 / printed p. 1; publication date corroborated by [full Budget speech](https://www.indiabudget.gov.in/budget2024-25/doc/Budget_Speech.pdf) | `356fb4c90cc919ff578373c6dfc56e3115be2e6f49cc22a42f62094aae0b772d` |
| Full Budget date evidence | `mof-union-budget-speech` | `union-full-budget-speech-2024-07-23` | Official speech PDF, 2024-07-23 | `c50ea76c25d361c6854c26c013f0c96051c92d496bc0bcafdc19547271e85e0a` |
| FY24–25 RE | `mof-union-budget-at-a-glance` | `union-budget-2025-26-original-be-2025-02-01` | [Union Budget 2025–26 at a Glance](https://www.indiabudget.gov.in/budget2025-26/doc/Budget_at_a_glance/budget_at_a_glance.pdf), physical p. 3 / printed p. 1; FY24–25 RE column. This is the same captured release used for FY25–26 BE. | `6a87eba82f17be65a32dc9d538a0026144db272d46a5f1338ed96b631ab290dc` |
| Final actual | `cga-union-finance-accounts` | `union-finance-accounts-2024-25-final` | [CGA Finance Accounts, Statement No. 1 — Summary of Transactions](https://cga.gov.in//writereaddata/file/Fin20242025Statement1.pdf), with exact statement/page/row locators in each evidence mapping. Official [CGA FY24–25 Finance Accounts listing](https://cga.nic.in/FinanceReport/Published/2024-2025.aspx) identifies the annual-account publication. | `956fe3121e4e057036e7fa781f28ebbab07a0fc468d520bddcbc63085a34b3b1` |
| Finance Accounts listing evidence | `cga-finance-accounts-archive` | `finance-accounts-fy-2024-25-listing-2026-10-01` | CGA archive listing captured 2026-10-01; publication date not displayed in captured listing | `260c1dad7634c8366ff5c8811a4a3a5b0c72662fb2bf301331095c0caff56ed3` |

### Common-core coverage and source amounts

All budget amounts are ₹ crore and are read from the FY24–25 column in the specified release. The final actual rows are from CGA Finance Accounts and retain its two-decimal precision. “Derived” means the source does not report one aggregate row; the processed result retains its input IDs and formula.

| Metric | Interim BE | Full Budget BE | RE | Final actual |
|---|---:|---:|---:|---:|
| `revenue_receipts` | 3,001,275 | 3,129,200 | 3,087,960 | 3,422,438.19 |
| `tax_revenue_net` | 2,601,574 | 2,583,499 | 2,556,960 | 2,509,496.28 |
| `non_tax_revenue` | 399,701 | 545,701 | 531,000 | 912,255.25 |
| `recovery_of_loans` | 29,000 | 28,000 | 26,000 | 172,778.25 |
| `other_capital_receipts` | 50,000 | 50,000 | 33,000 | 20,214.02 |
| `revenue_expenditure` | 3,654,657 | 3,709,401 | 3,698,058 | 3,987,373.71 |
| `capital_expenditure` | 1,111,111 | 1,111,111 | 1,018,429 | 858,256.01 |
| `total_expenditure` | 4,765,768 | 4,820,512 | 4,716,487 | 4,845,629.72 (derived) |
| `interest_payments` | 1,190,440 | 1,162,940 | 1,137,940 | 1,161,521.23 |
| `fiscal_deficit` | 1,685,494 | 1,613,312 | 1,569,527 | Absent: no exact aligned final row |
| `revenue_deficit` | 653,383 | 580,201 | 610,098 | 564,935.52 |
| `primary_deficit` | 495,054 | 450,372 | 431,587 | Absent: no exact final row |

There are 24 BE observations (12 per release), 12 RE observations, and 9 final-actual source observations. The final-actual `total_expenditure` is an additional derived record from final revenue and capital expenditure. The two receipt aggregates (`non_debt_capital_receipts` and `non_borrowed_receipts`) are derived per release where their source components exist: four BE, two RE, and two final-actual records. In total, this FY has 45 source observations and 9 derived records. No provisional FY24–25 observation is present; no `final_actual` is manufactured from provisional data.

### Comparability and accounting decisions

- Interim and full BE are both represented, with different IDs for the same metric/state because v2 identity includes `sourceId` and `releaseId`. The full Budget is an explicit `defaultComparisonReleaseByState.BE`; callers still must request its release ID or get an ambiguity result.
- FY24–25 Interim BE rows carry `comparable_with_note`: the Interim publication notes that rounded component rows may not sum to totals. Two checks differ by exactly ₹1 crore—revenue deficit and fiscal deficit—and pass only with the recorded one-crore tolerance. The source values are retained as printed; no row is adjusted.
- Full Budget BE and RE share the FY25–26 common-core definitions and can be compared to the corresponding FY25–26 BE and RE. Cross-year comparison tests select the full Budget BE explicitly. The Interim BE remains eligible with its rounding rationale attached.
- CGA Finance Accounts show final tax and expenditure actuals in the audited annual account. Revenue receipts reconcile to net tax revenue + non-tax revenue + a separately reported ₹686.66 crore in grants-in-aid/contributions. Budget AGlance omits this small grants row, so the actual receipt components are reconciled with that explicit source adjustment and receive a basis note. Final-account recovery of loans is reported under `F—Loans and Advances`, and comparisons retain a CGA accounting-basis note.
- Final actual `fiscal_deficit` and `primary_deficit` remain absent. Statement No. 1 has no exact fiscal-deficit row matching Budget AGlance’s expenditure less non-borrowed receipts presentation; calculating the gap from the Finance Accounts totals gives a different basis and is not treated as that metric. Primary deficit is also absent because it depends on the missing aligned fiscal-deficit value. Final actual total expenditure is derived from final revenue and capital expenditure, not relabelled as source-reported.
- No “Total Receipts (1+4)” row is mapped to non-borrowed receipts. The source row includes financing and is not the same definition. Other unaligned registry metrics, including effective revenue deficit and effective capital expenditure, are excluded.

The FY24–25 source manifest is `datasets/metadata/source-manifests/2024-25.json`; its processed output is `datasets/processed/union/history/2024-25.json`. The explicit command is `python -m pipeline.scripts.ingest_history --fy 2024-25`. The source packet has seven declared official artifacts/evidence releases; three release-date/listing items are evidence-only. Structured transcriptions live beneath each FY/source/release directory. The FY25–26 RE artifact is referenced at its existing FY25–26 hash-addressed path and is not copied into a second logical release.

Validation verifies artifact and sidecar hashes, release-qualified keys, exact PDF page and row/value windows, units and estimate states, per-release counts, and source-present accounting identities. Source-to-output tracing passed for all 45 source observations. There are 18 reconciliations: 5 each for Interim BE, full BE, and RE; 3 final-actual checks. Both Interim one-crore rounding differences are recorded and tolerated; final revenue receipts are reconciled using an independently locator-verified ₹686.66 crore grants-in-aid row; all other tested identities match exactly. All 45 observations use identity v2. The full Budget BE is the only BE default in the processed release catalog.

The reproducible FY24–25 processed output has SHA-256 `3c779a8c699656689eda0a51ab6aa3ce6e893805c9be248047de8a0b2eb055a1`. The FY25–26 processed historical output remains byte-identical at SHA-256 `b3790e0f8625217c8a78930560e1df09bfe6af606d2c0587f3675dd29da7f87e`. FY26–27 v1 production IDs and dataset are unchanged. Historical data is fetched on demand by exact-year selectors for comparison, while legacy selectors and Explore/Budget → Reality remain filtered to the current FY. No historical UI has been added, and the CGA refresh architecture is unchanged.

## Historical payload bundle-boundary investigation

The production warning was caused by the two static imports of `datasets/processed/union/history/2024-25.json` and `2025-26.json` in `src/data/budgetData.ts`. Both full processed objects—including observations and evidence mappings—were in the initial JavaScript module graph. The current FY dataset remains a static import by design. No raw captures or source-manifest files were imported by the frontend; the manifest and raw directories were not reachable through application imports.

Measured with the same installed Vite toolchain:

| Build | Main JS (Vite report) | Gzip | Notes |
|---|---:|---:|---|
| Git `HEAD`, before historical support | 361.76 kB | 99.44 kB | Baseline app and current-FY data |
| Current app code with only the two historical JSON imports removed in an isolated copy | 362.38 kB | 99.59 kB | Measures selector/loader code without historical payload |
| Before fix, historical datasets statically imported | 541.60 kB | 111.37 kB | Triggered the >500 kB warning; +179.22 kB versus the same app without those imports |
| After fix | 364.40 kB | 100.30 kB | Below warning threshold; +2.64 kB versus pre-history baseline |

The two historical JSON files are 241,804 bytes combined in their processed source form. The build now emits them separately at `dist/data/history/{fy}.json` (Vite reports 139.88 kB for FY24–25 and 101.25 kB for FY25–26), alongside the two source manifests and a small index. The post-build verifier checks that release-specific sentinel IDs are absent from every JS chunk and that each indexed data/manifest asset exists and carries the indexed FY.

`datasets/metadata/historical-index.json` is the explicit year-to-asset contract. The Vite asset plugin validates each entry and emits only the processed JSON and per-year manifest as static assets. At runtime the loader requests the small index when historical access is requested, then fetches only the exact requested FY. It caches that FY separately, rejects unknown years and failed/mismatched responses, and never selects another year as a fallback. The same routes are served by the Vite development server. Current FY selectors remain synchronous and do not initiate a historical fetch. Async historical selectors preserve estimate-state and release-qualified ambiguity behavior.
