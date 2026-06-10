import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Flame, PartyPopper, Star, CalendarDays } from 'lucide-react';
import { calendarApi, type CalendarDay, type CalendarMonth } from '../api/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const OCCASION_LABELS: Record<string, string> = {
  birthday: 'יום הולדת',
  anniversary: 'יום נישואין',
  bar_mitzvah: 'בר מצוה',
  bat_mitzvah: 'בת מצוה',
  brit: 'ברית מילה',
  upsherin: 'חלאקה',
  other: 'שמחה',
};

const RELATION_LABELS: Record<string, string> = {
  father: 'אב',
  mother: 'אם',
  spouse: 'בן/בת זוג',
  sibling: 'אח/אחות',
  child: 'ילד',
  other: 'קרוב',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function gregDateLabel(isoDate: string) {
  const [, m, d] = isoDate.split('-').map(Number);
  return `${d}/${m}`;
}

function gregFullLabel(isoDate: string) {
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function DayCell({
  day,
  showGregorian,
  isToday,
  isSelected,
  onClick,
}: {
  day: CalendarDay;
  showGregorian: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasHoliday = !!day.holiday_he || day.is_rosh_chodesh;
  const hasEvents = day.azkarot.length > 0 || day.smachot.length > 0;

  let cellBg = 'bg-white hover:bg-blue-50';
  if (day.is_shabbat) cellBg = 'bg-indigo-50 hover:bg-indigo-100';
  if (hasHoliday && !day.is_shabbat) cellBg = 'bg-amber-50 hover:bg-amber-100';
  if (isSelected) cellBg = 'bg-blue-100 hover:bg-blue-200';

  return (
    <button
      onClick={onClick}
      className={`relative w-full min-h-[80px] p-1.5 rounded-lg border transition-colors text-right ${cellBg} ${
        isToday ? 'ring-2 ring-blue-500' : 'border-gray-100'
      } ${isSelected ? 'border-blue-400' : ''}`}
    >
      {/* Date number */}
      <div className="flex items-start justify-between mb-0.5">
        <div className="flex flex-col items-start">
          {showGregorian ? (
            <>
              <span className={`text-sm font-bold leading-none ${isToday ? 'text-blue-600' : day.is_shabbat ? 'text-indigo-700' : 'text-gray-800'}`}>
                {gregDateLabel(day.gregorian_date)}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">{day.hebrew_day_str}</span>
            </>
          ) : (
            <>
              <span className={`text-sm font-bold leading-none ${isToday ? 'text-blue-600' : day.is_shabbat ? 'text-indigo-700' : 'text-gray-800'}`}>
                {day.hebrew_day_str}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">{gregDateLabel(day.gregorian_date)}</span>
            </>
          )}
        </div>
        {isToday && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5 shrink-0" />
        )}
      </div>

      {/* Holiday label */}
      {day.holiday_he && (
        <div className="text-[9px] font-medium text-amber-700 bg-amber-100 rounded px-1 py-0.5 truncate mt-0.5 leading-tight">
          {day.holiday_he}
        </div>
      )}
      {!day.holiday_he && day.is_rosh_chodesh && (
        <div className="text-[9px] font-medium text-teal-700 bg-teal-50 rounded px-1 py-0.5 mt-0.5 leading-tight">
          ראש חודש
        </div>
      )}
      {day.is_shabbat && !day.holiday_he && (
        <div className="text-[9px] font-medium text-indigo-600 mt-0.5 leading-tight">שבת</div>
      )}

      {/* Event dots */}
      {hasEvents && (
        <div className="flex gap-0.5 mt-1 flex-wrap">
          {day.azkarot.slice(0, 3).map((_, i) => (
            <span key={`az-${i}`} className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="אזכרה" />
          ))}
          {day.smachot.slice(0, 3).map((_, i) => (
            <span key={`sm-${i}`} className="w-2 h-2 rounded-full bg-pink-400 inline-block" title="שמחה" />
          ))}
          {(day.azkarot.length + day.smachot.length) > 6 && (
            <span className="text-[9px] text-gray-400">+{day.azkarot.length + day.smachot.length - 6}</span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

function DayDetail({ day, showGregorian }: { day: CalendarDay; showGregorian: boolean }) {
  const hasContent = day.holiday_he || day.is_rosh_chodesh || day.is_shabbat || day.azkarot.length > 0 || day.smachot.length > 0;

  return (
    <div className="h-full flex flex-col gap-3 p-4" dir="rtl">
      {/* Date header */}
      <div className="border-b border-gray-100 pb-3">
        <p className="text-xl font-bold text-gray-900">
          {showGregorian ? gregFullLabel(day.gregorian_date) : `${day.hebrew_day_str} ${day.hebrew_month}`}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {showGregorian
            ? `${day.hebrew_day_str} לחודש`
            : day.gregorian_date}
        </p>
      </div>

      {!hasContent && (
        <p className="text-sm text-gray-400 text-center py-4">אין אירועים ביום זה</p>
      )}

      {/* Holiday/Shabbat info */}
      {day.holiday_he && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <Star className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{day.holiday_he}</p>
            {day.holiday_en && <p className="text-xs text-amber-600">{day.holiday_en}</p>}
          </div>
        </div>
      )}
      {!day.holiday_he && day.is_rosh_chodesh && (
        <div className="flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-2">
          <Star className="h-4 w-4 text-teal-500 shrink-0" />
          <p className="text-sm font-semibold text-teal-800">ראש חודש</p>
        </div>
      )}
      {day.is_shabbat && (
        <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2">
          <span className="text-indigo-600 font-bold text-sm">שבת קודש</span>
        </div>
      )}

      {/* Azkarot */}
      {day.azkarot.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">אזכרות</p>
          <div className="space-y-2">
            {day.azkarot.map(a => (
              <div key={a.id} className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                <Flame className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.deceased_name}</p>
                  {a.deceased_hebrew_name && <p className="text-xs text-gray-500">{a.deceased_hebrew_name}</p>}
                  {a.relation && <p className="text-xs text-gray-400">{RELATION_LABELS[a.relation] ?? a.relation}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smachot */}
      {day.smachot.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">שמחות</p>
          <div className="space-y-2">
            {day.smachot.map(s => (
              <div key={s.id} className="flex items-start gap-2 rounded-lg bg-pink-50 border border-pink-100 px-3 py-2">
                <PartyPopper className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {OCCASION_LABELS[s.occasion_type] ?? s.occasion_type}
                  </p>
                  {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                  {s.parasha && <p className="text-xs text-blue-500">פרשת {s.parasha}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  monthData,
  showGregorian,
  selectedDay,
  onSelectDay,
}: {
  monthData: CalendarMonth;
  showGregorian: boolean;
  selectedDay: CalendarDay | null;
  onSelectDay: (day: CalendarDay) => void;
}) {
  const today = todayIso();

  // Build a 7-column grid (col 0=Sun … col 6=Sat)
  const firstCol = monthData.days[0]?.grid_col ?? 0;
  const totalCells = firstCol + monthData.num_days;
  const numRows = Math.ceil(totalCells / 7);

  const grid: (CalendarDay | null)[][] = Array.from({ length: numRows }, () => Array(7).fill(null));
  monthData.days.forEach(day => {
    const pos = firstCol + (day.hebrew_day - 1);
    const row = Math.floor(pos / 7);
    const col = pos % 7;
    if (grid[row]) grid[row][col] = day;
  });

  const dayHeaders = showGregorian ? DAY_NAMES_EN : DAY_NAMES_HE;

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayHeaders.map((name, i) => (
          <div
            key={i}
            className={`text-center text-xs font-semibold py-2 rounded-t ${
              i === 6 ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 bg-gray-50'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="space-y-1">
        {grid.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1">
            {row.map((day, ci) =>
              day ? (
                <DayCell
                  key={day.gregorian_date}
                  day={day}
                  showGregorian={showGregorian}
                  isToday={day.gregorian_date === today}
                  isSelected={selectedDay?.gregorian_date === day.gregorian_date}
                  onClick={() => onSelectDay(day)}
                />
              ) : (
                <div key={ci} className="min-h-[80px] rounded-lg bg-gray-50/50" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Month Header ─────────────────────────────────────────────────────────────

function MonthHeader({
  monthData,
  showGregorian,
  onPrev,
  onNext,
}: {
  monthData: CalendarMonth;
  showGregorian: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Figure out the Gregorian month range for this Hebrew month
  const firstGreg = monthData.days[0]?.gregorian_date ?? '';
  const lastGreg = monthData.days[monthData.days.length - 1]?.gregorian_date ?? '';

  const gregMonthRange = (() => {
    if (!firstGreg || !lastGreg) return '';
    const [y1, m1] = firstGreg.split('-').map(Number);
    const [y2, m2] = lastGreg.split('-').map(Number);
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    if (m1 === m2) return `${months[m1 - 1]} ${y1}`;
    return `${months[m1 - 1]}–${months[m2 - 1]} ${y2}`;
  })();

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrev}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        title="חודש קודם"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          {showGregorian ? gregMonthRange : `${monthData.month_name_hebrew} ${monthData.hebrew_year_str}`}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {showGregorian
            ? `${monthData.month_name_hebrew} ${monthData.hebrew_year_str}`
            : gregMonthRange}
        </p>
      </div>

      <button
        onClick={onNext}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        title="חודש הבא"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200" />
        שבת
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
        חג / ראש חודש
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        אזכרה
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
        שמחה
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        היום
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Calendar() {
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [showGregorian, setShowGregorian] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // Load current Hebrew date on mount
  const { data: todayHebrew } = useQuery({
    queryKey: ['today-hebrew'],
    queryFn: () => calendarApi.gregorianToHebrew(todayIso()),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (todayHebrew && year === null) {
      setYear(todayHebrew.year);
      setMonth(todayHebrew.month);
    }
  }, [todayHebrew, year]);

  const { data: monthData, isLoading, error } = useQuery({
    queryKey: ['calendar-month', year, month],
    queryFn: () => calendarApi.monthView(year!, month!),
    enabled: year !== null && month !== null,
    staleTime: 1000 * 60 * 5,
  });

  const goToPrev = () => {
    if (!monthData) return;
    setYear(monthData.prev_month.year);
    setMonth(monthData.prev_month.month);
    setSelectedDay(null);
  };

  const goToNext = () => {
    if (!monthData) return;
    setYear(monthData.next_month.year);
    setMonth(monthData.next_month.month);
    setSelectedDay(null);
  };

  const goToToday = () => {
    if (todayHebrew) {
      setYear(todayHebrew.year);
      setMonth(todayHebrew.month);
      setSelectedDay(null);
    }
  };

  return (
    <div className="p-6 h-full" dir="rtl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לוח עברי</h1>
          <p className="text-sm text-gray-500 mt-1">שבתות, חגים ואירועי הקהילה</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            היום
          </button>
          {/* Hebrew / Gregorian toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setShowGregorian(false)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                !showGregorian ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              עברי
            </button>
            <button
              onClick={() => setShowGregorian(true)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                showGregorian ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              לועזי
            </button>
          </div>
        </div>
      </div>

      {/* Loading / Error states */}
      {(isLoading || year === null) && (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          טוען לוח...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          שגיאה בטעינת הלוח: {(error as Error).message}
        </div>
      )}

      {monthData && (
        <div className="flex gap-4 h-full">
          {/* Calendar + legend */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4">
              <MonthHeader
                monthData={monthData}
                showGregorian={showGregorian}
                onPrev={goToPrev}
                onNext={goToNext}
              />
              <CalendarGrid
                monthData={monthData}
                showGregorian={showGregorian}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Legend />
              </div>
            </div>
          </div>

          {/* Day detail panel */}
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm h-full min-h-[400px] overflow-y-auto">
              {selectedDay ? (
                <DayDetail day={selectedDay} showGregorian={showGregorian} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <CalendarDays className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">לחץ על יום בלוח לצפייה בפרטים</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

