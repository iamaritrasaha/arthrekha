export const FISCAL_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] as const;

const PERIOD_INDEX: Record<string, number> = {
  apr: 0,
  'apr-may': 1,
  'apr-jun': 2,
  'apr-jul': 3,
  'apr-aug': 4,
  'apr-sep': 5,
  'apr-oct': 6,
  'apr-nov': 7,
  'apr-dec': 8,
  'apr-jan': 9,
  'apr-feb': 10,
  'apr-mar': 11,
};

export function periodEndIndex(period: string | null | undefined): number {
  return period ? PERIOD_INDEX[period] ?? -1 : -1;
}

export function periodOrder(period: string | null | undefined): number {
  return periodEndIndex(period);
}

export function periodShortLabel(period: string | null | undefined, t: (text: string) => string): string {
  const index = periodEndIndex(period);
  const month = index >= 0 ? FISCAL_MONTHS[index] : undefined;
  return month ? t(month) : t('Period unavailable');
}

export function periodCalendarYear(period: string | null | undefined, financialYear: string): number {
  const startYear = Number(financialYear.slice(0, 4));
  return periodEndIndex(period) >= 9 ? startYear + 1 : startYear;
}

export function currentPeriodText(
  template: string,
  period: string | null | undefined,
  financialYear: string,
  t: (text: string) => string,
): string {
  return t(template)
    .replace('{period}', periodShortLabel(period, t))
    .replace('{year}', String(periodCalendarYear(period, financialYear)));
}
