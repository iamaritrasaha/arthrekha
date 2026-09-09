import styles from './FiscalYearTrace.module.css';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useTranslation } from '@/i18n';
import { getDatasetMetadata, getLatestPeriod } from '@/data/selectors';
import { FISCAL_MONTHS, periodEndIndex, currentPeriodText } from '@/lib/fiscalPeriods';

interface FiscalYearTraceProps {
  latestIndex?: number;
  compact?: boolean;
}

export default function FiscalYearTrace({ latestIndex, compact = false }: FiscalYearTraceProps) {
  const { t } = useTranslation();
  const { ref, hasEntered } = useInViewOnce<HTMLDivElement>();
  const metadata = getDatasetMetadata();
  const latestPeriod = getLatestPeriod();
  const resolvedLatestIndex = latestIndex ?? periodEndIndex(latestPeriod);
  const progress = hasEntered ? (Math.max(resolvedLatestIndex, 0) / (FISCAL_MONTHS.length - 1)) * 100 : 0;
  const actualDataLabel = currentPeriodText('Actual data is available through {period} {year}; later periods are not available.', latestPeriod, metadata.financialYear, t);
  const recordedPeriodsLabel = currentPeriodText('Recorded cumulative periods run through {period} {year}; later periods are not available in this dataset.', latestPeriod, metadata.financialYear, t);
  return (
    <div ref={ref} className={`${styles.trace} ${compact ? styles.compact : ''}`} role="img" aria-label={`${t('India financial year runs from April to March.')} ${actualDataLabel}`}>
      <div className={styles.months} aria-hidden="true">
        {FISCAL_MONTHS.map((month, index) => <span key={month} className={index < resolvedLatestIndex ? styles.complete : index === resolvedLatestIndex ? styles.current : styles.future}>{t(month)}</span>)}
      </div>
      <div className={styles.line} aria-hidden="true"><i style={{ width: `${progress}%` }} /><b className={styles.marker} style={{ left: `${progress}%` }} /></div>
      {!compact && <div className={styles.legend}><span><i className={styles.completeKey} /> {t('recorded')}</span><span><i className={styles.currentKey} /> {currentPeriodText('latest: {period} {year}', latestPeriod, metadata.financialYear, t)}</span><span><i className={styles.futureKey} /> {t('not available')}</span></div>}
      <p className="sr-only">{recordedPeriodsLabel}</p>
    </div>
  );
}
