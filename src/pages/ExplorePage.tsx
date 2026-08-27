import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FinancialFlow from '@/components/finance/FinancialFlow';
import MetricTable from '@/components/finance/MetricTable';
import ModeSwitch, { type ExplorationMode } from '@/components/finance/ModeSwitch';
import { FISCAL_DOMAINS, getFiscalDomain } from '@/data/domains';
import { getMetricDefinition, getRelatedMetrics, type FinancialDomain, type MetricId } from '@/data/metricDefinitions';
import { getBudgetEstimate, getExecutionRate, getLatestActual, getMetricRatio, getMetricsForDomain } from '@/data/selectors';
import { formatCurrency, formatPercentage } from '@/lib/formatting';
import styles from './ExplorePage.module.css';

const DEFAULT_METRIC: MetricId = 'revenue_receipts';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryMetric = searchParams.get('metric');
  const initialMetric = queryMetric && getMetricDefinition(queryMetric) ? queryMetric as MetricId : DEFAULT_METRIC;
  const [mode, setMode] = useState<ExplorationMode>('understand');
  const [selectedMetric, setSelectedMetric] = useState<MetricId>(initialMetric);
  const definition = getMetricDefinition(selectedMetric)!;
  const [domain, setDomain] = useState<FinancialDomain>(definition.domain === 'accounts' ? 'receipts' : definition.domain);
  const domainDefinition = getFiscalDomain(domain);
  const domainMetrics = useMemo(() => getMetricsForDomain(domain).filter(metricId => metricId !== 'nominal_gdp'), [domain]);
  const be = getBudgetEstimate(selectedMetric);
  const actual = getLatestActual(selectedMetric);
  const execution = getExecutionRate(selectedMetric);
  const ratios = definition.compatibleRatios.map(ratioId => getMetricRatio(selectedMetric, ratioId)).filter(item => item !== null);

  const selectMetric = (metricId: MetricId) => {
    setSelectedMetric(metricId);
    setSearchParams({ metric: metricId }, { replace: true });
  };

  const selectDomain = (nextDomain: FinancialDomain) => {
    const firstMetric = getFiscalDomain(nextDomain)?.featuredMetrics.find(metricId => getBudgetEstimate(metricId)) ?? getMetricsForDomain(nextDomain)[0];
    setDomain(nextDomain);
    if (firstMetric) selectMetric(firstMetric);
  };

  return <div className={`${styles.page} ${mode === 'analyse' ? styles.analyse : styles.understand}`}>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>INDIA · UNION GOVERNMENT · FY 2026–27</p><h1>A fiscal system,<br /><em>opened gently.</em></h1><p>Start with the meaning. Increase the density when you are ready.</p></div>
      <ModeSwitch mode={mode} onChange={setMode} />
    </header>

    <section className={styles.flowSection} aria-labelledby="fiscal-map-title">
      <div className={styles.sectionHeading}><span>01 / THE SYSTEM</span><h2 id="fiscal-map-title">Money moves through relationships.</h2></div>
      <FinancialFlow />
    </section>

    <section className={styles.explorer} aria-labelledby="domain-title">
      <div className={styles.domainRail} role="tablist" aria-label="Fiscal domains">
        {FISCAL_DOMAINS.map(item => <button key={item.id} role="tab" aria-selected={domain === item.id} className={domain === item.id ? styles.domainActive : styles.domainTab} onClick={() => selectDomain(item.id)}><small>{item.eyebrow}</small><span>{item.label}</span></button>)}
      </div>

      <div className={styles.domainIntro}>
        <p className={styles.eyebrow}>02 / {domainDefinition?.eyebrow.toUpperCase()}</p>
        <h2 id="domain-title">{domainDefinition?.question}</h2>
        <p>{domainDefinition?.description}</p>
      </div>

      <div className={styles.metricRail} aria-label={`${domainDefinition?.label} metrics`}>
        {domainMetrics.map(metricId => <button key={metricId} aria-pressed={selectedMetric === metricId} className={selectedMetric === metricId ? styles.metricActive : styles.metricButton} onClick={() => selectMetric(metricId)}>{getMetricDefinition(metricId)?.shortName ?? getMetricDefinition(metricId)?.displayName}</button>)}
      </div>

      <article className={styles.metricDetail} aria-live="polite">
        <div className={styles.metricLead}>
          <div><span className={styles.metricDomain}>{definition.domain} · {definition.classificationType}</span><h3>{definition.displayName}</h3><p>{definition.explanation.short}</p></div>
          <div className={styles.primaryValue}><small>BUDGET ESTIMATE</small><strong>{be ? formatCurrency(be.amount) : 'Data unavailable'}</strong><span>FY 2026–27 · ₹ crore source unit</span></div>
        </div>

        <div className={styles.valueStrip}>
          <div><small>EXACT BE</small><strong>{be ? formatCurrency(be.amount, { forceUnit: 'crore' }) : 'Data unavailable'}</strong></div>
          <div><small>PROVISIONAL ACTUAL</small><strong>{actual ? formatCurrency(actual.amount, { forceUnit: 'crore' }) : 'Data unavailable'}</strong><span>{actual ? 'Through June 2026' : 'No compatible CGA observation'}</span></div>
          <div><small>EXECUTION</small><strong>{execution ? formatPercentage(execution.value) : 'Not available'}</strong><span>{execution ? 'Actual YTD ÷ annual BE' : 'Requires compatible periods'}</span></div>
          {ratios.map(ratio => <div key={ratio.metric}><small>{ratio.metric.replace(/_/g, ' ')}</small><strong>{formatPercentage(ratio.value)}</strong><span>Calculated by Arthrekha</span></div>)}
        </div>

        <div className={styles.explanationGrid}>
          <section><span>EXPLAIN SIMPLY</span><p>{definition.explanation.simple}</p></section>
          <section><span>WHY IT MATTERS</span><p>{definition.explanation.whyItMatters}</p></section>
          <section className={styles.technical}><span>GO DEEPER</span><p>{definition.explanation.technical}</p>{definition.formula && <code>{definition.formula}</code>}{definition.caveats.map(caveat => <small key={caveat}>{caveat}</small>)}</section>
        </div>

        <div className={styles.related}><span>RELATED</span>{getRelatedMetrics(selectedMetric).map(item => <button key={item.id} onClick={() => { setDomain(item.domain === 'accounts' ? domain : item.domain); selectMetric(item.id as MetricId); }}>{item.displayName}</button>)}</div>

        {mode === 'analyse' && be && <div className={styles.evidence}><span>OFFICIAL SOURCE</span><strong>{be.source.organization}</strong><p>{be.source.document}</p><small>{be.source.table ?? 'Table reference unavailable'} · {be.source.dataStatus === 'derived' ? 'Arthrekha-derived observation' : 'Source value'}</small>{be.source.url && <a href={be.source.url} target="_blank" rel="noreferrer">Open official source ↗</a>}</div>}
      </article>

      {mode === 'analyse' && <section className={styles.tableSection} aria-labelledby="table-title"><div className={styles.sectionHeading}><span>03 / ANALYTICAL VIEW</span><h2 id="table-title">The same domain, without the simplification.</h2></div><MetricTable metrics={domainMetrics} /></section>}
    </section>
  </div>;
}
