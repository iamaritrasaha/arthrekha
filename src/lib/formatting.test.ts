import { describe, it, expect } from 'vitest';
import {
  formatIndianNumber,
  formatCrore,
  formatLakhCrore,
  formatCurrency,
  formatPercentage,
  formatChange,
  formatChartAxis,
} from './formatting';

describe('Indian Number Formatting', () => {
  describe('formatIndianNumber', () => {
    it('formats small numbers correctly', () => {
      expect(formatIndianNumber(123)).toBe('123');
      expect(formatIndianNumber(1234)).toBe('1,234');
    });

    it('formats with Indian comma placement', () => {
      expect(formatIndianNumber(12345)).toBe('12,345');
      expect(formatIndianNumber(123456)).toBe('1,23,456');
      expect(formatIndianNumber(1234567)).toBe('12,34,567');
      expect(formatIndianNumber(12345678)).toBe('1,23,45,678');
    });

    it('handles decimals', () => {
      expect(formatIndianNumber(123456.789, 2)).toBe('1,23,456.79');
      expect(formatIndianNumber(1234.567, 1)).toBe('1,234.6');
    });
  });

  describe('formatCrore', () => {
    it('formats crore amounts', () => {
      expect(formatCrore(84392)).toBe('₹84,392 crore');
      expect(formatCrore(123456)).toBe('₹1,23,456 crore');
    });

    it('handles decimals', () => {
      expect(formatCrore(84392.47, 2)).toBe('₹84,392.47 crore');
    });
  });

  describe('formatLakhCrore', () => {
    it('formats lakh crore amounts', () => {
      expect(formatLakhCrore(1070000, 1)).toBe('₹10.7 lakh crore');
      expect(formatLakhCrore(4580000, 1)).toBe('₹45.8 lakh crore');
    });
  });

  describe('formatCurrency', () => {
    it('auto-chooses format based on magnitude', () => {
      expect(formatCurrency(10000)).toBe('₹10,000 crore');
      expect(formatCurrency(100000)).toBe('₹1.0 lakh crore');
    });

    it('respects forceUnit option', () => {
      expect(formatCurrency(10000, { forceUnit: 'lakh-crore' })).toBe('₹0.1 lakh crore');
      expect(formatCurrency(100000, { forceUnit: 'crore' })).toBe('₹1,00,000 crore');
    });

    it('uses compact format for charts', () => {
      expect(formatCurrency(84392, { compact: true })).toBe('₹84.4K Cr');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentages', () => {
      expect(formatPercentage(5.2)).toBe('5.2%');
      expect(formatPercentage(12.345, 2)).toBe('12.35%');
    });
  });

  describe('formatChange', () => {
    it('formats positive changes', () => {
      expect(formatChange(12.3)).toBe('+12.3%');
    });

    it('formats negative changes', () => {
      expect(formatChange(-5.2)).toBe('-5.2%');
    });

    it('handles zero change', () => {
      expect(formatChange(0)).toBe('No change');
    });

    it('optionally hides sign', () => {
      expect(formatChange(12.3, { showSign: false })).toBe('12.3%');
    });
  });

  describe('formatChartAxis', () => {
    it('formats chart axis labels compactly', () => {
      expect(formatChartAxis(100)).toBe('₹100 Cr');
      expect(formatChartAxis(5000)).toBe('₹5.0K Cr');
      expect(formatChartAxis(150000)).toBe('₹1.5L Cr');
    });
  });
});
