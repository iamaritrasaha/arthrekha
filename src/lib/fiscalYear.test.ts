import { describe, it, expect } from 'vitest';
import {
  formatFY,
  parseFY,
  getQuarter,
  formatQuarter,
  formatPeriod,
  getFYRange,
  getAllQuarters,
  getMonthsForQuarter,
} from './fiscalYear';

describe('Fiscal Year Utilities', () => {
  describe('formatFY', () => {
    it('formats financial year correctly', () => {
      expect(formatFY(2025)).toBe('2025-26');
      expect(formatFY(2025, { prefix: true })).toBe('FY 2025-26');
    });
  });

  describe('parseFY', () => {
    it('parses financial year strings', () => {
      expect(parseFY('2025-26')).toBe(2025);
      expect(parseFY('FY 2025-26')).toBe(2025);
    });

    it('throws on invalid format', () => {
      expect(() => parseFY('invalid')).toThrow();
    });
  });

  describe('getQuarter', () => {
    it('returns correct quarter for each month', () => {
      expect(getQuarter(4)).toBe('Q1'); // Apr
      expect(getQuarter(6)).toBe('Q1'); // Jun
      expect(getQuarter(7)).toBe('Q2'); // Jul
      expect(getQuarter(9)).toBe('Q2'); // Sep
      expect(getQuarter(10)).toBe('Q3'); // Oct
      expect(getQuarter(12)).toBe('Q3'); // Dec
      expect(getQuarter(1)).toBe('Q4'); // Jan
      expect(getQuarter(3)).toBe('Q4'); // Mar
    });
  });

  describe('formatQuarter', () => {
    it('formats quarters', () => {
      expect(formatQuarter('Q1')).toBe('Apr-Jun');
      expect(formatQuarter('Q2')).toBe('Jul-Sep');
      expect(formatQuarter('Q3')).toBe('Oct-Dec');
      expect(formatQuarter('Q4')).toBe('Jan-Mar');
    });

    it('formats quarters verbosely', () => {
      expect(formatQuarter('Q1', { verbose: true })).toBe('Q1 (Apr-Jun)');
    });
  });

  describe('formatPeriod', () => {
    it('formats various period strings', () => {
      expect(formatPeriod(undefined)).toBe('Full year');
      expect(formatPeriod('q1')).toBe('Apr-Jun');
      expect(formatPeriod('Q2', { verbose: true })).toBe('Q2 (Jul-Sep)');
      expect(formatPeriod('apr-jul')).toBe('Apr-Jul');
      expect(formatPeriod('ytd')).toBe('Year to date');
    });
  });

  describe('getFYRange', () => {
    it('generates range of financial years', () => {
      expect(getFYRange(2020, 2023)).toEqual([2020, 2021, 2022, 2023]);
    });
  });

  describe('getAllQuarters', () => {
    it('returns all quarters in order', () => {
      expect(getAllQuarters()).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    });
  });

  describe('getMonthsForQuarter', () => {
    it('returns correct months for each quarter', () => {
      expect(getMonthsForQuarter('Q1')).toEqual([4, 5, 6]);
      expect(getMonthsForQuarter('Q2')).toEqual([7, 8, 9]);
      expect(getMonthsForQuarter('Q3')).toEqual([10, 11, 12]);
      expect(getMonthsForQuarter('Q4')).toEqual([1, 2, 3]);
    });
  });
});
