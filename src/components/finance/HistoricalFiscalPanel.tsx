import { useEffect, useMemo, useState } from 'react';
import { loadHistoricalDataset, type HistoricalProcessedDataset } from '@/data/budgetData';
import { createObservationComparison, getDatasetMetadata } from '@/data/selectors';
import type { ComparisonStatus, EstimateType, FinancialObservation, ObservationComparison } from '@/types/financial';
import { formatCurrency, formatPercentage } from '@/lib/formatting';
import { useTranslation } from '@/i18n';
import { getMetricDefinition } from '@/data/metricDefinitions';
import styles from './HistoricalFiscalPanel.module.css';

const HISTORICAL_YEARS = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22'];
const DISPLAY_STATES: Array<{ value: EstimateType; label: string }> = [
  { value: 'BE', label: 'BE' }, { value: 'RE', label: 'RE' },
  { value: 'provisional', label: 'Provisional actual' }, { value: 'final_actual', label: 'Final actual' },
];

type ValueItem = { observation: FinancialObservation | null; amount: number | null; derived: boolean; formula?: string; inputIds?: string[] };
type Props = {
  metric: string;
  financialYear: string;
  onFinancialYearChange: (year: string) => void;
  enableCompare?: boolean;
  realityMode?: boolean;
  className?: string;
};

