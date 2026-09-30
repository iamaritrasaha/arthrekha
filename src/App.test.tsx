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

  it('renders ExplorePage and verifies all 43 metric rail buttons across domains have non-empty visible labels in both English and Bengali', () => {
    // 1. English rendering verification
    const { unmount } = render(
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

    let totalEnButtonsSeen = 0;
    const seenEnLabels = new Set<string>();
    for (const tab of domainTabs) {
      fireEvent.click(tab);
      const rail = document.querySelector('[class*="metricRail"]');
      expect(rail).not.toBeNull();
      const metricButtons = Array.from(rail!.querySelectorAll('button'));
      expect(metricButtons.length).toBeGreaterThan(0);
      for (const btn of metricButtons) {
        totalEnButtonsSeen++;
        const text = btn.textContent?.trim() || '';
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toBe('undefined');
        expect(text).not.toBe('null');
        seenEnLabels.add(text);
      }
    }

    // Regression check: all 43 metrics must have unique visible labels, never collapsing to only 3 named buttons
    expect(totalEnButtonsSeen).toBe(43);
    expect(seenEnLabels.size).toBe(43);
    expect(seenEnLabels.size).toBeGreaterThan(3);

    unmount();

    // 2. Bengali rendering verification
    window.localStorage.setItem('arthrekha-language', 'bn-IN');
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/explore']}>
          <ExplorePage />
        </MemoryRouter>
      </LanguageProvider>
    );

    const bnTabs = screen.getAllByRole('tab');
    expect(bnTabs.length).toBe(5);

    let totalBnButtonsSeen = 0;
    const seenBnLabels = new Set<string>();
    for (const tab of bnTabs) {
      fireEvent.click(tab);
      const rail = document.querySelector('[class*="metricRail"]');
      expect(rail).not.toBeNull();
      const metricButtons = Array.from(rail!.querySelectorAll('button'));
      expect(metricButtons.length).toBeGreaterThan(0);
      for (const btn of metricButtons) {
        totalBnButtonsSeen++;
        const text = btn.textContent?.trim() || '';
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toBe('undefined');
        expect(text).not.toBe('null');
        seenBnLabels.add(text);
      }
    }

    expect(totalBnButtonsSeen).toBe(43);
    expect(seenBnLabels.size).toBe(43);
    expect(seenBnLabels.size).toBeGreaterThan(3);

    // Clean up local storage
    window.localStorage.removeItem('arthrekha-language');
  });
});
