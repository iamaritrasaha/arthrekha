/**
 * Metric Definitions Registry
 *
 * Display names, explanations, and metadata for fiscal metrics.
 * Mirrors the Python metric registry but adapted for frontend use.
 */

export interface MetricDefinition {
  id: string;
  displayName: string;
  shortDescription: string;
  longDescription: string;
  category: 'receipts' | 'expenditure' | 'deficit' | 'debt' | 'other';
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  // RECEIPTS
  revenue_receipts: {
    id: 'revenue_receipts',
    displayName: 'Revenue Receipts',
    shortDescription: 'Money the government receives without creating debt',
    longDescription:
      'Revenue receipts include all money the government receives that does not create a liability (debt). This primarily includes tax revenue and non-tax revenue like dividends from public sector enterprises.',
    category: 'receipts',
  },

  tax_revenue_net: {
    id: 'tax_revenue_net',
    displayName: 'Tax Revenue (Net to Centre)',
    shortDescription: 'Tax collections after sharing with states',
    longDescription:
      "Tax revenue is what the government collects through various taxes (income tax, GST, customs duties, etc.). 'Net to Centre' means after the Centre's share of taxes has been distributed to state governments as per the Finance Commission formula.",
    category: 'receipts',
  },

  non_tax_revenue: {
    id: 'non_tax_revenue',
    displayName: 'Non-Tax Revenue',
    shortDescription: 'Government income from sources other than taxes',
    longDescription:
      'Non-tax revenue includes dividends from public sector companies, interest receipts, fees, fines, and receipts from services provided by the government. This does not include borrowing or disinvestment.',
    category: 'receipts',
  },

  non_debt_capital_receipts: {
    id: 'non_debt_capital_receipts',
    displayName: 'Non-Debt Capital Receipts',
    shortDescription: 'Capital receipts that do not create debt',
    longDescription:
      'Capital receipts from sources other than borrowing. This primarily includes proceeds from disinvestment (selling government stakes in public companies) and recovery of loans given by the government.',
    category: 'receipts',
  },

  total_receipts: {
    id: 'total_receipts',
    displayName: 'Total Receipts',
    shortDescription: 'All government receipts excluding borrowing',
    longDescription:
      'The total of all receipts the government receives, excluding borrowed funds. This equals revenue receipts plus non-debt capital receipts. The gap between total receipts and total expenditure is the fiscal deficit.',
    category: 'receipts',
  },

  // EXPENDITURE
  revenue_expenditure: {
    id: 'revenue_expenditure',
    displayName: 'Revenue Expenditure',
    shortDescription: 'Day-to-day operating expenses of government',
    longDescription:
      "Revenue expenditure includes all spending that does not create assets. This covers salaries, pensions, interest payments, subsidies, and operating expenses. It's the government's 'running costs'.",
    category: 'expenditure',
  },

  capital_expenditure: {
    id: 'capital_expenditure',
    displayName: 'Capital Expenditure',
    shortDescription: 'Spending that creates long-term assets',
    longDescription:
      'Capital expenditure is spending on infrastructure and assets like roads, bridges, buildings, and equipment. This also includes loans to states and public enterprises for capital projects.',
    category: 'expenditure',
  },

  total_expenditure: {
    id: 'total_expenditure',
    displayName: 'Total Expenditure',
    shortDescription: 'All government spending',
    longDescription:
      'The total of all government spending, including both revenue expenditure (day-to-day costs) and capital expenditure (infrastructure and assets). This is what the government plans to spend during the financial year.',
    category: 'expenditure',
  },

  interest_payments: {
    id: 'interest_payments',
    displayName: 'Interest Payments',
    shortDescription: 'Cost of servicing government debt',
    longDescription:
      'Interest payments are what the government pays to service its accumulated debt. This is a major component of revenue expenditure. The difference between fiscal deficit and interest payments is the primary deficit.',
    category: 'expenditure',
  },

  // DEFICITS
  fiscal_deficit: {
    id: 'fiscal_deficit',
    displayName: 'Fiscal Deficit',
    shortDescription: 'Gap between government spending and non-borrowed receipts',
    longDescription:
      'Fiscal deficit is total expenditure minus total receipts (excluding borrowing). It represents how much the government needs to borrow. A positive fiscal deficit means expenditure exceeds receipts. Formula: Total Expenditure - Total Receipts (excluding borrowing)',
    category: 'deficit',
  },
};

/**
 * Get metric definition by ID
 */
export function getMetricDefinition(metricId: string): MetricDefinition | null {
  return METRIC_DEFINITIONS[metricId] ?? null;
}

/**
 * Get metrics by category
 */
export function getMetricsByCategory(
  category: 'receipts' | 'expenditure' | 'deficit'
): MetricDefinition[] {
  return Object.values(METRIC_DEFINITIONS).filter(m => m.category === category);
}
