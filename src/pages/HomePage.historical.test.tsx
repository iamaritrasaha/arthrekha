import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import * as budgetData from '@/data/budgetData';
import fy2025 from '@/../datasets/processed/union/history/2025-26.json';
import { LanguageProvider } from '@/i18n';
import HomePage from './HomePage';

vi.spyOn(budgetData, 'loadHistoricalDataset').mockImplementation(async () => fy2025 as never);
const loadMock = vi.mocked(budgetData.loadHistoricalDataset);

beforeEach(() => loadMock.mockClear());

describe('Budget to Reality historical mode', () => {
  it('keeps the current YTD view default and opens annual history only on request', async () => {
    render(<LanguageProvider><HomePage /></LanguageProvider>);
    expect(screen.getByText('Actual data through Aug 2026')).toBeInTheDocument();
    expect(loadMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Explore historical Budget → Reality' }));
    await screen.findByText('FY 2025-26 · Annual budget states');
    expect(loadMock).toHaveBeenCalledWith('2025-26');
  });

  it('shows BE, RE, provisional actual and unavailable final actual as separate annual states', async () => {
    render(<LanguageProvider><HomePage /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Explore historical Budget → Reality' }));
    await screen.findByText('FY 2025-26 · Annual budget states');
    const states = screen.getByRole('region', { name: 'Historical Budget to Reality' });
    expect(within(states).getByRole('button', { name: /BE/ })).toHaveTextContent(/₹/);
    expect(within(states).getByRole('button', { name: /RE/ })).toHaveTextContent(/₹/);
    expect(within(states).getByRole('button', { name: /Provisional actual/ })).toHaveTextContent(/₹/);
    expect(within(states).getByRole('button', { name: /Final actual/ })).toBeDisabled();
    expect(within(states).getByText('No verified final annual account')).toBeInTheDocument();
  });

  it('never offers FY 2026–27 YTD as an annual comparison year', async () => {
    render(<LanguageProvider><HomePage /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Explore historical Budget → Reality' }));
    await screen.findByText('FY 2025-26 · Annual budget states');
    fireEvent.click(screen.getByRole('button', { name: 'Compare years' }));
    const selects = screen.getAllByLabelText('Fiscal year');
    await waitFor(() => expect(selects).toHaveLength(2));
    expect(within(selects[0]!).queryByRole('option', { name: /2026-27/ })).not.toBeInTheDocument();
    expect(within(selects[1]!).queryByRole('option', { name: /2026-27/ })).not.toBeInTheDocument();
  });
});
