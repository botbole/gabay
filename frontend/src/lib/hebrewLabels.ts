import { useQuery } from '@tanstack/react-query';
import { calendarApi, type HebrewMonthInfo } from '../api/client';

const HEBREW_DAY_LABELS: Record<number, string> = {
  1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
  10: 'י', 11: 'יא', 12: 'יב', 13: 'יג', 14: 'יד', 15: 'טו', 16: 'טז',
  17: 'יז', 18: 'יח', 19: 'יט', 20: 'כ', 21: 'כא', 22: 'כב', 23: 'כג',
  24: 'כד', 25: 'כה', 26: 'כו', 27: 'כז', 28: 'כח', 29: 'כט', 30: 'ל',
};

export function hebrewDayLabel(day: number): string {
  return HEBREW_DAY_LABELS[day] ?? String(day);
}

export function useHebrewMonths() {
  return useQuery({
    queryKey: ['calendar', 'months'],
    queryFn: () => calendarApi.months(),
    staleTime: Infinity,
  });
}

export function hebrewMonthLabel(
  month: number,
  months: HebrewMonthInfo[] | undefined,
): string {
  return months?.find(item => item.month === month)?.hebrew ?? String(month);
}

export function formatHebrewDate(
  day: number,
  month: number,
  months: HebrewMonthInfo[] | undefined,
): string {
  if (!day || !month) return '—';
  return `${hebrewDayLabel(day)} ${hebrewMonthLabel(month, months)}`;
}
