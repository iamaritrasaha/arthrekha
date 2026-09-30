import { describe, expect, it } from 'vitest';
import { METRIC_DEFINITIONS, getMetricChildren, getMetricDefinition, getRelatedMetrics, isNavigableFiscalMetric } from './metricDefinitions';
import { FISCAL_DOMAINS } from './domains';
import { getMetricsForDomain } from './selectors';

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

  it('guarantees every metric definition has a non-empty shortName and displayName', () => {
    for (const definition of Object.values(METRIC_DEFINITIONS)) {
      expect(definition.shortName).toBeDefined();
      expect(definition.shortName!.trim().length).toBeGreaterThan(0);
      expect(definition.displayName.trim().length).toBeGreaterThan(0);
    }
  });
});


