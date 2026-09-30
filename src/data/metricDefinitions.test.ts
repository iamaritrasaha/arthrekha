import { describe, expect, it } from 'vitest';
import { METRIC_DEFINITIONS, getMetricButtonLabel, getMetricChildren, getMetricDefinition, getRelatedMetrics, isNavigableFiscalMetric, type MetricDefinition } from './metricDefinitions';
import { FISCAL_DOMAINS } from './domains';
import { getMetricsForDomain } from './selectors';
import { localizeMetricDefinition } from '@/i18n/bn-IN-metrics';

describe('professional metric registry', () => {
  it('registers every ingested Budget Estimate metric', () => {
    expect(Object.keys(METRIC_DEFINITIONS)).toHaveLength(44);
  });

  it('explicitly classifies 43 user-facing flow metrics and 1 analytical denominator metric', () => {
    const allMetrics = Object.values(METRIC_DEFINITIONS);
    const navigableMetrics = allMetrics.filter(m => m.isNavigableMetric);
    const analyticalDenominators = allMetrics.filter(m => !m.isNavigableMetric);

    expect(navigableMetrics).toHaveLength(43);
    expect(analyticalDenominators).toHaveLength(1);

    const gdp = analyticalDenominators[0]!;
    expect(gdp.id).toBe('nominal_gdp');
    expect(gdp.classificationType).toBe('denominator');
    expect(gdp.domain).toBe('accounts');
    expect(isNavigableFiscalMetric('nominal_gdp')).toBe(false);

    // Verify all 43 user-facing metrics return true for isNavigableFiscalMetric
    for (const metric of navigableMetrics) {
      expect(isNavigableFiscalMetric(metric.id)).toBe(true);
      expect(metric.domain).not.toBe('accounts');
      expect(metric.classificationType).not.toBe('denominator');
    }
  });

  it('covers all 43 user-facing metrics across the 5 Explore navigation domains with 0 orphaned metrics', () => {
    const domainMetricsSet = new Set<string>();
    for (const domain of FISCAL_DOMAINS) {
      const metrics = getMetricsForDomain(domain.id).filter(id => isNavigableFiscalMetric(id));
      for (const id of metrics) {
        domainMetricsSet.add(id);
      }
    }

    expect(domainMetricsSet.size).toBe(43);
    expect(domainMetricsSet.has('nominal_gdp')).toBe(false);
  });

  it('provides all four progressive explanation levels', () => {
    for (const definition of Object.values(METRIC_DEFINITIONS)) {
      expect(definition.explanation.short.trim(), definition.id).not.toBe('');
      expect(definition.explanation.simple.trim(), definition.id).not.toBe('');
      expect(definition.explanation.whyItMatters.trim(), definition.id).not.toBe('');
      expect(definition.explanation.technical.trim(), definition.id).not.toBe('');
    }
  });

  it('models hierarchy explicitly rather than from display strings', () => {
    expect(getMetricChildren('total_expenditure').map(metric => metric.id)).toEqual(expect.arrayContaining(['revenue_expenditure', 'capital_expenditure', 'effective_capital_expenditure']));
    expect(getMetricDefinition('primary_deficit')?.parentMetric).toBe('fiscal_deficit');
    expect(getMetricDefinition('external_debt_net')?.classificationType).toBe('financing-source');
  });

  it('resolves related concepts', () => {
    expect(getRelatedMetrics('fiscal_deficit').map(metric => metric.id)).toEqual(expect.arrayContaining(['primary_deficit', 'borrowings_and_other_liabilities']));
  });

  it('guarantees every metric definition has a non-empty displayName, and keeps shortName optional', () => {
    const withShortName: string[] = [];
    for (const definition of Object.values(METRIC_DEFINITIONS)) {
      expect(definition.displayName.trim().length).toBeGreaterThan(0);
      if (definition.shortName !== undefined) {
        expect(definition.shortName.trim().length).toBeGreaterThan(0);
        withShortName.push(definition.id);
      }
    }
    // Only metrics with genuine abbreviated forms have shortName defined:
    expect(withShortName.sort()).toEqual(['gst', 'income_tax', 'tax_revenue_net'].sort());
  });

  it('strictly respects the fallback contract: localized shortName -> localized displayName -> canonical shortName -> canonical displayName -> metricId', () => {
    // 1. Localized shortName preferred
    expect(getMetricButtonLabel('m1', { shortName: 'Loc Short', displayName: 'Loc Display' }, { shortName: 'Can Short', displayName: 'Can Display' })).toBe('Loc Short');

    // 2. Falls back to localized displayName when localized shortName is missing or whitespace
    expect(getMetricButtonLabel('m1', { shortName: '   ', displayName: 'Loc Display' }, { shortName: 'Can Short', displayName: 'Can Display' })).toBe('Loc Display');
    expect(getMetricButtonLabel('m1', { displayName: 'Loc Display' }, { shortName: 'Can Short', displayName: 'Can Display' })).toBe('Loc Display');

    // 3. Falls back to canonical shortName when localized names are missing
    expect(getMetricButtonLabel('m1', null, { shortName: 'Can Short', displayName: 'Can Display' })).toBe('Can Short');
    expect(getMetricButtonLabel('m1', { shortName: '', displayName: ' ' }, { shortName: 'Can Short', displayName: 'Can Display' })).toBe('Can Short');

    // 4. Falls back to canonical displayName when shortNames are missing
    expect(getMetricButtonLabel('m1', null, { displayName: 'Can Display' })).toBe('Can Display');
    expect(getMetricButtonLabel('m1', null, { shortName: '  ', displayName: 'Can Display' })).toBe('Can Display');

    // 5. Falls back to metricId when definitions have empty strings or are missing
    expect(getMetricButtonLabel('metric_fallback_id', null, null)).toBe('metric_fallback_id');
    expect(getMetricButtonLabel('metric_fallback_id', { shortName: '', displayName: '' }, { shortName: ' ', displayName: '' })).toBe('metric_fallback_id');
  });

  it('guarantees visible, human-readable button labels for all 43 navigable metrics in both English and Bengali', () => {
    const allMetrics = Object.values(METRIC_DEFINITIONS).filter(m => m.isNavigableMetric);
    expect(allMetrics).toHaveLength(43);

    for (const metric of allMetrics) {
      const enLabel = getMetricButtonLabel(metric.id, metric, metric);
      expect(enLabel.trim().length).toBeGreaterThan(0);
      expect(enLabel).not.toBe(metric.id);

      const bnDef = localizeMetricDefinition(metric, 'bn-IN');
      const bnLabel = getMetricButtonLabel(metric.id, bnDef, metric);
      expect(bnLabel.trim().length).toBeGreaterThan(0);
      expect(bnLabel).not.toBe(metric.id);
    }
  });

  it('regression: reproduces and prevents the blank pill failure mode where only 3 metrics rendered text', () => {
    // In the faulty implementation, ExplorePage rendered: metricDefinition ? localizeMetric(metricDefinition).shortName : metricId
    // Because shortName was only provided for 3 metrics, the faulty render produced undefined for 40 metrics.
    const faultyPillRenderer = (def: MetricDefinition | null, id: string) => {
      return def ? def.shortName : id;
    };

    const faultyResults = Object.values(METRIC_DEFINITIONS).filter(m => m.isNavigableMetric).map(m => ({
      id: m.id,
      rendered: faultyPillRenderer(m, m.id),
    }));

    // In the broken state, only 3 metrics have shortName defined:
    const namedUnderFaulty = faultyResults.filter(r => typeof r.rendered === 'string' && r.rendered.trim().length > 0);
    const blankUnderFaulty = faultyResults.filter(r => r.rendered === undefined);
    expect(namedUnderFaulty.map(r => r.id).sort()).toEqual(['gst', 'income_tax', 'tax_revenue_net'].sort());
    expect(namedUnderFaulty).toHaveLength(3);
    expect(blankUnderFaulty).toHaveLength(40); // 40 narrow blank pills!

    // Under the fixed getMetricButtonLabel contract, all 43 metrics render human-readable text and 0 are blank:
    const fixedResults = Object.values(METRIC_DEFINITIONS).filter(m => m.isNavigableMetric).map(m => ({
      id: m.id,
      rendered: getMetricButtonLabel(m.id, m, m),
    }));

    const namedUnderFixed = fixedResults.filter(r => typeof r.rendered === 'string' && r.rendered.trim().length > 0);
    const blankUnderFixed = fixedResults.filter(r => !r.rendered || r.rendered.trim().length === 0);
    expect(namedUnderFixed).toHaveLength(43);
    expect(blankUnderFixed).toHaveLength(0);
  });
});


