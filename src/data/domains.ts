import type { FinancialDomain, MetricId } from './metricDefinitions';

export interface FiscalDomainDefinition {
  id: FinancialDomain;
  label: string;
  eyebrow: string;
  question: string;
  description: string;
  featuredMetrics: MetricId[];
}

export const FISCAL_DOMAINS: FiscalDomainDefinition[] = [
  {
    id: 'receipts',
    label: 'Money In',
    eyebrow: 'Receipts',
    question: 'How does the Union Government receive money?',
    description: 'Trace recurring revenue, capital receipts, taxes and the point at which borrowing enters the picture.',
    featuredMetrics: ['revenue_receipts', 'gross_tax_revenue', 'tax_revenue_net', 'non_tax_revenue', 'non_debt_capital_receipts', 'capital_receipts'],
  },
  {
    id: 'expenditure',
    label: 'Money Out',
    eyebrow: 'Expenditure',
    question: 'What is the Union Government planning to spend?',
    description: 'Move from the total to revenue, capital, effective capital expenditure and major spending classifications.',
    featuredMetrics: ['total_expenditure', 'revenue_expenditure', 'capital_expenditure', 'effective_capital_expenditure', 'interest_payments', 'pensions'],
  },
  {
    id: 'deficit',
    label: 'Deficit',
    eyebrow: 'Fiscal balance',
    question: 'Where is the gap—and what exactly does it measure?',
    description: 'Separate fiscal, revenue, effective revenue and primary deficits instead of treating “the deficit” as one number.',
    featuredMetrics: ['fiscal_deficit', 'revenue_deficit', 'effective_revenue_deficit', 'primary_deficit'],
  },
  {
    id: 'debt',
    label: 'Debt & Borrowing',
    eyebrow: 'Financing',
    question: 'How is the annual financing requirement met?',
    description: 'Explore borrowing flows without confusing them with the outstanding stock of government debt.',
    featuredMetrics: ['borrowings_and_other_liabilities', 'debt_receipts_net', 'market_borrowings_net', 'short_term_borrowing', 'external_debt_net'],
  },
  {
    id: 'federal',
    label: 'Federal Finance',
    eyebrow: 'Union → States',
    question: 'How do resources move through India’s federal system?',
    description: 'Distinguish tax devolution, Finance Commission grants, scheme transfers and the broader transfer aggregate.',
    featuredMetrics: ['total_transfers_states_uts', 'tax_devolution_states', 'finance_commission_grants', 'centrally_sponsored_schemes'],
  },
];

export function getFiscalDomain(domain: FinancialDomain): FiscalDomainDefinition | null {
  return FISCAL_DOMAINS.find(item => item.id === domain) ?? null;
}
