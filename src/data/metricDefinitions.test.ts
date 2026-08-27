import { describe, expect, it } from 'vitest';
import { METRIC_DEFINITIONS, getMetricChildren, getMetricDefinition, getRelatedMetrics } from './metricDefinitions';

describe('professional metric registry', () => {
  it('registers every ingested Budget Estimate metric', () => {
    expect(Object.keys(METRIC_DEFINITIONS)).toHaveLength(44);
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
});
