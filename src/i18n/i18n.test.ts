import { describe, expect, it } from 'vitest';
import { METRIC_DEFINITIONS } from '@/data/metricDefinitions';
import { bengaliMetricTranslations, localizeMetricDefinition } from './bn-IN-metrics';
import { translateText } from './index';

const bengaliText = /[\u0980-\u09FF]/;

describe('Bengali localization', () => {
  it('covers every metric definition', () => {
    expect(Object.keys(bengaliMetricTranslations).sort()).toEqual(Object.keys(METRIC_DEFINITIONS).sort());

    Object.values(METRIC_DEFINITIONS).forEach(definition => {
      const localized = localizeMetricDefinition(definition, 'bn-IN');
      expect(localized.id).toBe(definition.id);
      expect(localized.displayName).toMatch(bengaliText);
      expect(localized.explanation.short).toMatch(bengaliText);
      expect(localized.explanation.simple).toMatch(bengaliText);
      expect(localized.explanation.whyItMatters).toMatch(bengaliText);
      expect(localized.explanation.technical).toMatch(bengaliText);
    });
  });

  it('preserves the original English definitions', () => {
    Object.values(METRIC_DEFINITIONS).forEach(definition => {
      expect(localizeMetricDefinition(definition, 'en-IN')).toBe(definition);
    });
  });

  it('translates representative content from every public section', () => {
    [
      'Planned expenditure.',
      'Budget → Reality',
      'Where money comes from',
      'Explore the numbers',
      'Understand the system.',
      'Evidence is part',
      'Controller General of Accounts',
      'Opening the fiscal atlas…',
    ].forEach(text => {
      const translated = translateText(text, 'bn-IN');
      expect(translated).not.toBe(text);
      expect(translated).toMatch(bengaliText);
    });
  });
});
