import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as budgetData from '@/data/budgetData';
import ExplorePage from './ExplorePage';
import { LanguageProvider } from '@/i18n';
import { FISCAL_DOMAINS, getFiscalDomain } from '@/data/domains';
import { getMetricsForDomain } from '@/data/selectors';
import { getMetricButtonLabel, getMetricDefinition, isNavigableFiscalMetric } from '@/data/metricDefinitions';

const loadMock = vi.spyOn(budgetData, 'loadHistoricalDataset');

beforeEach(() => {
  loadMock.mockClear();
  loadMock.mockResolvedValue({ financialYear: '2025-26', observations: [], derivedMetrics: [], schemaVersion: 1, availableEstimateStates: [] });
});

describe('Explore historical year control', () => {
  it('defaults to FY 2026-27 synchronously without requesting historical assets', () => {
    render(<MemoryRouter initialEntries={['/explore']}><LanguageProvider><ExplorePage /></LanguageProvider></MemoryRouter>);
    expect(screen.getByLabelText('Fiscal year')).toHaveValue('2026-27');
    expect(loadMock).not.toHaveBeenCalled();
  });

  it('keeps all 43 navigable fiscal metric labels available across domain tabs', () => {
    const { container } = render(<MemoryRouter initialEntries={['/explore']}><LanguageProvider><ExplorePage /></LanguageProvider></MemoryRouter>);
    let metricCount = 0;
    for (const domain of FISCAL_DOMAINS) {
      fireEvent.click(screen.getByRole('tab', { name: new RegExp(getFiscalDomain(domain.id)?.label ?? domain.label, 'i') }));
      const metrics = getMetricsForDomain(domain.id).filter(id => isNavigableFiscalMetric(id));
      metricCount += metrics.length;
      const rail = container.querySelector<HTMLElement>('div[class*="metricRail"]')!;
      const pressedButtons = rail.querySelectorAll('button[aria-pressed]');
      expect(pressedButtons.length).toBe(metrics.length);
      for (const id of metrics) {
        const canonical = getMetricDefinition(id);
        expect(within(rail).getByRole('button', { name: getMetricButtonLabel(id, canonical, canonical) })).toBeInTheDocument();
      }
    }
    expect(metricCount).toBe(43);
  });
});
