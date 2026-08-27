import { getBudgetEstimate, getExecutionRate, getLatestActual } from '@/data/selectors';
import { formatCurrency, formatPercentage } from '@/lib/formatting';
import { getMetricDefinition, type MetricId } from '@/data/metricDefinitions';
import styles from './MetricTable.module.css';

export default function MetricTable({ metrics }: { metrics: MetricId[] }) {
  return (
    <div className={styles.shell} tabIndex={0} aria-label="Scrollable fiscal metric table">
      <table>
        <caption className="sr-only">FY 2026–27 Union Government fiscal metrics</caption>
        <thead><tr><th>Metric</th><th>Budget Estimate</th><th>Actual through June</th><th>Execution</th><th>Status</th></tr></thead>
        <tbody>{metrics.map(metricId => {
          const definition = getMetricDefinition(metricId);
          const be = getBudgetEstimate(metricId);
          const actual = getLatestActual(metricId);
          const execution = getExecutionRate(metricId);
          return <tr key={metricId}><th scope="row"><span>{definition?.displayName ?? metricId}</span><small>{definition?.domain}</small></th><td>{be ? formatCurrency(be.amount, { forceUnit: 'crore' }) : 'Data unavailable'}</td><td>{actual ? formatCurrency(actual.amount, { forceUnit: 'crore' }) : 'Data unavailable'}</td><td>{execution ? formatPercentage(execution.value) : '—'}</td><td><span className={styles.status}>{actual ? 'Provisional actual' : be ? 'BE only' : 'Unavailable'}</span></td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}
