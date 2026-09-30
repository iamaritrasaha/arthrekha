import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';
import ExplorePage from './pages/ExplorePage';
import { LanguageProvider } from './i18n';

describe('App routing and navigation', () => {
  it('redirects /insights to the home story route /', async () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/insights']}>
          <App />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders ExplorePage and verifies metric rail buttons across domains have non-empty labels', () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/explore']}>
          <ExplorePage />
        </MemoryRouter>
      </LanguageProvider>
    );

    // Initial domain buttons in the metric rail
    const initialRail = document.querySelector('[class*="metricRail"]');
    expect(initialRail).not.toBeNull();
    const initialButtons = Array.from(initialRail!.querySelectorAll('button'));
    expect(initialButtons.length).toBeGreaterThan(0);
    for (const btn of initialButtons) {
      expect(btn.textContent?.trim().length).toBeGreaterThan(0);
    }

    // Verify all domain tabs and collect all metric buttons across tabs
    const domainTabs = screen.getAllByRole('tab');
    expect(domainTabs.length).toBe(5);

    const seenLabels = new Set<string>();
    for (const tab of domainTabs) {
      fireEvent.click(tab);
      const rail = document.querySelector('[class*="metricRail"]');
      expect(rail).not.toBeNull();
      const metricButtons = Array.from(rail!.querySelectorAll('button'));
      expect(metricButtons.length).toBeGreaterThan(0);
      for (const btn of metricButtons) {
        const text = btn.textContent?.trim() || '';
        expect(text.length).toBeGreaterThan(0);
        seenLabels.add(text);
      }
    }

    // All 43 domain metrics across the 5 domains should have unique non-empty labels
    expect(seenLabels.size).toBe(43);
  });
});
