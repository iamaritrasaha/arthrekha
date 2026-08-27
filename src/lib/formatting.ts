/**
 * Indian Number Formatting
 *
 * Formats financial figures in Indian conventions:
 * - Crore (10 million / 1,00,00,000)
 * - Lakh crore (100 billion / 1,00,00,00,00,000)
 * - Indian comma placement (after 3 digits from right, then every 2)
 */

/**
 * Format number with Indian comma placement
 * Examples: 1,234 | 12,345 | 1,23,456 | 12,34,567
 */
export function formatIndianNumber(num: number, decimals = 0): string {
  const parts = num.toFixed(decimals).split('.');
  const integer = parts[0];
  const decimal = parts[1];

  if (!integer) {
    return '0';
  }

  // Indian grouping: last 3 digits, then groups of 2
  const lastThree = integer.slice(-3);
  const remaining = integer.slice(0, -3);

  const formatted = remaining
    ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  return decimal ? `${formatted}.${decimal}` : formatted;
}

/**
 * Format as ₹ crore
 * Examples: ₹84,392 crore | ₹1,23,456 crore
 */
export function formatCrore(crore: number, decimals = 0): string {
  return `₹${formatIndianNumber(crore, decimals)} crore`;
}

/**
 * Format as ₹ lakh crore (used for very large numbers)
 * Examples: ₹10.7 lakh crore | ₹45.8 lakh crore
 */
export function formatLakhCrore(crore: number, decimals = 1): string {
  const lakhCrore = crore / 100000;
  return `₹${formatIndianNumber(lakhCrore, decimals)} lakh crore`;
}

/**
 * Smart formatter: chooses between crore and lakh crore based on magnitude
 * Threshold: use lakh crore for values >= 50,000 crore
 */
export function formatCurrency(crore: number, options?: {
  forceUnit?: 'crore' | 'lakh-crore';
  decimals?: number;
  compact?: boolean;
}): string {
  const { forceUnit, decimals, compact = false } = options || {};

  // Handle compact format first (for charts)
  if (compact) {
    if (crore >= 1000) {
      const thousands = crore / 1000;
      return `₹${thousands.toFixed(1)}K Cr`;
    }
    return formatCrore(crore, decimals ?? 0);
  }

  // Handle forced unit
  if (forceUnit === 'lakh-crore') {
    return formatLakhCrore(crore, decimals ?? 1);
  }

  if (forceUnit === 'crore') {
    return formatCrore(crore, decimals ?? 0);
  }

  // Auto-choose based on magnitude
  if (crore >= 50000) {
    return formatLakhCrore(crore, decimals ?? 1);
  }

  return formatCrore(crore, decimals ?? 0);
}

/**
 * Format as percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format as percentage of GDP/GSDP
 */
export function formatGDPRatio(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}% of GDP`;
}

/**
 * Format year-over-year change
 * Examples: +12.3% | -5.2% | No change
 */
export function formatChange(value: number, options?: {
  showSign?: boolean;
  decimals?: number;
}): string {
  const { showSign = true, decimals = 1 } = options || {};

  if (value === 0) {
    return 'No change';
  }

  const sign = value > 0 ? '+' : '';
  const formatted = value.toFixed(decimals);

  return showSign ? `${sign}${formatted}%` : `${formatted}%`;
}

/**
 * Format number for data tables (precise, with Indian formatting)
 */
export function formatTableNumber(value: number, decimals = 2): string {
  return formatIndianNumber(value, decimals);
}

/**
 * Format compact number for chart axes
 */
export function formatChartAxis(crore: number): string {
  if (crore >= 100000) {
    return `₹${(crore / 100000).toFixed(1)}L Cr`;
  }

  if (crore >= 1000) {
    return `₹${(crore / 1000).toFixed(1)}K Cr`;
  }

  return `₹${crore.toFixed(0)} Cr`;
}

/**
 * Parse number from formatted string (for calculations)
 */
export function parseCurrency(formatted: string): number {
  // Remove ₹, crore, lakh, commas, and spaces
  const cleaned = formatted
    .replace(/[₹,]/g, '')
    .replace(/\s*(lakh\s*)?crore?\s*/gi, '')
    .trim();

  return parseFloat(cleaned) || 0;
}
