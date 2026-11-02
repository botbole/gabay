import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Calendar, X } from 'lucide-react';
import { calendarApi, type CalendarDay } from '../../api/client';
import { hebrewDayLabel } from '../../lib/hebrewLabels';

const GREG_MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const WEEK_DAY_NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function gregorianLabel(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export interface DatePickerFieldProps {
  label?: string;
  gregorianOnly?: boolean;
  mode: 'gregorian' | 'hebrew';
  onModeChange: (mode: 'gregorian' | 'hebrew') => void;
  gregorianDate: string;
  onGregorianChange: (date: string) => void;
  hebrewDay: string;
  hebrewMonth: string;
  onHebrewDayChange: (day: string) => void;
  onHebrewMonthChange: (month: string) => void;
  onYearPicked?: (gregorianYear: number) => void;
}

function NavBtn({ onClick, title, children }: {
  onClick: () => void; title: string; children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
      {children}
    </button>
  );
}

export function DatePickerField({
  label,
  gregorianOnly = false,
  mode,
  onModeChange,
  gregorianDate,
  onGregorianChange,
  hebrewDay,
  hebrewMonth,
  onHebrewDayChange,
  onHebrewMonthChange,
  onYearPicked,
}: DatePickerFieldProps) {
  const today = new Date();
  const todayDate = todayIso();

  const [viewYear, setViewYear] = useState(
    gregorianDate ? parseInt(gregorianDate.slice(0, 4), 10) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    gregorianDate ? parseInt(gregorianDate.slice(5, 7), 10) - 1 : today.getMonth()
  );
  const [hViewYear, setHViewYear] = useState<number | null>(null);
  const [hViewMonth, setHViewMonth] = useState<number | null>(
    hebrewMonth ? parseInt(hebrewMonth, 10) : null
  );
  const [selHebrewYear, setSelHebrewYear] = useState(0);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const { data: todayHeb } = useQuery({
    queryKey: ['calendar', 'gregorian-to-hebrew', todayDate],
    queryFn: () => calendarApi.gregorianToHebrew(todayDate),
    staleTime: 60 * 60 * 1000,
  });

  const { data: gregHeb } = useQuery({
    queryKey: ['calendar', 'gregorian-to-hebrew', gregorianDate],
    queryFn: () => calendarApi.gregorianToHebrew(gregorianDate),
    enabled: Boolean(gregorianDate),
  });

  const selectedMonth = hebrewMonth ? parseInt(hebrewMonth, 10) : null;
  const selectedDay = hebrewDay ? parseInt(hebrewDay, 10) : null;

  const { data: selectedHebMonth } = useQuery({
    queryKey: ['calendar', 'month-view', selHebrewYear, selectedMonth],
    queryFn: () => calendarApi.monthView(selHebrewYear, selectedMonth as number),
    enabled: mode === 'hebrew' && selHebrewYear > 0 && selectedMonth != null,
  });

  const { data: hebGreg } = useQuery({
    queryKey: ['calendar', 'hebrew-to-gregorian', selHebrewYear, selectedMonth, selectedDay],
    queryFn: () => calendarApi.hebrewToGregorian(
      selHebrewYear,
      selectedMonth as number,
      selectedDay as number,
    ),
    enabled: mode === 'hebrew' && selHebrewYear > 0 && selectedMonth != null && selectedDay != null,
  });

  const resolvedYear = hViewYear ?? todayHeb?.year ?? null;
  const resolvedMonth = hViewMonth ?? todayHeb?.month ?? null;

  const { data: monthData, isLoading: monthLoading } = useQuery({
    queryKey: ['calendar', 'month-view', resolvedYear, resolvedMonth],
    queryFn: () => calendarApi.monthView(resolvedYear as number, resolvedMonth as number),
    enabled: isOpen && mode === 'hebrew' && resolvedYear != null && resolvedMonth != null,
  });

  const openPopup = useCallback(() => {
    if (!btnRef.current) return;
    if (gregorianDate) {
      setViewYear(parseInt(gregorianDate.slice(0, 4), 10));
      setViewMonth(parseInt(gregorianDate.slice(5, 7), 10) - 1);
    }
    if (hebrewMonth) setHViewMonth(parseInt(hebrewMonth, 10));
    const rect = btnRef.current.getBoundingClientRect();
    const popupH = 390;
    const top = window.innerHeight - rect.bottom >= popupH || rect.top < popupH
      ? rect.bottom + 6
      : rect.top - popupH - 6;
    setPopupStyle({
      position: 'fixed',
      top,
      right: window.innerWidth - rect.right,
      width: Math.max(rect.width, 300),
      zIndex: 9999,
    });
    setIsOpen(true);
  }, [gregorianDate, hebrewMonth]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!popupRef.current?.contains(e.target as Node) &&
          !btnRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const prevGregMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextGregMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const showHebrewMonth = (year: number, month: number) => {
    setHViewYear(year);
    setHViewMonth(month === 13 ? 12 : month);
  };

  const handleModeChange = async (newMode: 'gregorian' | 'hebrew') => {
    setYearPickerOpen(false);
    if (newMode === 'hebrew' && gregorianDate) {
      const converted = gregHeb ?? await calendarApi.gregorianToHebrew(gregorianDate);
      setHViewYear(converted.year);
      setHViewMonth(converted.month);
      setSelHebrewYear(converted.year);
    } else if (newMode === 'gregorian' && selHebrewYear && selectedMonth && selectedDay) {
      const converted = hebGreg?.gregorian
        ? hebGreg
        : await calendarApi.hebrewToGregorian(selHebrewYear, selectedMonth, selectedDay);
      if (converted.gregorian) {
        setViewYear(parseInt(converted.gregorian.slice(0, 4), 10));
        setViewMonth(parseInt(converted.gregorian.slice(5, 7), 10) - 1);
      }
    }
    onModeChange(newMode);
  };

  const PAGE_SIZE = 12;

  const openYearPicker = (curYear: number) => {
    setYearPageStart(curYear - 5);
    setYearPickerOpen(true);
  };

  const renderYearPicker = (curYear: number, onSelect: (y: number) => void) => {
    const years = Array.from({ length: PAGE_SIZE }, (_, i) => yearPageStart + i);
    return (
      <div className="mt-1">
        <div className="flex items-center justify-between mb-2">
          <NavBtn onClick={() => setYearPageStart(s => s - PAGE_SIZE)} title="טווח קודם">
            <ChevronsRight className="h-4 w-4" />
          </NavBtn>
          <span className="text-xs text-gray-400">
            {yearPageStart} – {yearPageStart + PAGE_SIZE - 1}
          </span>
          <NavBtn onClick={() => setYearPageStart(s => s + PAGE_SIZE)} title="טווח הבא">
            <ChevronsLeft className="h-4 w-4" />
          </NavBtn>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {years.map(y => (
            <button
              key={y}
              type="button"
              onClick={() => { onSelect(y); setYearPickerOpen(false); }}
              className={`text-xs py-2 rounded-lg text-center transition-colors ${
                y === curYear
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setYearPickerOpen(false)}
          className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 py-1"
        >
          חזרה ללוח
        </button>
      </div>
    );
  };

  let hebDisplay: string | null = null;
  let gregDisplay: string | null = null;
  if (mode === 'gregorian' && gregorianDate) {
    gregDisplay = gregorianLabel(gregorianDate);
    if (!gregorianOnly && gregHeb?.formatted_hebrew) hebDisplay = gregHeb.formatted_hebrew;
  } else if (mode === 'hebrew' && selectedDay && selectedMonth && selHebrewYear && selectedHebMonth) {
    const dayText = selectedHebMonth.days.find(day => day.hebrew_day === selectedDay)?.hebrew_day_str
      ?? hebrewDayLabel(selectedDay);
    hebDisplay = `${dayText} ${selectedHebMonth.month_name_hebrew} ${selectedHebMonth.hebrew_year_str}`;
    if (hebGreg?.gregorian) gregDisplay = gregorianLabel(hebGreg.gregorian);
  }

  const renderGregorian = () => {
    const numDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: numDays }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const selDay = gregorianDate ? parseInt(gregorianDate.slice(8, 10), 10) : null;
    const selY = gregorianDate ? parseInt(gregorianDate.slice(0, 4), 10) : null;
    const selM = gregorianDate ? parseInt(gregorianDate.slice(5, 7), 10) - 1 : null;

    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <NavBtn onClick={() => setViewYear(y => y - 1)} title="שנה קודמת">
              <ChevronsRight className="h-4 w-4" />
            </NavBtn>
            {!yearPickerOpen && (
              <NavBtn onClick={prevGregMonth} title="חודש קודם">
                <ChevronRight className="h-4 w-4" />
              </NavBtn>
            )}
          </div>
          <button
            type="button"
            onClick={() => yearPickerOpen ? setYearPickerOpen(false) : openYearPicker(viewYear)}
            className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors px-2 py-0.5 rounded-lg hover:bg-blue-50"
          >
            {GREG_MONTH_NAMES[viewMonth]} {viewYear}
          </button>
          <div className="flex items-center">
            {!yearPickerOpen && (
              <NavBtn onClick={nextGregMonth} title="חודש הבא">
                <ChevronLeft className="h-4 w-4" />
              </NavBtn>
            )}
            <NavBtn onClick={() => setViewYear(y => y + 1)} title="שנה הבאה">
              <ChevronsLeft className="h-4 w-4" />
            </NavBtn>
          </div>
        </div>

        {yearPickerOpen ? renderYearPicker(viewYear, setViewYear) : (
          <>
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAY_NAMES.map((name, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{name}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const isSel = day === selDay && viewYear === selY && viewMonth === selM;
                const isTod = day === today.getDate() && viewYear === today.getFullYear() && viewMonth === today.getMonth();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const mm = String(viewMonth + 1).padStart(2, '0');
                      const dd = String(day).padStart(2, '0');
                      onGregorianChange(`${viewYear}-${mm}-${dd}`);
                      onYearPicked?.(viewYear);
                      setIsOpen(false);
                    }}
                    className={`text-sm py-1.5 rounded-lg transition-colors ${
                      isSel ? 'bg-blue-600 text-white font-semibold'
                      : isTod ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </>
    );
  };

  const renderHebrew = () => {
    const days = monthData?.days ?? [];
    const firstCol = days[0]?.grid_col ?? 0;
    const cells: (CalendarDay | null)[] = [
      ...Array(firstCol).fill(null),
      ...days,
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <NavBtn
              onClick={() => resolvedYear != null && showHebrewMonth(resolvedYear - 1, resolvedMonth ?? 7)}
              title="שנה קודמת"
            >
              <ChevronsRight className="h-4 w-4" />
            </NavBtn>
            {!yearPickerOpen && (
              <NavBtn
                onClick={() => {
                  if (!monthData) return;
                  setHViewYear(monthData.prev_month.year);
                  setHViewMonth(monthData.prev_month.month);
                }}
                title="חודש קודם"
              >
                <ChevronRight className="h-4 w-4" />
              </NavBtn>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (resolvedYear == null) return;
              if (yearPickerOpen) setYearPickerOpen(false);
              else openYearPicker(resolvedYear);
            }}
            className="text-center hover:bg-blue-50 rounded-lg px-2 py-0.5 transition-colors leading-tight"
          >
            <span className="text-sm font-semibold text-gray-800 hover:text-blue-600 block">
              {monthData?.month_name_hebrew ?? '…'}
            </span>
            <span className="text-xs text-blue-600 block">
              {monthData?.hebrew_year_str ?? resolvedYear ?? ''}
            </span>
          </button>
          <div className="flex items-center">
            {!yearPickerOpen && (
              <NavBtn
                onClick={() => {
                  if (!monthData) return;
                  setHViewYear(monthData.next_month.year);
                  setHViewMonth(monthData.next_month.month);
                }}
                title="חודש הבא"
              >
                <ChevronLeft className="h-4 w-4" />
              </NavBtn>
            )}
            <NavBtn
              onClick={() => resolvedYear != null && showHebrewMonth(resolvedYear + 1, resolvedMonth ?? 7)}
              title="שנה הבאה"
            >
              <ChevronsLeft className="h-4 w-4" />
            </NavBtn>
          </div>
        </div>

        {yearPickerOpen && resolvedYear != null ? renderYearPicker(resolvedYear, (year) => {
          showHebrewMonth(year, resolvedMonth ?? 7);
        }) : monthLoading || !monthData ? (
          <p className="text-sm text-gray-400 text-center py-6">טוען לוח…</p>
        ) : (
          <>
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAY_NAMES.map((name, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{name}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const isSel =
                  day.hebrew_day === selectedDay &&
                  day.hebrew_month === selectedMonth &&
                  day.hebrew_year === selHebrewYear;
                const isTod = day.gregorian_date === todayDate;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onHebrewDayChange(String(day.hebrew_day));
                      onHebrewMonthChange(String(day.hebrew_month));
                      setSelHebrewYear(day.hebrew_year);
                      onYearPicked?.(parseInt(day.gregorian_date.slice(0, 4), 10));
                      setIsOpen(false);
                    }}
                    className={`text-sm py-1.5 rounded-lg transition-colors ${
                      isSel ? 'bg-blue-600 text-white font-semibold'
                      : isTod ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {day.hebrew_day_str}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </>
    );
  };

  const hasDate = !!(hebDisplay || gregDisplay);

  return (
    <div className="flex flex-col gap-1" dir="rtl">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <button
        ref={btnRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openPopup())}
        className={`flex items-center justify-between px-3 py-2 border rounded-lg text-sm w-full bg-white transition-colors ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {!gregorianOnly && (
            <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${
              mode === 'hebrew' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {mode === 'hebrew' ? 'עברי' : 'לועזי'}
            </span>
          )}
          {hasDate ? (
            <span className="flex flex-col leading-tight min-w-0">
              {hebDisplay && (
                <span className="text-gray-900">{hebDisplay}</span>
              )}
              {gregDisplay && (
                <span className={hebDisplay ? 'text-xs text-gray-500' : 'text-gray-900'}>
                  {gregDisplay}
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400">בחר תאריך...</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 mr-2">
          {hasDate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGregorianChange('');
                onHebrewDayChange('');
                onHebrewMonthChange('');
                setSelHebrewYear(0);
              }}
              className="p-0.5 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="נקה תאריך"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          style={popupStyle}
          className="bg-white rounded-xl border border-gray-200 shadow-xl p-4"
          dir="rtl"
        >
          {!gregorianOnly && (
            <div className="flex gap-2 mb-4 pb-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => { void handleModeChange('gregorian'); }}
                className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                  mode === 'gregorian'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                לועזי
              </button>
              <button
                type="button"
                onClick={() => { void handleModeChange('hebrew'); }}
                className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                  mode === 'hebrew'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                עברי
              </button>
            </div>
          )}

          {(gregorianOnly || mode === 'gregorian') ? renderGregorian() : renderHebrew()}
        </div>
      )}
    </div>
  );
}
