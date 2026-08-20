import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '../../api/client';

const routeLabels: Record<string, string> = {
  '/':            'לוח בקרה',
  '/chat':        'עוזר גבאי AI',
  '/congregants': 'מתפללים',
  '/payments':    'תשלומים',
  '/seating':     'מפת מושבים',
  '/aliyot':      'עליות לתורה',
  '/azkarot':     'אזכרות',
  '/smachot':     'שמחות',
  '/calendar':    'לוח עברי',
  '/schedule':    'לוח תפילות ושיעורים',
  '/bulletin':    'לוח שבועי',
  '/import':      'ייבוא מתפללים',
};

export function Header() {
  const { pathname } = useLocation();
  const label = routeLabels[pathname] ?? 'גבאי';

  const today = new Date();
  const gregStr = today.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const todayIso = today.toISOString().slice(0, 10);
  const { data: hebrewData } = useQuery({
    queryKey: ['hebrew-date', todayIso],
    queryFn: () => calendarApi.gregorianToHebrew(todayIso),
    staleTime: Infinity,
  });

  const hebrewDateStr = hebrewData?.formatted_hebrew ?? '';
  const holidayStr = hebrewData?.holiday_he ?? null;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-black/5 bg-white/80 backdrop-blur-sm"
    >
      <h1 className="text-lg font-bold" style={{ color: 'var(--color-indigo)' }}>
        {label}
      </h1>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {hebrewDateStr && (
          <span className="font-medium" style={{ color: 'var(--color-gold)' }}>
            {hebrewDateStr}
            {holidayStr && (
              <span className="mr-1.5 text-xs font-normal opacity-80">· {holidayStr}</span>
            )}
          </span>
        )}
        {hebrewDateStr && <span className="text-gray-300">|</span>}
        <span>{gregStr}</span>
      </div>
    </header>
  );
}
