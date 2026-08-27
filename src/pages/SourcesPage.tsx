import { getDatasetMetadata } from '@/data/selectors';
import styles from './KnowledgePage.module.css';

const PIPELINE = ['Official source', 'Raw preserved document', 'Normalized observation', 'Validated relationship', 'Optional derived calculation', 'Displayed value'];

export default function SourcesPage() {
  const metadata = getDatasetMetadata();
  return <div className={styles.page}>
    <header className={styles.hero}><p>SOURCES · METHODOLOGY</p><h1>Evidence is part<br /><em>of the interface.</em></h1><span>Every production figure remains traceable to an official document, reporting period and calculation state.</span></header>
    <section className={styles.sourceGrid}>
      <article><span>ANNUAL PLAN</span><h2>Union Budget 2026–27</h2><p>Budget at a Glance, Ministry of Finance, Government of India. The official PDF is treated as the source of record for the expanded Budget Estimate taxonomy.</p><dl><dt>Estimate state</dt><dd>Budget Estimate</dd><dt>Financial year</dt><dd>FY 2026–27</dd><dt>Metrics</dt><dd>44 Budget Estimate observations</dd><dt>Publication</dt><dd>1 February 2026</dd></dl><a href="https://www.indiabudget.gov.in/doc/Budget_at_Glance/budget_at_a_glance.pdf" target="_blank" rel="noreferrer">Open official PDF ↗</a></article>
      <article><span>EXECUTION</span><h2>Controller General of Accounts</h2><p>Provisional cumulative Union Government actuals for April, April–May and April–June 2026.</p><dl><dt>Estimate state</dt><dd>Provisional actual</dd><dt>Latest period</dt><dd>Through June 2026</dd><dt>Audit status</dt><dd>Unaudited / subject to CAG audit</dd><dt>Compatible metrics</dt><dd>10 execution series</dd></dl><a href="https://cga.nic.in/" target="_blank" rel="noreferrer">Open CGA ↗</a></article>
    </section>
    <section className={styles.pipeline}><div><small>THE EVIDENCE PATH</small><h2>Source → meaning → interface</h2><p>Derived ratios retain the input observation IDs and are labelled “Calculated by Arthrekha.”</p></div><ol>{PIPELINE.map((stage, index) => <li key={stage}><b>{String(index + 1).padStart(2, '0')}</b><span>{stage}</span></li>)}</ol></section>
    <section className={styles.methodFacts}><div><small>NORMALIZED OBSERVATIONS</small><strong>{metadata.totalObservations}</strong></div><div><small>LATEST ACTUAL PERIOD</small><strong>JUNE 2026</strong></div><div><small>UNIT OF RECORD</small><strong>₹ CRORE</strong></div><div><small>RATIO RULE</small><strong>COMPATIBLE PERIODS ONLY</strong></div></section>
  </div>;
}
