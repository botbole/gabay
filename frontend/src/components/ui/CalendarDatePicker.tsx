import { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { calendarApi, type CalendarDay, type CalendarMonth } from '../../api/client';

const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function gregDateLabel(isoDate: string) {
  const [, m, d] = isoDate.split('-').map(Number);
  return `${d}/${m}`;
}

function DayCell({
  day,
  isToday,
  isSelected,
  onClick,
}: {
  day: CalendarDay;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasHoliday = !!day.holiday_he || day.is_rosh_chodesh;

  let cellBg = 'bg-white hover:bg-blue-50';
  if (day.is_shabbat) cellBg = 'bg-indigo-50 hover:bg-indigo-100';
  if (hasHoliday && !day.is_shabbat) cellBg = 'bg-amber-50 hover:bg-amber-100';
  if (isSelected) cellBg = 'bg-blue-100 hover:bg-blue-200';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full min-h-[64px] p-1.5 rounded-lg border transition-colors text-right ${cellBg} ${
        isToday ? 'ring-2 ring-blue-500' : 'border-gray-100'
      } ${isSelected ? 'border-blue-400' : ''}`}
    >
      <div className="flex flex-col items-start">
        <span className={`text-sm font-bold leading-none ${isToday ? 'text-blue-600' : day.is_shabbat ? 'text-indigo-700' : 'text-gray-800'}`}>
          {day.hebrew_day_str}
        </span>
        <span className="text-[10px] text-gray-400 mt-0.5">{gregDateLabel(day.gregorian_date)}</span>
      </div>

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
      {day.is_shabbat && (
        <div className="text-[9px] font-medium text-indigo-600 mt-0.5 leading-tight truncate">
          {day.parasha_he ? `פרשת ${day.parasha_he}` : 'שבת'}
        </div>
      )}
    </button>
  );
}

function CalendarGrid({
  monthData,
  selectedDate,
  onSelectDay,
}: {
  monthData: CalendarMonth;
  selectedDate?: string;
  onSelectDay: (day: CalendarDay) => void;
}) {
  const today = todayIso();

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

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES_HE.map((name, i) => (
          <div
            key={i}
            className={`text-center text-xs font-semibold py-1.5 rounded-t ${
              i === 6 ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 bg-gray-50'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {grid.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1">
            {row.map((day, ci) =>
              day ? (
                <DayCell
                  key={day.gregorian_date}
                  day={day}
                  isToday={day.gregorian_date === today}
                  isSelected={selectedDate === day.gregorian_date}
                  onClick={() => onSelectDay(day)}
                />
              ) : (
                <div key={ci} className="min-h-[64px] rounded-lg bg-gray-50/50" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarDatePicker({
  value,
  onSelect,
}: {
  value?: string;
  onSelect: (day: CalendarDay, monthData: CalendarMonth) => void;
}) {
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    calendarApi.gregorianToHebrew(value || todayIso()).then(hd => {
      if (!cancelled) {
        setYear(hd.year);
        setMonth(hd.month);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [monthData, setMonthData] = useState<CalendarMonth | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (year === null || month === null) return;
    let cancelled = false;
    setLoading(true);
    calendarApi.monthView(year, month).then(data => {
      if (!cancelled) {
        setMonthData(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [year, month]);

  const goToPrev = () => {
    if (!monthData) return;
    setYear(monthData.prev_month.year);
    setMonth(monthData.prev_month.month);
  };

  const goToNext = () => {
    if (!monthData) return;
    setYear(monthData.next_month.year);
    setMonth(monthData.next_month.month);
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goToPrev}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="חודש קודם"
          disabled={!monthData}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900">
          {monthData ? `${monthData.month_name_hebrew} ${monthData.hebrew_year_str}` : ''}
        </h3>
        <button
          type="button"
          onClick={goToNext}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="חודש הבא"
          disabled={!monthData}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {loading || !monthData ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">טוען לוח...</div>
      ) : (
        <CalendarGrid monthData={monthData} selectedDate={value} onSelectDay={day => onSelect(day, monthData)} />
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200" />
          שבת
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
          חג / ראש חודש
        </div>
      </div>
    </div>
  );
}
