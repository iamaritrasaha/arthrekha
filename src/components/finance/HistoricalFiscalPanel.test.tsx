import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import * as budgetData from '@/data/budgetData';
import fy2021 from '@/../datasets/processed/union/history/2021-22.json';
import fy2022 from '@/../datasets/processed/union/history/2022-23.json';
import fy2023 from '@/../datasets/processed/union/history/2023-24.json';
import fy2024 from '@/../datasets/processed/union/history/2024-25.json';
import fy2025 from '@/../datasets/processed/union/history/2025-26.json';
import { LanguageProvider } from '@/i18n';
import HistoricalFiscalPanel from './HistoricalFiscalPanel';

const fixtures = { '2021-22': fy2021, '2022-23': fy2022, '2023-24': fy2023, '2024-25': fy2024, '2025-26': fy2025 };
const loadMock = vi.spyOn(budgetData, 'loadHistoricalDataset');

function mount(year = '2026-27', metric = 'fiscal_deficit') {
  return render(<LanguageProvider><HistoricalFiscalPanel metric={metric} financialYear={year} onFinancialYearChange={vi.fn()} /></LanguageProvider>);
}

function StatefulPanel() {
  const [year, setYear] = useState('2025-26');
  return <LanguageProvider><HistoricalFiscalPanel metric="revenue_receipts" financialYear={year} onFinancialYearChange={setYear} /></LanguageProvider>;
}

beforeEach(() => {
  loadMock.mockClear();
  loadMock.mockImplementation(async year => fixtures[year as keyof typeof fixtures] as never);
});