export default function HistoricalFiscalPanel({ metric, financialYear, onFinancialYearChange, enableCompare = true, realityMode = false, className }: Props) {
  const { t, localizeFormattedValue } = useTranslation();
  const currentYear = getDatasetMetadata().financialYear;
  const [dataset, setDataset] = useState<HistoricalProcessedDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [state, setState] = useState<EstimateType>('BE');
  const [releaseId, setReleaseId] = useState('');
  const [compareOpen, setCompareOpen] = useState(false);
  const [rightYear, setRightYear] = useState('');
  const [rightLoading, setRightLoading] = useState(false);
  const [rightLoadError, setRightLoadError] = useState('');
  const [leftCompareState, setLeftCompareState] = useState<EstimateType>('BE');
  const [rightCompareState, setRightCompareState] = useState<EstimateType>('BE');
  const [leftReleaseId, setLeftReleaseId] = useState('');
  const [rightReleaseId, setRightReleaseId] = useState('');
  const [sourceOpen, setSourceOpen] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setDataset(null);
    setLoadError('');
    setReleaseId('');
    if (financialYear === currentYear) return () => { active = false; };
    setLoading(true);
    loadHistoricalDataset(financialYear).then(data => { if (active) setDataset(data); })
      .catch(error => { if (active) setLoadError(error instanceof Error ? error.message : 'Historical data could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [financialYear, currentYear]);

  const states = useMemo(() => new Set([
    ...(dataset?.observations.filter(item => item.metric === metric).map(item => item.estimateType) ?? []),
    ...((dataset?.evidenceMappings as Array<{ metric: string; estimateType: EstimateType; sourceReported?: boolean }> | undefined)
      ?.filter(item => item.metric === metric && item.sourceReported === false).map(item => item.estimateType) ?? []),
  ]), [dataset, metric]);
  const releaseOptions = useMemo(() => {
    if (!dataset) return [];
    const releases = dataset.observations.filter(item => item.metric === metric && item.estimateType === state);
    const derived = (dataset.evidenceMappings as Array<{ metric: string; estimateType: EstimateType; releaseId?: string; sourceReported?: boolean }> | undefined)
      ?.filter(item => item.metric === metric && item.estimateType === state && item.sourceReported === false) ?? [];
    const unique = new Map(releases.map(item => [item.source.releaseId ?? item.id, item.source.document]));
    for (const item of derived) {
      if (item.releaseId && !unique.has(item.releaseId)) {
        const input = dataset.observations.find(observation => item.releaseId && observation.source.releaseId === item.releaseId);
        unique.set(item.releaseId, input?.source.document ?? item.releaseId);
      }
    }
    return [...unique].map(([id, label]) => ({ id, label }));
  }, [dataset, metric, state]);

  useEffect(() => {
    if (!dataset || releaseOptions.length === 0) return;
    const catalogs = (dataset.releaseCatalog as Array<{ estimateType: EstimateType; releaseId: string; defaultComparisonRelease?: boolean }> | undefined) ?? [];
    const preferred = catalogs.find(item => item.estimateType === state && item.defaultComparisonRelease)?.releaseId;
    setReleaseId(preferred && releaseOptions.some(item => item.id === preferred) ? preferred : releaseOptions.length === 1 ? releaseOptions[0]!.id : '');
  }, [dataset, releaseOptions, state]);

  const value = useMemo(() => findValue(dataset, metric, state, releaseId), [dataset, metric, state, releaseId]);
  const otherStates = useMemo(() => DISPLAY_STATES.filter(item => !states.has(item.value)), [states]);

  const leftDataset = dataset;
  const [rightDataset, setRightDataset] = useState<HistoricalProcessedDataset | null>(null);
  useEffect(() => {
    let active = true;
    setRightDataset(null);
    setRightReleaseId('');
    setRightLoadError('');
    if (!compareOpen || !rightYear) return () => { active = false; };
    setRightLoading(true);
    loadHistoricalDataset(rightYear).then(data => { if (active) setRightDataset(data); })
      .catch(error => { if (active) setRightLoadError(error instanceof Error ? error.message : 'Historical data could not be loaded.'); })
      .finally(() => { if (active) setRightLoading(false); });
    return () => { active = false; };
  }, [compareOpen, rightYear]);

  const leftValue = findValue(leftDataset, metric, leftCompareState, leftReleaseId);
  const rightValue = findValue(rightDataset, metric, rightCompareState, rightReleaseId);
  const leftObservation = leftValue.observation;
  const rightObservation = rightValue.observation;
  const comparison = useMemo(() => createObservationComparison(leftObservation, rightObservation), [leftObservation, rightObservation]);

  const chooseYear = (year: string) => {
    onFinancialYearChange(year);
    if (year === currentYear) setCompareOpen(false);
  };

  const toggleCompare = () => {
    if (!compareOpen) {
      setLeftCompareState(state);
      setRightCompareState(state);
      const index = HISTORICAL_YEARS.indexOf(financialYear);
      const neighbor = HISTORICAL_YEARS[index + 1] ?? HISTORICAL_YEARS[index - 1] ?? '';
      setRightYear(neighbor);
    }
    setCompareOpen(open => !open);
  };

  return <section className={`${styles.panel} ${className ?? ''}`} aria-label={t(realityMode ? 'Historical Budget to Reality' : 'Historical fiscal data')}>
    <div className={styles.toolbar}>
      {!compareOpen && <><label htmlFor={realityMode ? 'reality-fiscal-year' : 'explore-fiscal-year'}>{t('Fiscal year')}</label>
        <select id={realityMode ? 'reality-fiscal-year' : 'explore-fiscal-year'} value={financialYear} onChange={event => chooseYear(event.target.value)}>
          <option value={currentYear}>{t('FY')} {currentYear} · {t('Current')}</option>
          {HISTORICAL_YEARS.map(year => <option key={year} value={year}>{t('FY')} {year}</option>)}
        </select></>}
      {financialYear !== currentYear && enableCompare && <button className={styles.compareButton} type="button" aria-expanded={compareOpen} onClick={toggleCompare}>{t(compareOpen ? 'Close comparison' : 'Compare years')}</button>}
    </div>

    {financialYear === currentYear && <p className={styles.currentNote}>{t('Current FY remains on the live Budget → Reality and Explore data. Historical annual comparisons exclude its YTD actual.')}</p>}
    {loading && <p className={styles.message} role="status">{t('Loading FY')} {financialYear}…</p>}
    {loadError && <p className={styles.error} role="alert">{t('Historical data unavailable')}: {loadError}</p>}

    {dataset && financialYear !== currentYear && !compareOpen && <>
      <h3 className={styles.metricTitle}>{t('FY')} {financialYear} · {t(realityMode ? 'Annual budget states' : 'Selected metric')}</h3>
      <div className={styles.stateGrid}>
        {DISPLAY_STATES.map(item => {
          const available = states.has(item.value);
          const isSelected = state === item.value;
          const stateValue = item.value === state ? value : findValue(dataset, metric, item.value, defaultRelease(dataset, metric, item.value));
          return <button key={item.value} type="button" disabled={!available} aria-pressed={isSelected && available} className={`${styles.stateButton} ${isSelected && available ? styles.stateSelected : ''} ${!available ? styles.stateUnavailable : ''}`} onClick={() => setState(item.value)}>
            <small>{t(item.label)}</small><strong>{realityMode && available ? (stateValue.amount === null ? t('Unavailable') : localizeFormattedValue(formatCurrency(stateValue.amount, { forceUnit: 'crore' }))) : available && isSelected && value.amount !== null ? localizeFormattedValue(formatCurrency(value.amount, { forceUnit: 'crore' })) : t(available ? 'Select state' : 'Unavailable')}{realityMode && stateValue.derived ? ` · ${t('Derived')}` : ''}</strong>
            {!available && item.value === 'final_actual' && financialYear === '2025-26' && <span>{t('No verified final annual account')}</span>}
          </button>;
        })}
      </div>
      {otherStates.length > 0 && <p className={styles.unavailableNote}>{t('Unavailable states remain absent; no value is inferred or set to zero.')}</p>}
      {releaseOptions.length > 1 && state === 'BE' && <div className={styles.releasePicker}><label htmlFor="be-vintage">{t('Budget Estimate release')}</label><select id="be-vintage" value={releaseId} onChange={event => setReleaseId(event.target.value)}><option value="" disabled>{t('Choose release')}</option>{releaseOptions.map(item => <option key={item.id} value={item.id}>{t(item.label.includes('Interim') ? 'Interim Budget' : 'Full Budget')} · {item.label}</option>)}</select>{releaseId && <span>{t(releaseOptions.find(item => item.id === releaseId)?.label.includes('Interim') ? 'Interim release selected' : 'Full Budget release selected')}</span>}</div>}
      <div className={styles.selectedValue}>
        <div><span>{t(stateLabel(state))}{value.derived ? ` · ${t('Derived')}` : ''}</span><strong>{value.amount === null ? t('Unavailable') : localizeFormattedValue(formatCurrency(value.amount, { forceUnit: 'crore' }))}</strong><small>{value.derived ? t('Calculated by Arthrekha from official source observations.') : value.observation?.source.document ?? ''}</small></div>
        {value.observation && <button type="button" className={styles.evidenceButton} onClick={() => setSourceOpen(sourceOpen === 'single' ? null : 'single')} aria-expanded={sourceOpen === 'single'}>{t(sourceOpen === 'single' ? 'Hide source details' : 'View source details')} ↗</button>}
      </div>
      {sourceOpen === 'single' && value.observation && <SourceDetails observation={value.observation} value={value} />}
    </>}

    {dataset && financialYear !== currentYear && compareOpen && <>
      <h3 className={styles.metricTitle}>{t('Compare the same metric')}</h3>
      <div className={styles.compareGrid}>
        <CompareSide title={t('Left year')} year={financialYear} otherYear={rightYear} onYear={chooseYear} state={leftCompareState} onState={setLeftCompareState} dataset={dataset} metric={metric} releaseId={leftReleaseId} onRelease={setLeftReleaseId} value={leftValue} sourceOpen={sourceOpen === 'left'} onSource={() => setSourceOpen(sourceOpen === 'left' ? null : 'left')} />
        <CompareSide title={t('Right year')} year={rightYear} otherYear={financialYear} onYear={setRightYear} state={rightCompareState} onState={setRightCompareState} dataset={rightDataset} metric={metric} releaseId={rightReleaseId} onRelease={setRightReleaseId} value={rightValue} sourceOpen={sourceOpen === 'right'} onSource={() => setSourceOpen(sourceOpen === 'right' ? null : 'right')} />
      </div>
      {rightLoading && <p className={styles.message} role="status">{t('Loading FY')} {rightYear}…</p>}
      {rightLoadError && <p className={styles.error} role="alert">{t('Historical data unavailable')}: {rightLoadError}</p>}
      {rightDataset && <ComparisonSummary comparison={comparison} left={leftValue} right={rightValue} />}
    </>}
  </section>;
}

function findValue(dataset: HistoricalProcessedDataset | null, metric: string, state: EstimateType, releaseId: string): ValueItem {
  if (!dataset) return { observation: null, amount: null, derived: false };
  const observations = dataset.observations as FinancialObservation[];
  const matches = observations.filter(item => item.metric === metric && item.estimateType === state && (!releaseId || item.source.releaseId === releaseId));
  if (matches.length === 1) return { observation: matches[0]!, amount: matches[0]!.amount, derived: false };
  if (matches.length > 1) return { observation: null, amount: null, derived: false };
  const derived = (dataset.evidenceMappings as Array<{ metric: string; estimateType: EstimateType; releaseId?: string; amount: number; formula: string; inputObservationIds: string[]; sourceReported?: boolean; rationale?: string; comparability?: ComparisonStatus }> | undefined)
    ?.filter(item => item.metric === metric && item.estimateType === state && item.sourceReported === false && (!releaseId || item.releaseId === releaseId)) ?? [];
  if (derived.length === 1) {
    const item = derived[0]!;
    const input = observations.find(observation => item.inputObservationIds.includes(observation.id));
    if (!input) return { observation: null, amount: item.amount, derived: true, formula: item.formula, inputIds: item.inputObservationIds };
    const definition = getMetricDefinition(metric);
    const derivedObservation: FinancialObservation = {
      ...input,
      id: `derived:${metric}:${state}:${input.source.releaseId ?? input.id}`,
      metric,
      amount: item.amount,
      source: { ...input.source, dataStatus: 'derived', definition: item.formula, notes: item.rationale ?? 'Calculated from official source observations.' },
      canonicalDefinition: definition?.explanation.technical ?? input.canonicalDefinition ?? '',
      definitionVersion: definition?.definitionVersion ?? input.definitionVersion ?? '1',
      comparisonEligibility: { status: item.comparability ?? 'comparable_with_note', rationale: item.rationale ?? 'This value is derived from official input observations.' },
    };
    return { observation: derivedObservation, amount: item.amount, derived: true, formula: item.formula, inputIds: item.inputObservationIds };
  }
  return { observation: null, amount: null, derived: false };
}

function defaultRelease(dataset: HistoricalProcessedDataset | null, metric: string, state: EstimateType): string {
  if (!dataset) return '';
  const releases = [...new Set(dataset.observations.filter(item => item.metric === metric && item.estimateType === state).map(item => item.source.releaseId ?? item.id))];
  const derived = (dataset.evidenceMappings as Array<{ metric: string; estimateType: EstimateType; releaseId?: string; sourceReported?: boolean }> | undefined)
    ?.filter(item => item.metric === metric && item.estimateType === state && item.sourceReported === false).map(item => item.releaseId).filter((id): id is string => Boolean(id)) ?? [];
  const all = [...new Set([...releases, ...derived])];
  const catalog = (dataset.releaseCatalog as Array<{ estimateType: EstimateType; releaseId: string; defaultComparisonRelease?: boolean }> | undefined) ?? [];
  const preferred = catalog.find(item => item.estimateType === state && item.defaultComparisonRelease)?.releaseId;
  return preferred && all.includes(preferred) ? preferred : all.length === 1 ? all[0]! : '';
}

function stateLabel(state: EstimateType) { return DISPLAY_STATES.find(item => item.value === state)?.label ?? state; }

function CompareSide({ title, year, otherYear, onYear, state, onState, dataset, metric, releaseId, onRelease, value, sourceOpen, onSource }: {
  title: string; year: string; otherYear: string; onYear: (year: string) => void; state: EstimateType; onState: (state: EstimateType) => void;
  dataset: HistoricalProcessedDataset | null; metric: string; releaseId: string; onRelease: (release: string) => void;
  value: ValueItem; sourceOpen: boolean; onSource: () => void;
}) {
  const { t, localizeFormattedValue } = useTranslation();
  const options = [...new Set([
    ...(dataset?.observations.filter(item => item.metric === metric && item.estimateType === state).map(item => item.source.releaseId ?? item.id) ?? []),
    ...((dataset?.evidenceMappings as Array<{ metric: string; estimateType: EstimateType; releaseId?: string; sourceReported?: boolean }> | undefined)
      ?.filter(item => item.metric === metric && item.estimateType === state && item.sourceReported === false).map(item => item.releaseId).filter((id): id is string => Boolean(id)) ?? []),
  ])];
  const catalog = (dataset?.releaseCatalog as Array<{ estimateType: EstimateType; releaseId: string; defaultComparisonRelease?: boolean }> | undefined) ?? [];
  useEffect(() => {
    const preferred = catalog.find(item => item.estimateType === state && item.defaultComparisonRelease)?.releaseId;
    onRelease(preferred && options.includes(preferred) ? preferred : options.length === 1 ? options[0]! : '');
  // Selection changes must recalculate a default release only when this side's data/state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, state, metric]);
  return <article className={styles.compareSide}>
    <h4>{title}</h4>
    <label>{t('Fiscal year')}<select value={year} onChange={event => onYear(event.target.value)}>{HISTORICAL_YEARS.filter(item => item === year || item !== otherYear).map(item => <option key={item} value={item}>{t('FY')} {item}</option>)}</select></label>
    <label>{t('Estimate state')}<select value={state} onChange={event => onState(event.target.value as EstimateType)}>{DISPLAY_STATES.map(item => { const available = dataset?.observations.some(obs => obs.metric === metric && obs.estimateType === item.value) || (dataset?.evidenceMappings as Array<{ metric: string; estimateType: EstimateType; sourceReported?: boolean }> | undefined)?.some(obs => obs.metric === metric && obs.estimateType === item.value && obs.sourceReported === false); return <option key={item.value} value={item.value} disabled={!available}>{t(item.label)}{available ? '' : ` · ${t('Unavailable')}`}</option>; })}</select></label>
    {options.length > 1 && <label>{t('Budget release')}<select value={releaseId} onChange={event => onRelease(event.target.value)}><option value="" disabled>{t('Choose release')}</option>{options.map(id => { const observation = dataset?.observations.find(obs => obs.metric === metric && obs.estimateType === state && obs.source.releaseId === id); return <option key={id} value={id}>{t(observation?.source.document.includes('Interim') ? 'Interim Budget' : 'Full Budget')} · {observation?.source.publishedAt ?? ''}</option>; })}</select></label>}
    <p className={styles.sideState}>{t(stateLabel(state))}{value.derived && ` · ${t('Derived')}`}</p>
    <strong className={styles.sideValue}>{value.amount === null ? t('Unavailable') : localizeFormattedValue(formatCurrency(value.amount, { forceUnit: 'crore' }))}</strong>
    {value.observation && <button className={styles.evidenceButton} type="button" onClick={onSource} aria-expanded={sourceOpen}>{t(sourceOpen ? 'Hide source details' : 'View source details')} ↗</button>}
    {sourceOpen && value.observation && <SourceDetails observation={value.observation} value={value} />}
  </article>;
}

function ComparisonSummary({ comparison, left, right }: { comparison: ObservationComparison; left: ValueItem; right: ValueItem }) {
  const { t, localizeFormattedValue } = useTranslation();
  const status: ComparisonStatus = comparison.status;
  const hasDerived = left.derived || right.derived;
  const absolute = comparison.percentageChangePermitted && left.amount !== null && right.amount !== null ? right.amount - left.amount : null;
  return <div className={styles.comparisonSummary} data-status={status}>
    <span className={styles.status}>{t(status === 'comparable' ? 'Comparable' : status === 'comparable_with_note' ? 'Comparison note' : 'Not comparable')}</span>
    {absolute !== null && <p>{t('Absolute change')}: <strong>{localizeFormattedValue(formatCurrency(absolute, { forceUnit: 'crore' }))}</strong>{comparison.percentageChangePermitted && comparison.percentageChange !== undefined && <> · {t('Percentage change')}: <strong>{localizeFormattedValue(formatPercentage(comparison.percentageChange))}</strong></>}</p>}
    {hasDerived && <p>{t('Derived values are calculated from official observations and are not source-reported.')}</p>}
    {status !== 'comparable' && <p>{t(comparison.rationale)}</p>}
  </div>;
}

function SourceDetails({ observation, value }: { observation: FinancialObservation; value: ValueItem }) {
  const { t } = useTranslation();
  return <details className={styles.sourceDetails}>
    <summary>{t('Detailed provenance')}</summary>
    <dl><dt>{t('Source')}</dt><dd>{observation.source.organization}</dd><dt>{t('Document')}</dt><dd>{observation.source.document}</dd><dt>{t('Published')}</dt><dd>{observation.source.publishedAt ?? t('Not available')}</dd><dt>{t('Retrieved')}</dt><dd>{observation.source.retrievedAt}</dd><dt>{t('Locator')}</dt><dd>{[observation.source.table, observation.source.page && `${t('page')} ${observation.source.page}`, observation.source.row && `${t('row')} ${observation.source.row}`].filter(Boolean).join(' · ') || t('Not available')}</dd><dt>{t('Source wording')}</dt><dd>{observation.source.definition ?? t('Not available')}</dd><dt>{t('Canonical definition')}</dt><dd>{observation.canonicalDefinition ?? t('Not available')} · {t('version')} {observation.definitionVersion ?? t('Not available')}</dd><dt>{t('Source ID / release ID')}</dt><dd>{observation.source.sourceId ?? '—'} / {observation.source.releaseId ?? '—'}</dd><dt>{t('SHA-256')}</dt><dd>{observation.source.sourceHash ?? '—'}</dd>{value.derived && <><dt>{t('Formula')}</dt><dd>{value.formula}</dd><dt>{t('Input observation IDs')}</dt><dd>{value.inputIds?.join(', ')}</dd></>}</dl>
    {observation.source.url && <a href={observation.source.url} target="_blank" rel="noreferrer">{t('Open official source ↗')}</a>}
  </details>;
}
