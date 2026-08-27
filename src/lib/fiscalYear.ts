/**
 * Fiscal Year Utilities
 *
 * India's financial year: April 1 to March 31
 * Quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
 */

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Format financial year
 * Examples: 2025 → "2025-26" | "FY 2025-26"
 */
export function formatFY(startYear: number, options?: { prefix?: boolean }): string {
  const { prefix = false } = options || {};
  const formatted = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  return prefix ? `FY ${formatted}` : formatted;
}

/**
 * Parse financial year string to start year
 * Examples: "2025-26" → 2025 | "FY 2025-26" → 2025
 */
export function parseFY(fy: string): number {
  const match = fy.match(/(\d{4})/);
  if (!match || !match[1]) {
    throw new Error(`Invalid financial year format: ${fy}`);
  }
  return parseInt(match[1], 10);
}

/**
 * Get current financial year
 * If current date is before April 1, FY is (currentYear - 1)
 * If current date is April 1 or later, FY is currentYear
 */
export function getCurrentFY(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Before April (month 0-2 is Jan-Mar) → previous FY
  return month < 3 ? year - 1 : year;
}

/**
 * Get quarter from month (1-12)
 */
export function getQuarter(month: Month): Quarter {
  if (month >= 4 && month <= 6) return 'Q1';
  if (month >= 7 && month <= 9) return 'Q2';
  if (month >= 10 && month <= 12) return 'Q3';
  return 'Q4'; // Jan-Mar
}

/**
 * Get quarter for a given date
 */
export function getQuarterForDate(date: Date): Quarter {
  const month = (date.getMonth() + 1) as Month;
  return getQuarter(month);
}

/**
 * Format quarter
 * Examples: Q1 → "Apr-Jun" | "Q1 (Apr-Jun)"
 */
export function formatQuarter(quarter: Quarter, options?: { verbose?: boolean }): string {
  const { verbose = false } = options || {};

  const quarterMonths: Record<Quarter, string> = {
    Q1: 'Apr-Jun',
    Q2: 'Jul-Sep',
    Q3: 'Oct-Dec',
    Q4: 'Jan-Mar',
  };

  const months = quarterMonths[quarter];
  return verbose ? `${quarter} (${months})` : months;
}

/**
 * Format period string
 * Examples: "apr-jul" → "Apr-Jul" | "q1" → "Q1 (Apr-Jun)"
 */
export function formatPeriod(period: string | undefined, options?: { verbose?: boolean }): string {
  if (!period) return 'Full year';

  const { verbose = false } = options || {};

  // Check if it's a quarter
  const quarterMatch = period.match(/q([1-4])/i);
  if (quarterMatch) {
    const quarter = `Q${quarterMatch[1]}` as Quarter;
    return formatQuarter(quarter, { verbose });
  }

  // Check if it's a month range like "apr-jul"
  const monthMatch = period.match(/([a-z]+)-([a-z]+)/i);
  if (monthMatch && monthMatch[1] && monthMatch[2]) {
    const start = monthMatch[1];
    const end = monthMatch[2];
    return `${capitalize(start)}-${capitalize(end)}`;
  }

  // Check if it's cumulative
  if (period.toLowerCase().includes('ytd') || period.toLowerCase().includes('cumulative')) {
    return 'Year to date';
  }

  return capitalize(period);
}

/**
 * Calculate percentage of fiscal year elapsed
 */
export function getFYProgress(fy: number, asOfDate?: Date): number {
  const date = asOfDate || new Date();
  const fyStart = new Date(fy, 3, 1); // April 1
  const fyEnd = new Date(fy + 1, 2, 31); // March 31 next year

  if (date < fyStart) return 0;
  if (date > fyEnd) return 100;

  const elapsed = date.getTime() - fyStart.getTime();
  const total = fyEnd.getTime() - fyStart.getTime();

  return (elapsed / total) * 100;
}

/**
 * Get all quarters in order
 */
export function getAllQuarters(): Quarter[] {
  return ['Q1', 'Q2', 'Q3', 'Q4'];
}

/**
 * Get months for a quarter
 */
export function getMonthsForQuarter(quarter: Quarter): Month[] {
  const quarterMonths: Record<Quarter, Month[]> = {
    Q1: [4, 5, 6],
    Q2: [7, 8, 9],
    Q3: [10, 11, 12],
    Q4: [1, 2, 3],
  };

  return quarterMonths[quarter];
}

/**
 * Check if a financial year is in the past
 */
export function isFYPast(fy: number): boolean {
  return fy < getCurrentFY();
}

/**
 * Check if a financial year is current
 */
export function isFYCurrent(fy: number): boolean {
  return fy === getCurrentFY();
}

/**
 * Check if a financial year is in the future
 */
export function isFYFuture(fy: number): boolean {
  return fy > getCurrentFY();
}

/**
 * Get a range of financial years
 * Examples: getFYRange(2020, 2025) → [2020, 2021, 2022, 2023, 2024, 2025]
 */
export function getFYRange(startFY: number, endFY: number): number[] {
  const years: number[] = [];
  for (let fy = startFY; fy <= endFY; fy++) {
    years.push(fy);
  }
  return years;
}

/**
 * Helper: capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
