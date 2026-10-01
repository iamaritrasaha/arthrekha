/**
 * Core financial data types for Arthrekha
 *
 * All amounts are stored in ₹ crore internally.
 * Display formatting happens at render time.
 */

// Jurisdiction types
export type JurisdictionType = "union" | "state" | "ut";

// Time period types
export type PeriodType = "annual" | "quarterly" | "monthly" | "cumulative" | "ytd";

// Estimate types - critical for budget analysis
export type EstimateType = "BE" | "RE" | "actual" | "provisional" | "audited_actual" | "final_actual";

// Data quality status
export type DataStatus = "final" | "provisional" | "estimated" | "derived" | "audited";
export type ComparisonStatus = "comparable" | "comparable_with_note" | "not_comparable";

export interface ComparisonEligibility {
  status: ComparisonStatus;
  rationale?: string;
}

/**
 * DataSource - Provenance information for every observation
 * This is a first-class feature: every number must be traceable
 */
export interface DataSource {
  sourceId?: string;             // Stable source identity, independent of FY
  releaseId?: string;            // Specific publication/release vintage
  sourceHash?: string;           // SHA-256 of the preserved source bytes
  organization: string;        // "Ministry of Finance"
  document: string;            // "Union Budget 2025-26 — Expenditure Budget"
  url?: string | null;         // Direct link to source document
  table?: string | null;       // "Statement 1" or page reference
  page?: string | null;
  row?: string | null;
  publishedAt?: string | null; // ISO date when source published
  retrievedAt: string;         // ISO date when we retrieved/transcribed
  dataStatus: DataStatus;      // Quality indicator
  notes?: string | null;       // Any clarifications
  definition?: string | null;  // Source wording/definition; not the canonical Arthrekha definition
}

/**
 * FinancialObservation - The atomic unit of fiscal data
 *
 * Every data point in Arthrekha is represented as a FinancialObservation.
 * This schema is designed to support Union Government now and states later.
 */
export interface FinancialObservation {
  // Unique identifier (deterministic hash of key fields)
  id: string;

  // Jurisdiction
  jurisdiction: string;              // "india" | "west-bengal" | "karnataka"
  jurisdictionType: JurisdictionType;

  // Time
  financialYear: string;             // "2025-26" format
  period?: string;                   // "apr-jul" | "q1" | "full-year"
  periodType: PeriodType;

  // Classification
  metric: string;                    // "total-expenditure" | "capital-expenditure"
  category?: string;                 // "ministry-of-defence" | "income-tax"
  subcategory?: string;              // More granular classification

  // Value (always in ₹ crore)
  amount: number;
  unit: "crore";
  currency: "INR";

  // Estimate type
  estimateType: EstimateType;

  // Definition safety for deeper fiscal and debt series
  definitionId?: string;
  coverage?: string;
  classificationType?: string;
  parentMetric?: string;
  debtCategory?: string;
  ratioDenominator?: string;

  // Versioned meaning and pairwise comparison guardrails. Optional for the
  // frozen FY 2026-27 baseline; required as historical definitions are mapped.
  canonicalDefinition?: string;
  definitionVersion?: string;
  comparisonEligibility?: ComparisonEligibility;
  identityVersion?: 1 | 2;

  // Provenance
  source: DataSource;
}

/**
 * DerivedMetric - Calculated values with explicit formulas
 * E.g., execution rate, year-over-year change, GDP ratios
 */
export interface DerivedMetric {
  metric: string;
  formula: string;               // Human-readable formula
  inputs: string[];              // IDs of source observations
  value: number;
  unit: string;
  description?: string;
  financialYear?: string;
  estimateType?: EstimateType;
}

/**
 * A comparison preserves both source observations and makes eligibility
 * explicit. `percentageChange` is omitted for not-comparable pairs.
 */
export interface ObservationComparison {
  left: FinancialObservation | null;
  right: FinancialObservation | null;
  metric: string;
  leftFinancialYear: string | null;
  rightFinancialYear: string | null;
  leftEstimateType: EstimateType | null;
  rightEstimateType: EstimateType | null;
  leftSourceId: string | null;
  rightSourceId: string | null;
  leftReleaseId: string | null;
  rightReleaseId: string | null;
  status: ComparisonStatus;
  rationale: string;
  percentageChangePermitted: boolean;
  percentageChange?: number;
}

/**
 * Structural index contract for future year-partitioned processed data.
 * No index or historical-year entries are created in this phase.
 */
export interface HistoricalDatasetIndex {
  schemaVersion: 1;
  datasets: Array<{
    financialYear: string;
    path: string;
    sourceManifestPath: string;
  }>;
}

/**
 * GDPReference - GDP/GSDP values for ratio calculations
 */
export interface GDPReference {
  jurisdiction: string;
  jurisdictionType: JurisdictionType;
  financialYear: string;
  nominalGDP: number;            // ₹ crore
  estimateType: "advance" | "first-revised" | "second-revised" | "final";
  source: DataSource;
}

/**
 * BudgetSummary - Aggregated view for a financial year
 * Used for overview pages and ₹100 mode
 */
export interface BudgetSummary {
  jurisdiction: string;
  jurisdictionType: JurisdictionType;
  financialYear: string;

  totalExpenditure: FinancialObservation;
  revenueExpenditure: FinancialObservation;
  capitalExpenditure: FinancialObservation;

  totalReceipts: FinancialObservation;
  revenueReceipts: FinancialObservation;
  capitalReceipts: FinancialObservation;

  taxRevenue: FinancialObservation;
  nonTaxRevenue: FinancialObservation;

  borrowings: FinancialObservation;

  fiscalDeficit: FinancialObservation;
  revenueDeficit: FinancialObservation;
  primaryDeficit: FinancialObservation;

  interestPayments?: FinancialObservation;

  // GDP reference for ratios
  gdp?: GDPReference;
}

/**
 * ExpenditureByCategory - Ministry or sector breakdown
 */
export interface ExpenditureByCategory {
  jurisdiction: string;
  financialYear: string;
  estimateType: EstimateType;

  categories: Array<{
    name: string;
    observation: FinancialObservation;
  }>;

  total: FinancialObservation;
}

/**
 * ExecutionData - Budget vs actual tracking
 */
export interface ExecutionData {
  jurisdiction: string;
  financialYear: string;
  asOfPeriod: string;              // "apr-jul" | "q2"

  budgetEstimate: FinancialObservation;
  actualToDate: FinancialObservation;

  // Derived
  executionRate: number;           // Percentage
  samePeriodLastYear?: FinancialObservation;

  lastUpdated: string;             // ISO date
}

/**
 * TimeSeriesData - Historical trends
 */
export interface TimeSeriesData {
  jurisdiction: string;
  metric: string;

  observations: FinancialObservation[];

  // Optional GDP series for ratio calculations
  gdpSeries?: GDPReference[];
}

/**
 * DebtData - Public debt information
 */
export interface DebtData {
  jurisdiction: string;
  financialYear: string;
  period?: string;

  totalDebt: FinancialObservation;
  internalDebt?: FinancialObservation;
  externalDebt?: FinancialObservation;

  interestPayments: FinancialObservation;

  gdp?: GDPReference;
}
