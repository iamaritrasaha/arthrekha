export type FinancialDomain = 'receipts' | 'expenditure' | 'deficit' | 'debt' | 'federal' | 'accounts';
export type ClassificationType = 'aggregate' | 'component' | 'deduction' | 'financing-source' | 'transfer' | 'denominator';

export interface ProgressiveExplanation {
  short: string;
  simple: string;
  whyItMatters: string;
  technical: string;
}

export interface MetricDefinition {
  id: string;
  displayName: string;
  shortName?: string | undefined;
  domain: FinancialDomain;
  category: FinancialDomain;
  classificationType: ClassificationType;
  parentMetric?: string | undefined;
  unitType: 'crore';
  estimateStates: Array<'BE' | 'RE' | 'actual' | 'provisional'>;
  explanation: ProgressiveExplanation;
  formula?: string | undefined;
  caveats: string[];
  relatedMetrics: string[];
  compatibleRatios: string[];
  shortDescription: string;
  longDescription: string;
}

interface MetricOptions {
  shortName?: string;
  parentMetric?: string;
  classificationType?: ClassificationType;
  formula?: string;
  caveats?: string[];
  relatedMetrics?: string[];
  compatibleRatios?: string[];
}

function metric<TId extends string>(
  id: TId,
  displayName: string,
  domain: FinancialDomain,
  short: string,
  simple: string,
  whyItMatters: string,
  technical: string,
  options: MetricOptions = {},
): MetricDefinition & { id: TId } {
  const explanation = { short, simple, whyItMatters, technical };
  return {
    id,
    displayName,
    shortName: options.shortName,
    domain,
    category: domain,
    classificationType: options.classificationType ?? (options.parentMetric ? 'component' : 'aggregate'),
    parentMetric: options.parentMetric,
    unitType: 'crore',
    estimateStates: ['BE', 'RE', 'actual', 'provisional'],
    explanation,
    formula: options.formula,
    caveats: options.caveats ?? [],
    relatedMetrics: options.relatedMetrics ?? [],
    compatibleRatios: options.compatibleRatios ?? [],
    shortDescription: short,
    longDescription: simple,
  };
}