describe('Historical fiscal comparison panel', () => {
  it('keeps current FY as the default and does not request historical data until selected', () => {
    mount();
    expect(screen.getByLabelText('Fiscal year')).toHaveValue('2026-27');
    expect(screen.getByText(/Current FY remains/)).toBeInTheDocument();
    expect(loadMock).not.toHaveBeenCalled();
  });

  it('loads FY 2025-26 only when selected and separates provisional from unavailable final actual', async () => {
    const onYear = vi.fn();
    render(<LanguageProvider><HistoricalFiscalPanel metric="revenue_receipts" financialYear="2026-27" onFinancialYearChange={onYear} /></LanguageProvider>);
    fireEvent.change(screen.getByLabelText('Fiscal year'), { target: { value: '2025-26' } });
    expect(onYear).toHaveBeenCalledWith('2025-26');
    const { unmount } = render(<LanguageProvider><HistoricalFiscalPanel metric="revenue_receipts" financialYear="2025-26" onFinancialYearChange={vi.fn()} /></LanguageProvider>);
    await screen.findByText('FY 2025-26 · Selected metric');
    expect(loadMock).toHaveBeenCalledWith('2025-26');
    expect(screen.getByText('Provisional actual')).toBeInTheDocument();
    expect(screen.getByText('No verified final annual account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Final actual/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Provisional actual/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Provisional actual/ })).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getAllByText(/₹/).length).toBeGreaterThan(0);
    unmount();
  });

  it('uses the full Budget BE by default in FY 2024-25 and permits explicit Interim BE selection', async () => {
    mount('2024-25', 'fiscal_deficit');
    await screen.findByText('FY 2024-25 · Selected metric');
    expect(loadMock).toHaveBeenCalledWith('2024-25');
    const release = screen.getByLabelText('Budget Estimate release');
    expect(release).toHaveValue('union-full-budget-2024-25-be-2024-07-23');
    fireEvent.change(release, { target: { value: 'union-interim-budget-2024-25-be-2024-02-01' } });
    expect(screen.getByText('Interim release selected')).toBeInTheDocument();
  });

  it('selects RE and final actual as separate FY 2024-25 states', async () => {
    mount('2024-25', 'revenue_receipts');
    await screen.findByText('FY 2024-25 · Selected metric');
    const revised = screen.getByRole('button', { name: /RE/ });
    fireEvent.click(revised);
    await waitFor(() => expect(revised).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByText('RE', { selector: 'span' }).parentElement).toHaveTextContent(/₹/);
    const actual = screen.getByRole('button', { name: /Final actual/ });
    expect(actual).toBeEnabled();
    fireEvent.click(actual);
    await waitFor(() => expect(actual).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByText('Final actual', { selector: 'span' }).parentElement).toHaveTextContent(/₹/);
    expect(screen.getByText(/Finance Accounts/)).toBeInTheDocument();
  });

  it('does not replace a selected estimate state when that state is missing in another FY', async () => {
    render(<StatefulPanel />);
    await screen.findByText('FY 2025-26 · Selected metric');
    fireEvent.click(screen.getByRole('button', { name: /Provisional actual/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Provisional actual/ })).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.change(screen.getByLabelText('Fiscal year'), { target: { value: '2024-25' } });
    await screen.findByText('FY 2024-25 · Selected metric');
    expect(screen.getByText('Provisional actual', { selector: 'span' }).parentElement).toHaveTextContent('Unavailable');
  });

  it('labels derived values and keeps them distinct from source-reported observations', async () => {
    mount('2024-25', 'non_borrowed_receipts');
    await screen.findByText('FY 2024-25 · Selected metric');
    expect(screen.getByText(/Derived/)).toBeInTheDocument();
    expect(screen.getByText('Calculated by Arthrekha from official source observations.')).toBeInTheDocument();
  });

  it('compares exactly two historical years and suppresses changes when states differ', async () => {
    mount('2025-26', 'fiscal_deficit');
    await screen.findByText('FY 2025-26 · Selected metric');
    fireEvent.click(screen.getByRole('button', { name: 'Compare years' }));
    const rightSide = screen.getByRole('heading', { name: 'Right year' }).parentElement!;
    await waitFor(() => expect(within(rightSide).getByLabelText('Fiscal year')).toHaveValue('2024-25'));
    await waitFor(() => expect(screen.getByText('Comparable')).toBeInTheDocument());
    expect(screen.getByText(/Absolute change/)).toBeInTheDocument();
    expect(screen.getByText(/Percentage change/)).toBeInTheDocument();
    fireEvent.change(within(rightSide).getByLabelText('Estimate state'), { target: { value: 'RE' } });
    await waitFor(() => expect(screen.getByText('Not comparable')).toBeInTheDocument());
    expect(screen.queryByText(/Absolute change/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Percentage change/)).not.toBeInTheDocument();
    expect(screen.getByText('Estimate states differ; compare the same state.')).toBeInTheDocument();
  });

  it('retains the rationale for an Interim Budget comparison note', async () => {
    mount('2023-24', 'fiscal_deficit');
    await screen.findByText('FY 2023-24 · Selected metric');
    fireEvent.click(screen.getByRole('button', { name: 'Compare years' }));
    const rightSide = screen.getByRole('heading', { name: 'Right year' }).parentElement!;
    fireEvent.change(within(rightSide).getByLabelText('Fiscal year'), { target: { value: '2024-25' } });
    await waitFor(() => expect(within(rightSide).getByLabelText('Budget release')).toBeInTheDocument());
    fireEvent.change(within(rightSide).getByLabelText('Budget release'), { target: { value: 'union-interim-budget-2024-25-be-2024-02-01' } });
    await waitFor(() => expect(screen.getByText('Comparison note')).toBeInTheDocument());
    expect(screen.getByText(/Interim Budget vintage/)).toBeInTheDocument();
  });

  it('keeps current YTD outside historical annual comparison choices', async () => {
    mount('2025-26', 'revenue_receipts');
    await screen.findByText('FY 2025-26 · Selected metric');
    fireEvent.click(screen.getByRole('button', { name: 'Compare years' }));
    await waitFor(() => expect(screen.getByText('Comparable')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText(/Loading FY/)).not.toBeInTheDocument());
    const years = screen.getAllByLabelText('Fiscal year');
    expect(years).toHaveLength(2);
    expect(within(years[1]!).queryByRole('option', { name: /2026-27/ })).not.toBeInTheDocument();
  });

  it('renders English and Bengali fiscal-year controls', () => {
    localStorage.setItem('arthrekha-language', 'bn-IN');
    render(<LanguageProvider><HistoricalFiscalPanel metric="fiscal_deficit" financialYear="2026-27" onFinancialYearChange={vi.fn()} /></LanguageProvider>);
    expect(screen.getByLabelText('অর্থবর্ষ')).toBeInTheDocument();
    localStorage.removeItem('arthrekha-language');
  });
});
