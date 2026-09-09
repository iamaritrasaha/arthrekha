import { formatCurrency } from '@/lib/formatting';
import { getBudgetEstimate } from '@/data/selectors';
import styles from './FinancialFlow.module.css';
import { useTranslation } from '@/i18n';

const FLOW = [
  { id: 'non_borrowed_receipts', label: 'Non-borrowed receipts', note: 'Recurring and non-debt resources' },
  { id: 'total_expenditure', label: 'Total expenditure', note: 'Revenue + capital accounts' },
  { id: 'fiscal_deficit', label: 'Financing gap', note: 'Needs financing' },
  { id: 'borrowings_and_other_liabilities', label: 'Borrowing / financing', note: 'Flow, not debt stock' },
] as const;

export default function FinancialFlow() {
  const { t, localizeFormattedValue } = useTranslation();
  const accessibleSummary = FLOW.map(item => {
    const observation = getBudgetEstimate(item.id);
    return `${t(item.label)}: ${observation ? localizeFormattedValue(formatCurrency(observation.amount)) : t('data unavailable')}`;
  }).join('. ');
  return (
    <figure className={styles.figure} aria-labelledby="flow-explorer-title">
      <figcaption id="flow-explorer-title"><span>{t('THE FISCAL FLOW')}</span> {t('Follow the money without losing the accounting distinctions.')}</figcaption>
      <div className={styles.flow} role="img" aria-label={accessibleSummary}>
        {FLOW.map((item, index) => {
          const observation = getBudgetEstimate(item.id);
          return <div className={styles.stage} key={item.id}>
            <div className={styles.node}><small>{t(index === 0 ? 'MONEY IN' : index === 1 ? 'MONEY OUT' : index === 2 ? 'THE GAP' : 'FINANCING')}</small><strong>{t(item.label)}</strong><b>{observation ? localizeFormattedValue(formatCurrency(observation.amount)) : t('Data unavailable')}</b><span>{t(item.note)}</span></div>
            {index < FLOW.length - 1 && <i className={styles.connector} aria-hidden="true" />}
          </div>;
        })}
      </div>
      <p className={styles.note}>{t('Borrowing completes the financing presentation; it is not counted as non-borrowed income.')}</p>
    </figure>
  );
}
