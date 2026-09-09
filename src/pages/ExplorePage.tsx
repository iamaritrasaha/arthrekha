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
import { useTranslation } from '@/i18n';
import { currentPeriodText } from '@/lib/fiscalPeriods';

const DEFAULT_METRIC: MetricId = 'revenue_receipts';

export default function ExplorePage() {
  const { t, localizeFormattedValue, localizeMetric } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryMetric = searchParams.get('metric');
  const initialMetric = queryMetric && getMetricDefinition(queryMetric) ? queryMetric as MetricId : DEFAULT_METRIC;
  const [mode, setMode] = useState<ExplorationMode>('understand');
  const [selectedMetric, setSelectedMetric] = useState<MetricId>(initialMetric);
  const rawDefinition = getMetricDefinition(selectedMetric)!;
  const definition = localizeMetric(rawDefinition);
  const [domain, setDomain] = useState<FinancialDomain>(rawDefinition.domain === 'accounts' ? 'receipts' : rawDefinition.domain);
  const domainDefinition = getFiscalDomain(domain);
  const domainMetrics = useMemo(() => getMetricsForDomain(domain).filter(metricId => metricId !== 'nominal_gdp'), [domain]);
  const be = getBudgetEstimate(selectedMetric);
  const actual = getLatestActual(selectedMetric);
  const execution = getExecutionRate(selectedMetric);
  const ratios = rawDefinition.compatibleRatios.map(ratioId => getMetricRatio(selectedMetric, ratioId)).filter(item => item !== null);

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
      <div><p className={styles.eyebrow}>{t('India · Union Government · FY 2026–27')}</p><h1>{t('A fiscal system,')}<br /><em>{t('opened gently.')}</em></h1><p>{t('Start with the meaning. Increase the density when you are ready.')}</p></div>
      <ModeSwitch mode={mode} onChange={setMode} />
    </header>

    <section className={styles.flowSection} aria-labelledby="fiscal-map-title">
      <div className={styles.sectionHeading}><span>01 / {t('THE SYSTEM')}</span><h2 id="fiscal-map-title">{t('Money moves through relationships.')}</h2></div>
      <FinancialFlow />
    </section>

    <section className={styles.explorer} aria-labelledby="domain-title">
      <div className={styles.domainRail} role="tablist" aria-label={t('Fiscal domains')}>
        {FISCAL_DOMAINS.map(item => <button key={item.id} role="tab" aria-selected={domain === item.id} className={domain === item.id ? styles.domainActive : styles.domainTab} onClick={() => selectDomain(item.id)}><small>{t(item.eyebrow)}</small><span>{t(item.label)}</span></button>)}
      </div>

      <div className={styles.domainIntro}>
        <p className={styles.eyebrow}>02 / {t(domainDefinition?.eyebrow.toUpperCase() ?? '')}</p>
        <h2 id="domain-title">{t(domainDefinition?.question ?? '')}</h2>
        <p>{t(domainDefinition?.description ?? '')}</p>
      </div>

      <div className={styles.metricRail} aria-label={`${t(domainDefinition?.label ?? '')} ${t('metrics')}`}>
        {domainMetrics.map(metricId => { const metricDefinition = getMetricDefinition(metricId); return <button key={metricId} aria-pressed={selectedMetric === metricId} className={selectedMetric === metricId ? styles.metricActive : styles.metricButton} onClick={() => selectMetric(metricId)}>{metricDefinition ? localizeMetric(metricDefinition).shortName : metricId}</button>; })}
      </div>

      <article className={styles.metricDetail} aria-live="polite">
        <div className={styles.metricLead}>
          <div><span className={styles.metricDomain}>{t(definition.domain)} · {t(definition.classificationType)}</span><h3>{definition.displayName}</h3><p>{definition.explanation.short}</p></div>
          <div className={styles.primaryValue}><small>{t('BUDGET ESTIMATE')}</small><strong>{be ? localizeFormattedValue(formatCurrency(be.amount)) : t('Data unavailable')}</strong><span>{t('FY 2026–27 · ₹ crore source unit')}</span></div>
        </div>

        <div className={styles.valueStrip}>
          <div><small>{t('EXACT BE')}</small><strong>{be ? localizeFormattedValue(formatCurrency(be.amount, { forceUnit: 'crore' })) : t('Data unavailable')}</strong></div>
          <div><small>{t('PROVISIONAL ACTUAL')}</small><strong>{actual ? localizeFormattedValue(formatCurrency(actual.amount, { forceUnit: 'crore' })) : t('Data unavailable')}</strong><span>{actual ? currentPeriodText('Through {period} {year}', actual.period, actual.financialYear, t) : t('No compatible CGA observation')}</span></div>
          <div><small>{t('EXECUTION')}</small><strong>{execution ? localizeFormattedValue(formatPercentage(execution.value)) : t('Not available')}</strong><span>{t(execution ? 'Actual YTD ÷ annual BE' : 'Requires compatible periods')}</span></div>
          {ratios.map(ratio => <div key={ratio.metric}><small>{t(ratio.metric.replace(/_/g, ' '))}</small><strong>{localizeFormattedValue(formatPercentage(ratio.value))}</strong><span>{t('Calculated by Arthrekha')}</span></div>)}
        </div>

        <div className={styles.explanationGrid}>
          <section><span>{t('EXPLAIN SIMPLY')}</span><p>{definition.explanation.simple}</p></section>
          <section><span>{t('WHY IT MATTERS')}</span><p>{definition.explanation.whyItMatters}</p></section>
          <section className={styles.technical}><span>{t('GO DEEPER')}</span><p>{definition.explanation.technical}</p>{definition.formula && <code>{definition.formula}</code>}{definition.caveats.map(caveat => <small key={caveat}>{caveat}</small>)}</section>
        </div>

        <div className={styles.related}><span>{t('RELATED')}</span>{getRelatedMetrics(selectedMetric).map(item => <button key={item.id} onClick={() => { setDomain(item.domain === 'accounts' ? domain : item.domain); selectMetric(item.id as MetricId); }}>{localizeMetric(item).displayName}</button>)}</div>

        {mode === 'analyse' && be && <div className={styles.evidence}><span>{t('OFFICIAL SOURCE')}</span><strong>{be.source.organization}</strong><p>{be.source.document}</p><small>{be.source.table ?? t('Table reference unavailable')} · {t(be.source.dataStatus === 'derived' ? 'Arthrekha-derived observation' : 'Source value')}</small>{be.source.url && <a href={be.source.url} target="_blank" rel="noreferrer">{t('Open official source ↗')}</a>}</div>}
      </article>

      {mode === 'analyse' && <section className={styles.tableSection} aria-labelledby="table-title"><div className={styles.sectionHeading}><span>03 / {t('ANALYTICAL VIEW')}</span><h2 id="table-title">{t('The same domain, without the simplification.')}</h2></div><MetricTable metrics={domainMetrics} /></section>}
    </section>
  </div>;
}
