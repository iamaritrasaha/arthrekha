import { Link } from 'react-router-dom';
import { getBudgetEstimate } from '@/data/selectors';
import { getMetricDefinition, type MetricId } from '@/data/metricDefinitions';
import { formatCurrency } from '@/lib/formatting';
import styles from './KnowledgePage.module.css';
import { useTranslation } from '@/i18n';

const CONCEPT_GROUPS: Array<{ title: string; description: string; metrics: MetricId[] }> = [
  { title: 'Government money', description: 'Receipts, taxes and expenditure as connected accounting flows.', metrics: ['revenue_receipts', 'gross_tax_revenue', 'capital_receipts', 'total_expenditure'] },
  { title: 'Deficits', description: 'Four different gaps, each answering a different fiscal question.', metrics: ['fiscal_deficit', 'revenue_deficit', 'effective_revenue_deficit', 'primary_deficit'] },
  { title: 'Debt & borrowing', description: 'Financing flows, instruments and the difference between a flow and a debt stock.', metrics: ['borrowings_and_other_liabilities', 'market_borrowings_net', 'short_term_borrowing', 'external_debt_net'] },
  { title: 'Federal finance', description: 'How Union resources move to States through distinct mechanisms.', metrics: ['tax_devolution_states', 'finance_commission_grants', 'centrally_sponsored_schemes', 'total_transfers_states_uts'] },
];

const ACCOUNT_CONCEPTS = [
  { name: 'Consolidated Fund of India', short: 'The principal constitutional account for Union revenues, loans raised and most expenditure.', deeper: 'Article 266 provides the constitutional basis. Money generally cannot be appropriated from the Fund without parliamentary authorization under law.' },
  { name: 'Public Account', short: 'Accounts for monies where government may act as banker or custodian rather than owner.', deeper: 'Public Account flows can include provident funds and small-savings-related balances. They must not be interpreted as ordinary revenue receipts.' },
  { name: 'Contingency Fund', short: 'A constitutional fund for urgent, unforeseen expenditure pending authorization.', deeper: 'Advances are subsequently recouped through parliamentary authorization; it is not a general-purpose spending account.' },
  { name: 'Charged expenditure', short: 'Expenditure charged on the Consolidated Fund rather than submitted to a vote.', deeper: 'It is discussed in Parliament but is not voted in the same way as voted expenditure. Constitutional offices and debt charges are prominent examples.' },
  { name: 'Voted expenditure', short: 'Expenditure that proceeds through Demands for Grants and parliamentary voting.', deeper: 'The distinction is about the authorization process, not whether the spending is important or discretionary in an everyday sense.' },
];

export default function LearnPage() {
  const { t } = useTranslation();
  return <div className={styles.page}>
    <header className={styles.hero}><p>{t('Learn · Public Finance')}</p><h1>{t('Understand the system.')}<br /><em>{t('Then interrogate it.')}</em></h1><span>{t('Concepts are connected directly to current Union Government data—not isolated in a glossary.')}</span></header>
    {CONCEPT_GROUPS.map((group, index) => <section className={styles.group} key={group.title}><div className={styles.groupHeading}><small>{String(index + 1).padStart(2, '0')} / {t('CONCEPTS')}</small><div><h2>{t(group.title)}</h2><p>{t(group.description)}</p></div></div><div className={styles.cardGrid}>{group.metrics.map(metricId => <ConceptCard key={metricId} metricId={metricId} />)}</div></section>)}
    <section className={styles.group}><div className={styles.groupHeading}><small>05 / {t('GOVERNMENT ACCOUNTS')}</small><div><h2>{t('Where public money legally lives.')}</h2><p>{t('The account structure matters before any number can be interpreted correctly.')}</p></div></div><div className={styles.accountGrid}>{ACCOUNT_CONCEPTS.map(concept => <details key={concept.name}><summary>{t(concept.name)}<span>+</span></summary><p>{t(concept.short)}</p><small>{t(concept.deeper)}</small></details>)}</div></section>
  </div>;
}

function ConceptCard({ metricId }: { metricId: MetricId }) {
  const { t, localizeFormattedValue, localizeMetric } = useTranslation();
  const definition = localizeMetric(getMetricDefinition(metricId)!);
  const observation = getBudgetEstimate(metricId);
  return <article className={styles.card}><span>{t(definition.domain)}</span><h3>{definition.displayName}</h3><p>{definition.explanation.short}</p><details><summary>{t('Go deeper')} <b>+</b></summary><p>{definition.explanation.simple}</p><small><strong>{t('Why it matters')}</strong>{definition.explanation.whyItMatters}</small>{definition.formula && <code>{definition.formula}</code>}</details><div className={styles.current}><small>{t('CURRENT BE')}</small><strong>{observation ? localizeFormattedValue(formatCurrency(observation.amount)) : t('Data unavailable')}</strong></div><Link to={`/explore?metric=${metricId}`}>{t('Explore current data ↗')}</Link></article>;
}
