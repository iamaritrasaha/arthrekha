import { getDatasetMetadata } from '@/data/selectors';
import styles from './KnowledgePage.module.css';
import { useTranslation } from '@/i18n';

const PIPELINE = ['Official source', 'Raw preserved document', 'Normalized observation', 'Validated relationship', 'Optional derived calculation', 'Displayed value'];

export default function SourcesPage() {
  const { t, localizeFormattedValue } = useTranslation();
  const metadata = getDatasetMetadata();
  return <div className={styles.page}>
    <header className={styles.hero}><p>{t('Sources · Methodology')}</p><h1>{t('Evidence is part')}<br /><em>{t('of the interface.')}</em></h1><span>{t('Every production figure remains traceable to an official document, reporting period and calculation state.')}</span></header>
    <section className={styles.sourceGrid}>
      <article><span>{t('ANNUAL PLAN')}</span><h2>{t('Union Budget 2026–27')}</h2><p>{t('Budget at a Glance, Ministry of Finance, Government of India. The official PDF is treated as the source of record for the expanded Budget Estimate taxonomy.')}</p><dl><dt>{t('Estimate state')}</dt><dd>{t('Budget Estimate')}</dd><dt>{t('Financial year')}</dt><dd>{t('FY 2026–27')}</dd><dt>{t('Metrics')}</dt><dd>{t('44 Budget Estimate observations')}</dd><dt>{t('Publication')}</dt><dd>{t('1 February 2026')}</dd></dl><a href="https://www.indiabudget.gov.in/doc/Budget_at_Glance/budget_at_a_glance.pdf" target="_blank" rel="noreferrer">{t('Open official PDF ↗')}</a></article>
      <article><span>{t('EXECUTION')}</span><h2>{t('Controller General of Accounts')}</h2><p>{t('Provisional cumulative Union Government actuals for April, April–May and April–June 2026.')}</p><dl><dt>{t('Estimate state')}</dt><dd>{t('Provisional actual')}</dd><dt>{t('Latest period')}</dt><dd>{t('Through June 2026')}</dd><dt>{t('Audit status')}</dt><dd>{t('Unaudited / subject to CAG audit')}</dd><dt>{t('Compatible metrics')}</dt><dd>{t('10 execution series')}</dd></dl><a href="https://cga.nic.in/" target="_blank" rel="noreferrer">{t('Open CGA ↗')}</a></article>
    </section>
    <section className={styles.pipeline}><div><small>{t('THE EVIDENCE PATH')}</small><h2>{t('Source → meaning → interface')}</h2><p>{t('Derived ratios retain the input observation IDs and are labelled “Calculated by Arthrekha.”')}</p></div><ol>{PIPELINE.map((stage, index) => <li key={stage}><b>{String(index + 1).padStart(2, '0')}</b><span>{t(stage)}</span></li>)}</ol></section>
    <section className={styles.methodFacts}><div><small>{t('NORMALIZED OBSERVATIONS')}</small><strong>{localizeFormattedValue(String(metadata.totalObservations))}</strong></div><div><small>{t('LATEST ACTUAL PERIOD')}</small><strong>{t('JUNE 2026')}</strong></div><div><small>{t('UNIT OF RECORD')}</small><strong>₹ {t('CRORE')}</strong></div><div><small>{t('RATIO RULE')}</small><strong>{t('COMPATIBLE PERIODS ONLY')}</strong></div></section>
  </div>;
}