export const METRIC_DEFINITIONS = {
  revenue_receipts: metric('revenue_receipts', 'Revenue Receipts', 'receipts', 'Recurring receipts that do not create liabilities.', 'This is money arriving through taxes and non-tax sources, rather than through borrowing.', 'It shows how much recurring income is available before the government turns to financing.', 'Revenue receipts comprise tax revenue net to Centre and non-tax revenue.', { relatedMetrics: ['tax_revenue_net', 'non_tax_revenue', 'revenue_expenditure'] }),
  gross_tax_revenue: metric('gross_tax_revenue', 'Gross Tax Revenue', 'receipts', 'Union tax collections before deductions and sharing with states.', 'This is the tax pool before the States’ share and specified transfers are taken out.', 'It separates the scale of taxes raised from the amount retained by the Union.', 'Gross tax revenue aggregates the principal Union taxes before deductions used to derive tax revenue net to Centre.', { parentMetric: 'revenue_receipts', relatedMetrics: ['tax_revenue_net', 'state_share_of_taxes'] }),
  tax_revenue_net: metric('tax_revenue_net', 'Tax Revenue (Net to Centre)', 'receipts', 'Tax revenue retained by the Union after sharing and deductions.', 'It is the part of Union tax collections that remains with the Union Government.', 'The difference from gross tax revenue is central to understanding federal tax sharing.', 'Centre’s net tax revenue equals gross tax revenue less the States’ share and other specified transfers.', { shortName: 'Net Tax Revenue', parentMetric: 'revenue_receipts', relatedMetrics: ['gross_tax_revenue', 'state_share_of_taxes', 'non_tax_revenue'] }),
  corporation_tax: metric('corporation_tax', 'Corporation Tax', 'receipts', 'Tax collected on company profits.', 'Companies pay this tax on taxable profits under the applicable law.', 'It is one of the largest direct-tax components of gross tax revenue.', 'Corporation tax is reported as a component of gross tax revenue.', { parentMetric: 'gross_tax_revenue' }),
  income_tax: metric('income_tax', 'Taxes on Income', 'receipts', 'Taxes on income other than corporation tax.', 'This line mainly reflects taxes paid on individual and other non-corporate income.', 'Its scale helps explain the direct-tax composition of Union receipts.', 'The Budget at a Glance reports Taxes on Income as a component of gross tax revenue.', { shortName: 'Income Tax', parentMetric: 'gross_tax_revenue' }),
  gst: metric('gst', 'Goods and Services Tax', 'receipts', 'Union GST receipts in the gross-tax presentation.', 'GST is a broad tax on supplies of goods and services, collected through the GST system.', 'It is a major indirect-tax source, but Union and State GST flows must not be treated as one interchangeable total.', 'The source reports the Union GST component within gross tax revenue.', { shortName: 'GST', parentMetric: 'gross_tax_revenue', caveats: ['This observation is the Union Budget classification, not total GST collected by all governments.'] }),
  customs: metric('customs', 'Customs', 'receipts', 'Taxes collected on international trade.', 'Customs duties apply to specified imports and exports under the customs framework.', 'They connect fiscal receipts with trade flows and tariff policy.', 'Customs is reported as a component of gross tax revenue.', { parentMetric: 'gross_tax_revenue' }),
  union_excise_duties: metric('union_excise_duties', 'Union Excise Duties', 'receipts', 'Union excise receipts on specified domestic goods.', 'These duties continue on selected products under the post-GST tax structure.', 'They remain a material indirect-tax source and should not be confused with GST.', 'Union excise duties are reported as a component of gross tax revenue.', { parentMetric: 'gross_tax_revenue' }),
  state_share_of_taxes: metric('state_share_of_taxes', 'States’ Share of Taxes', 'federal', 'The States’ share deducted from gross Union tax revenue.', 'Part of the divisible tax pool is devolved to States rather than retained by the Union.', 'It connects national tax collection with India’s federal fiscal system.', 'The Budget deducts the States’ share from gross tax revenue when deriving tax revenue net to Centre.', { parentMetric: 'gross_tax_revenue', classificationType: 'deduction', relatedMetrics: ['tax_devolution_states', 'tax_revenue_net'] }),
  non_tax_revenue: metric('non_tax_revenue', 'Non-Tax Revenue', 'receipts', 'Recurring government receipts from sources other than taxes.', 'This includes items such as dividends, interest, fees and service receipts.', 'It diversifies recurring revenue beyond taxation.', 'Non-tax revenue is the non-tax component of revenue receipts.', { parentMetric: 'revenue_receipts', relatedMetrics: ['tax_revenue_net'] }),
  capital_receipts: metric('capital_receipts', 'Capital Receipts', 'receipts', 'Receipts that affect assets or liabilities.', 'This group includes non-debt receipts as well as borrowing and other liabilities.', 'It shows how the government finances activity beyond recurring revenue.', 'Capital receipts comprise non-debt receipts and debt-related financing in the Budget classification.', { relatedMetrics: ['non_debt_capital_receipts', 'borrowings_and_other_liabilities'] }),
  recovery_of_loans: metric('recovery_of_loans', 'Recovery of Loans', 'receipts', 'Repayment of loans previously extended by government.', 'When borrowers repay government loans, the amount returns as a non-debt capital receipt.', 'It raises resources without creating a new liability.', 'Recovery of loans is a component of non-debt capital receipts.', { parentMetric: 'non_debt_capital_receipts' }),
  other_capital_receipts: metric('other_capital_receipts', 'Other Capital Receipts', 'receipts', 'Other non-debt receipts recorded on capital account.', 'This line captures capital receipts outside loan recoveries in the Budget summary.', 'Its composition can change, so the source classification matters.', 'Other receipts is reported separately within capital receipts in Budget at a Glance.', { parentMetric: 'non_debt_capital_receipts', caveats: ['Consult the Receipt Budget for the detailed composition of this aggregate.'] }),
  non_debt_capital_receipts: metric('non_debt_capital_receipts', 'Non-Debt Capital Receipts', 'receipts', 'Capital receipts that do not create new debt.', 'These mainly combine loan recoveries with other capital receipts.', 'They finance expenditure without adding an equivalent borrowing liability.', 'Non-debt capital receipts equal recovery of loans plus other capital receipts in this summary.', { parentMetric: 'capital_receipts', formula: 'Recovery of loans + Other capital receipts', relatedMetrics: ['recovery_of_loans', 'other_capital_receipts'] }),
  borrowings_and_other_liabilities: metric('borrowings_and_other_liabilities', 'Borrowings and Other Liabilities', 'debt', 'Financing that creates liabilities or uses cash balances.', 'This is the financing side that closes the gap between non-borrowed receipts and expenditure.', 'It connects the fiscal deficit to the government’s financing requirement.', 'The Budget line includes borrowings and other liabilities and includes drawdown of cash balance.', { parentMetric: 'capital_receipts', classificationType: 'financing-source', relatedMetrics: ['fiscal_deficit', 'debt_receipts_net'], caveats: ['This is a financing aggregate, not a stock measure of government debt.'] }),
  non_borrowed_receipts: metric('non_borrowed_receipts', 'Non-Borrowed Receipts', 'receipts', 'Revenue receipts plus non-debt capital receipts.', 'This is incoming money available before borrowing is counted.', 'Comparing it with expenditure reveals the financing gap.', 'Arthrekha derives non-borrowed receipts as revenue receipts plus non-debt capital receipts.', { formula: 'Revenue receipts + Non-debt capital receipts', relatedMetrics: ['total_expenditure', 'fiscal_deficit'], caveats: ['Calculated by Arthrekha from compatible Budget Estimate inputs.'] }),
  total_receipts: metric('total_receipts', 'Total Receipts', 'receipts', 'All Budget receipts, including borrowing and other liabilities.', 'This balances the Budget presentation once financing receipts are included.', 'It prevents non-borrowed income from being confused with total financing resources.', 'Budget at a Glance defines total receipts as revenue receipts plus capital receipts.', { formula: 'Revenue receipts + Capital receipts', relatedMetrics: ['capital_receipts', 'total_expenditure'] }),

  total_expenditure: metric('total_expenditure', 'Total Expenditure', 'expenditure', 'All Union Government expenditure in the Budget.', 'It combines expenditure on revenue and capital accounts.', 'It is the scale against which composition, receipts and deficits are compared.', 'Total expenditure equals revenue expenditure plus capital expenditure.', { formula: 'Revenue expenditure + Capital expenditure', relatedMetrics: ['revenue_expenditure', 'capital_expenditure', 'non_borrowed_receipts'] }),
  revenue_expenditure: metric('revenue_expenditure', 'Revenue Expenditure', 'expenditure', 'Expenditure recorded on the revenue account.', 'It includes recurring obligations and services, though individual items need their own classification.', 'Its relationship with revenue receipts determines the revenue deficit.', 'Revenue expenditure is expenditure on revenue account under the government accounting classification.', { parentMetric: 'total_expenditure', relatedMetrics: ['revenue_receipts', 'revenue_deficit'] }),
  capital_expenditure: metric('capital_expenditure', 'Capital Expenditure', 'expenditure', 'Expenditure recorded on the capital account.', 'It commonly includes asset creation, investment, loans and liability-reducing transactions.', 'It is a key measure of direct public capital formation and investment activity.', 'Capital expenditure is expenditure on capital account; classification depends on the underlying transaction.', { parentMetric: 'total_expenditure', relatedMetrics: ['effective_capital_expenditure'], compatibleRatios: ['capital_expenditure_share'] }),
  grants_for_capital_assets: metric('grants_for_capital_assets', 'Grants for Creation of Capital Assets', 'expenditure', 'Revenue grants intended to create capital assets elsewhere.', 'The Union may fund asset creation through grants even when the spending is not booked as its direct capital expenditure.', 'This explains why effective capital expenditure can exceed direct capital expenditure.', 'These grants are booked on revenue account but earmarked for creation of capital assets by recipients.', { parentMetric: 'effective_capital_expenditure', relatedMetrics: ['capital_expenditure', 'effective_revenue_deficit'] }),
  effective_capital_expenditure: metric('effective_capital_expenditure', 'Effective Capital Expenditure', 'expenditure', 'Capital expenditure plus grants for creating capital assets.', 'It broadens the view of capital-oriented spending beyond assets created directly on the Union’s books.', 'It captures capital creation financed through grants as well as direct capital expenditure.', 'Effective capital expenditure equals capital expenditure plus grants in aid for creation of capital assets.', { parentMetric: 'total_expenditure', formula: 'Capital expenditure + Grants for creation of capital assets', relatedMetrics: ['capital_expenditure', 'grants_for_capital_assets'], compatibleRatios: ['effective_capital_expenditure_share'] }),
  interest_payments: metric('interest_payments', 'Interest Payments', 'expenditure', 'The cost of servicing accumulated government liabilities.', 'This is money paid because of past and current borrowing obligations.', 'It shows how much recurring revenue is absorbed before other spending choices.', 'Interest payments are included in revenue expenditure and are deducted from fiscal deficit to derive primary deficit.', { parentMetric: 'revenue_expenditure', relatedMetrics: ['primary_deficit', 'fiscal_deficit'], compatibleRatios: ['interest_revenue_receipts_ratio'] }),
  pensions: metric('pensions', 'Pensions', 'expenditure', 'Budget expenditure on pension obligations.', 'This supports pension payments recorded in the Union Budget.', 'Pensions are a material recurring commitment, but they are not interchangeable with salaries or interest.', 'The figure is the Pension major item in Budget at a Glance.', { parentMetric: 'revenue_expenditure' }),
  defence_expenditure: metric('defence_expenditure', 'Defence Expenditure', 'expenditure', 'The defence aggregate in Budget at a Glance.', 'This combines defence-related spending presented in the major-items summary.', 'It is a broad policy-area aggregate whose detailed revenue and capital composition requires deeper documents.', 'The figure follows the Budget at a Glance “Defence” major-item classification.', { parentMetric: 'total_expenditure', caveats: ['Use Expenditure Profile and Demands for Grants for a detailed defence classification.'] }),
  fertiliser_subsidy: metric('fertiliser_subsidy', 'Fertiliser Subsidy', 'expenditure', 'Budget support classified as fertiliser subsidy.', 'This supports the fertiliser subsidy system under the Budget classification.', 'It is one of the principal subsidy aggregates shown in the Budget summary.', 'The figure is the Fertiliser subsidy major item in Budget at a Glance.', { parentMetric: 'revenue_expenditure' }),
  food_subsidy: metric('food_subsidy', 'Food Subsidy', 'expenditure', 'Budget support classified as food subsidy.', 'This supports food-security and related procurement/distribution obligations.', 'It is one of the largest subsidy aggregates in the Union Budget.', 'The figure is the Food subsidy major item in Budget at a Glance.', { parentMetric: 'revenue_expenditure' }),
  petroleum_subsidy: metric('petroleum_subsidy', 'Petroleum Subsidy', 'expenditure', 'Budget support classified as petroleum subsidy.', 'This is the petroleum subsidy line in the major-items presentation.', 'It helps distinguish petroleum support from food and fertiliser subsidies.', 'The figure follows the Budget at a Glance Petroleum subsidy classification.', { parentMetric: 'revenue_expenditure' }),
  central_sector_schemes: metric('central_sector_schemes', 'Central Sector Schemes', 'expenditure', 'Schemes and projects funded by the Union Government.', 'These programmes are implemented under the Central Sector classification.', 'They are distinct from Centrally Sponsored Schemes shared with States.', 'The figure is the Central Sector Schemes/Projects aggregate in Budget at a Glance.', { parentMetric: 'total_expenditure', relatedMetrics: ['centrally_sponsored_schemes'] }),
  centrally_sponsored_schemes: metric('centrally_sponsored_schemes', 'Centrally Sponsored Schemes', 'federal', 'Union transfers for schemes implemented with States.', 'The Union and States participate in these schemes under programme-specific arrangements.', 'They are an important channel of federal fiscal transfers but not the same as tax devolution or grants.', 'The figure is the Centrally Sponsored Schemes aggregate in the broad expenditure classification.', { parentMetric: 'total_expenditure', classificationType: 'transfer', relatedMetrics: ['central_sector_schemes', 'total_transfers_states_uts'] }),

  fiscal_deficit: metric('fiscal_deficit', 'Fiscal Deficit', 'deficit', 'The gap between expenditure and non-borrowed receipts.', 'It is the amount that must be financed when spending exceeds revenue receipts and non-debt capital receipts.', 'It indicates the government’s net financing requirement; comparisons often use GDP.', 'Fiscal deficit equals total expenditure minus revenue receipts, recovery of loans and other non-debt receipts.', { formula: 'Total expenditure − Revenue receipts − Recovery of loans − Other capital receipts', relatedMetrics: ['non_borrowed_receipts', 'primary_deficit', 'borrowings_and_other_liabilities'], compatibleRatios: ['fiscal_deficit_gdp_ratio'] }),
  revenue_deficit: metric('revenue_deficit', 'Revenue Deficit', 'deficit', 'Revenue expenditure exceeding revenue receipts.', 'It shows the part of the revenue account not covered by recurring receipts.', 'It separates the revenue-account imbalance from capital spending and financing.', 'Revenue deficit equals revenue expenditure minus revenue receipts.', { formula: 'Revenue expenditure − Revenue receipts', relatedMetrics: ['effective_revenue_deficit'], compatibleRatios: ['revenue_deficit_gdp_ratio'] }),
  effective_revenue_deficit: metric('effective_revenue_deficit', 'Effective Revenue Deficit', 'deficit', 'Revenue deficit after removing grants used to create capital assets.', 'It adjusts the revenue deficit for grants that create capital assets outside the Union’s own books.', 'It distinguishes ordinary revenue-account imbalance from capital-oriented grants.', 'Effective revenue deficit equals revenue deficit minus grants in aid for creation of capital assets.', { parentMetric: 'revenue_deficit', formula: 'Revenue deficit − Grants for creation of capital assets', relatedMetrics: ['grants_for_capital_assets'], compatibleRatios: ['effective_revenue_deficit_gdp_ratio'] }),
  primary_deficit: metric('primary_deficit', 'Primary Deficit', 'deficit', 'Fiscal deficit after subtracting interest payments.', 'It asks how large the current fiscal gap would be if interest on accumulated liabilities were set aside.', 'It separates current fiscal imbalance from the cost of past borrowing.', 'Primary deficit equals fiscal deficit minus interest payments.', { parentMetric: 'fiscal_deficit', formula: 'Fiscal deficit − Interest payments', relatedMetrics: ['interest_payments'], compatibleRatios: ['primary_deficit_gdp_ratio'] }),

  debt_receipts_net: metric('debt_receipts_net', 'Debt Receipts (Net)', 'debt', 'Net debt financing used to fund the fiscal deficit.', 'This combines several borrowing channels after repayments and related adjustments.', 'It shows how the financing gap is met, but it is a flow—not the stock of debt.', 'The source reports net debt receipts as a financing source of fiscal deficit.', { classificationType: 'financing-source', relatedMetrics: ['market_borrowings_net', 'external_debt_net'], caveats: ['Do not compare this flow directly with a debt-stock series.'] }),
  market_borrowings_net: metric('market_borrowings_net', 'Market Borrowings (Net)', 'debt', 'Net borrowing through government securities.', 'The government raises market financing through securities, after relevant repayments and adjustments.', 'It is a principal channel through which the fiscal deficit is financed.', 'The source reports market borrowings net of buyback and switching operations.', { parentMetric: 'debt_receipts_net', classificationType: 'financing-source' }),
  short_term_borrowing: metric('short_term_borrowing', 'Short-Term Borrowing', 'debt', 'Short-duration financing including Treasury Bills.', 'This is borrowing intended for shorter maturities within the deficit-financing mix.', 'Its role differs from longer-dated market securities and should be tracked separately.', 'The source groups Treasury Bills and related short-term borrowing within debt receipts.', { parentMetric: 'debt_receipts_net', classificationType: 'financing-source' }),
  securities_against_small_savings: metric('securities_against_small_savings', 'Securities Against Small Savings', 'debt', 'Securities issued against collections in small-savings funds.', 'Small-savings balances can finance the government through special securities.', 'This is a distinct financing channel from open-market government securities.', 'The source reports securities against small savings within net debt receipts.', { parentMetric: 'debt_receipts_net', classificationType: 'financing-source' }),
  external_debt_net: metric('external_debt_net', 'External Debt Receipts (Net)', 'debt', 'Net external borrowing used in deficit financing.', 'This is the external-debt flow in the financing table, after repayments.', 'It should not be confused with the total stock or market value of external liabilities.', 'The source reports external debt on a net receipt basis within fiscal-deficit financing.', { parentMetric: 'debt_receipts_net', classificationType: 'financing-source', caveats: ['This is a net flow and not a debt-stock measure.'] }),

  finance_commission_grants: metric('finance_commission_grants', 'Finance Commission Grants', 'federal', 'Grants provided under Finance Commission recommendations.', 'These grants support specified State and local-government needs under the federal framework.', 'They are constitutionally and institutionally distinct from scheme transfers and tax devolution.', 'The figure is the Finance Commission Grants aggregate in the transfer statement.', { classificationType: 'transfer', relatedMetrics: ['tax_devolution_states', 'total_transfers_states_uts'] }),
  other_grants_loans_transfers: metric('other_grants_loans_transfers', 'Other Grants, Loans and Transfers', 'federal', 'Other Union grants, loans and transfer flows.', 'This groups transfer mechanisms outside the principal scheme and Finance Commission lines.', 'The aggregate is useful, but its internal composition should be inspected before comparison.', 'The figure follows the Budget at a Glance broad transfer classification.', { classificationType: 'transfer', caveats: ['This aggregate contains different transfer instruments.'] }),
  tax_devolution_states: metric('tax_devolution_states', 'Tax Devolution to States', 'federal', 'States’ share in Union taxes.', 'A portion of the divisible Union tax pool is transferred to States under the devolution framework.', 'It is one of the largest channels connecting Union revenue with State finances.', 'The source reports devolution of States’ share in taxes in the transfer statement.', { classificationType: 'transfer', relatedMetrics: ['state_share_of_taxes', 'total_transfers_states_uts'] }),
  total_transfers_states_uts: metric('total_transfers_states_uts', 'Total Transfers to States and UTs', 'federal', 'Total resources transferred to States and UTs with legislature.', 'This combines several transfer channels rather than representing a single grant programme.', 'It gives the broad scale of Union-to-State/UT fiscal flows.', 'The total follows the Budget at a Glance transfer statement and includes tax devolution, grants and other transfers.', { classificationType: 'transfer', relatedMetrics: ['tax_devolution_states', 'finance_commission_grants', 'centrally_sponsored_schemes'], caveats: ['Components overlap with different accounting and programme classifications; use the official statement for reconciliation.'] }),

  nominal_gdp: metric('nominal_gdp', 'Nominal GDP', 'accounts', 'The current-price GDP estimate used as a ratio denominator.', 'This is the size of the economy measured at current prices for the same financial year.', 'It allows fiscal amounts to be compared with the economy’s scale.', 'The Budget at a Glance cites the FY 2026–27 nominal GDP estimate released by NSO.', { classificationType: 'denominator', caveats: ['Use only with fiscal observations covering the same financial year and compatible estimate state.'] }),
} as const;

export type MetricId = keyof typeof METRIC_DEFINITIONS;

export function getMetricDefinition(metricId: string): MetricDefinition | null {
  return METRIC_DEFINITIONS[metricId as MetricId] ?? null;
}

export function getMetricsByCategory(domain: FinancialDomain): MetricDefinition[] {
  return Object.values(METRIC_DEFINITIONS).filter(metricDefinition => metricDefinition.domain === domain);
}

export function getMetricChildren(metricId: string): MetricDefinition[] {
  return Object.values(METRIC_DEFINITIONS).filter(metricDefinition => metricDefinition.parentMetric === metricId);
}

export function getRelatedMetrics(metricId: string): MetricDefinition[] {
  const definition = getMetricDefinition(metricId);
  return definition ? definition.relatedMetrics.map(getMetricDefinition).filter((item): item is MetricDefinition => item !== null) : [];
}
