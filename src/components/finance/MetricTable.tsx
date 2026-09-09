import { getBudgetEstimate, getExecutionRate, getLatestActual } from '@/data/selectors';
import { formatCurrency, formatPercentage } from '@/lib/formatting';
import { getMetricDefinition, type MetricId } from '@/data/metricDefinitions';
import styles from './MetricTable.module.css';
import { useTranslation } from '@/i18n';
import { getDatasetMetadata } from '@/data/selectors';
import { currentPeriodText } from '@/lib/fiscalPeriods';

export default function MetricTable({ metrics }: { metrics: MetricId[] }) {
  const { t, localizeFormattedValue, localizeMetric } = useTranslation();
  const metadata = getDatasetMetadata();
  const actualHeading = currentPeriodText('Actual through {period}', metadata.latestPeriod, metadata.financialYear, t);
  return (
    <div className={styles.shell} tabIndex={0} aria-label={t('Scrollable fiscal metric table')}>
      <table>
        <caption className="sr-only">{t('FY 2026–27 Union Government fiscal metrics')}</caption>
        <thead><tr><th>{t('Metric')}</th><th>{t('Budget Estimate')}</th><th>{actualHeading}</th><th>{t('Execution')}</th><th>{t('Status')}</th></tr></thead>
        <tbody>{metrics.map(metricId => {
          const rawDefinition = getMetricDefinition(metricId);
          const definition = rawDefinition ? localizeMetric(rawDefinition) : null;
          const be = getBudgetEstimate(metricId);
          const actual = getLatestActual(metricId);
          const execution = getExecutionRate(metricId);
          return <tr key={metricId}><th scope="row"><span>{definition?.displayName ?? metricId}</span><small>{t(definition?.domain ?? '')}</small></th><td>{be ? localizeFormattedValue(formatCurrency(be.amount, { forceUnit: 'crore' })) : t('Data unavailable')}</td><td>{actual ? localizeFormattedValue(formatCurrency(actual.amount, { forceUnit: 'crore' })) : t('Data unavailable')}</td><td>{execution ? localizeFormattedValue(formatPercentage(execution.value)) : '—'}</td><td><span className={styles.status}>{actual ? t('Provisional actual') : be ? t('BE only') : t('Unavailable')}</span></td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}
