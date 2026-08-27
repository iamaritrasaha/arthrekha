import styles from './FiscalYearTrace.module.css';
import { useInViewOnce } from '@/hooks/useInViewOnce';

const MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

interface FiscalYearTraceProps {
  latestIndex?: number;
  compact?: boolean;
}

export default function FiscalYearTrace({ latestIndex = 2, compact = false }: FiscalYearTraceProps) {
  const { ref, hasEntered } = useInViewOnce<HTMLDivElement>();
  const progress = hasEntered ? (latestIndex / (MONTHS.length - 1)) * 100 : 0;
  return (
    <div ref={ref} className={`${styles.trace} ${compact ? styles.compact : ''}`} role="img" aria-label="India financial year runs from April to March. Actual data is available through June 2026; later periods are not available.">
      <div className={styles.months} aria-hidden="true">
        {MONTHS.map((month, index) => <span key={month} className={index < latestIndex ? styles.complete : index === latestIndex ? styles.current : styles.future}>{month}</span>)}
      </div>
      <div className={styles.line} aria-hidden="true"><i style={{ width: `${progress}%` }} /><b className={styles.marker} style={{ left: `${progress}%` }} /></div>
      {!compact && <div className={styles.legend}><span><i className={styles.completeKey} /> recorded</span><span><i className={styles.currentKey} /> latest: JUN 2026</span><span><i className={styles.futureKey} /> not available</span></div>}
      <p className="sr-only">April, May, and June are recorded cumulative periods. July through March are not available in this dataset.</p>
    </div>
  );
}
