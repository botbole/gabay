import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Calendar, X } from 'lucide-react';

// ─── Hebrew display tables ────────────────────────────────────────────────────

const HEBREW_MONTHS: Record<number, string> = {
  1: 'ניסן', 2: 'אייר', 3: 'סיוון', 4: 'תמוז', 5: 'אב', 6: 'אלול',
  7: 'תשרי', 8: 'חשוון', 9: 'כסלו', 10: 'טבת', 11: 'שבט',
  12: 'אדר', 13: 'אדר ב׳',
};

const HEBREW_DAYS: Record<number, string> = {
  1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
  10: 'י', 11: 'יא', 12: 'יב', 13: 'יג', 14: 'יד', 15: 'טו', 16: 'טז',
  17: 'יז', 18: 'יח', 19: 'יט', 20: 'כ', 21: 'כא', 22: 'כב', 23: 'כג',
  24: 'כד', 25: 'כה', 26: 'כו', 27: 'כז', 28: 'כח', 29: 'כט', 30: 'ל',
};

const GREG_MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const WEEK_DAY_NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']; // Sun(0)…Sat(6)

// ─── Hebrew calendar math ─────────────────────────────────────────────────────
//
// Reference anchor (verified):
//   1 Tishrei 5786 = September 23, 2025 (Tuesday, JS getDay()=2)
//   Unix day = Math.round(new Date('2025-09-23').getTime() / 86400000) = 20354
//
// Day-of-week from Unix day U: ((U % 7) + 4 + 7) % 7
//   (Unix epoch = Jan 1 1970 = Thursday = 4)

const _ANCHOR_YEAR = 5786;
const _ANCHOR_UNIX = Math.round(new Date('2025-09-23').getTime() / 86400000); // 20354

/** Days from the Hebrew epoch to 1 Tishrei of 'year'. */
function hebrewElapsedDays(year: number): number {
  const m = Math.floor((235 * year - 234) / 19);
  const parts = 12084 + 13753 * m;
  let d = m * 29 + Math.floor(parts / 25920);
  if ((3 * (d + 1)) % 7 < 3) d++;
  return d;
}

function isHebrewLeapYear(year: number): boolean {
  return (7 * year + 1) % 19 < 7;
}

function hebrewYearLength(year: number): number {
  return hebrewElapsedDays(year + 1) - hebrewElapsedDays(year);
}

/** Exact number of days in a Hebrew month (handles חשוון/כסלו/אדר). */
function daysInHebrewMonth(year: number, month: number): number {
  if (month === 2 || month === 4 || month === 6 || month === 10 || month === 13) return 29;
  if (month === 12) return isHebrewLeapYear(year) ? 30 : 29;
  if (month === 8) return hebrewYearLength(year) % 10 === 5 ? 30 : 29;
  if (month === 9) return hebrewYearLength(year) % 10 === 3 ? 29 : 30;
  return 30;
}

/**
 * Convert a Hebrew date to Unix days.
 * Uses the known anchor (1 Tishrei 5786 = Unix day 20363) so the
 * absolute value of hebrewElapsedDays() doesn't matter — only the
 * *difference* between years is used.
 */
function hebrewDateToUnixDays(year: number, month: number, day: number): number {
  // Days from anchor year's Tishrei 1 to this date
  const delta = hebrewElapsedDays(year) - hebrewElapsedDays(_ANCHOR_YEAR);
  let offset = delta + day - 1;
  if (month >= 7) {
    for (let m = 7; m < month; m++) offset += daysInHebrewMonth(year, m);
  } else {
    const last = isHebrewLeapYear(year) ? 13 : 12;
    for (let m = 7; m <= last; m++) offset += daysInHebrewMonth(year, m);
    for (let m = 1; m < month; m++) offset += daysInHebrewMonth(year, m);
  }
  return _ANCHOR_UNIX + offset;
}

/** Day-of-week for the 1st of a Hebrew month (0=Sun … 6=Sat). */
function hebrewMonthStartDow(year: number, month: number): number {
  const u = hebrewDateToUnixDays(year, month, 1);
  return ((u % 7) + 4 + 7) % 7;
}

/** Actual current Hebrew year (not a ±1 approximation). */
function todayHebrewYear(): number {
  const todayUnix = Math.round(Date.now() / 86400000);
  let year = _ANCHOR_YEAR + Math.round((todayUnix - _ANCHOR_UNIX) / 365.25);
  while (hebrewDateToUnixDays(year + 1, 7, 1) <= todayUnix) year++;
  while (hebrewDateToUnixDays(year, 7, 1) > todayUnix) year--;
  return year;
}

/** Today's full Hebrew date. */
function todayHebrewDate(): { year: number; month: number; day: number } {
  const t = new Date();
  const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  return gregorianToHebrew(iso) ?? { year: todayHebrewYear(), month: 7, day: 1 };
}

/** Convert a Hebrew date to an ISO Gregorian string (YYYY-MM-DD). */
function hebrewToGregorianISO(year: number, month: number, day: number): string {
  const unixDays = hebrewDateToUnixDays(year, month, day);
  const d = new Date(unixDays * 86400000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Convert a Gregorian ISO date (YYYY-MM-DD) to its Hebrew date. */
function gregorianToHebrew(isoDate: string): { year: number; month: number; day: number } | null {
  if (!isoDate) return null;
  const targetUnix = Math.round(new Date(isoDate).getTime() / 86400000);
  // Find Hebrew year whose Tishrei 1 is <= targetUnix
  let year = _ANCHOR_YEAR + Math.round((targetUnix - _ANCHOR_UNIX) / 365.25);
  while (hebrewDateToUnixDays(year + 1, 7, 1) <= targetUnix) year++;
  while (hebrewDateToUnixDays(year, 7, 1) > targetUnix) year--;

  // Walk through months from Tishrei until we find the right one
  const monthOrder = isHebrewLeapYear(year)
    ? [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6]
    : [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

  let cursor = hebrewDateToUnixDays(year, 7, 1);
  for (const m of monthOrder) {
    const days = daysInHebrewMonth(year, m);
    if (targetUnix < cursor + days) {
      return { year, month: m, day: targetUnix - cursor + 1 };
    }
    cursor += days;
  }
  return null;
}

// ─── Hebrew year → letter notation (e.g. 5786 → תשפ"ו) ───────────────────────

const YEAR_VALS: [number, string][] = [
  [400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'],
  [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'],
  [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'],
  [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'],
  [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א'],
];

/** Returns the correct display name for a Hebrew month, handling leap-year Adar. */
function hebrewMonthName(year: number, month: number): string {
  if (month === 12 && isHebrewLeapYear(year)) return 'אדר א׳';
  return HEBREW_MONTHS[month] ?? String(month);
}

function hebrewYearStr(year: number): string {
  let n = year % 1000;
  let s = '';
  for (const [v, l] of YEAR_VALS) {
    while (n >= v) { s += l; n -= v; }
  }
  return s.length === 1 ? s + "'" : s.slice(0, -1) + '"' + s.slice(-1);
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Small NavBtn ─────────────────────────────────────────────────────────────

function NavBtn({ onClick, title, children }: {
  onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const _todayHeb = todayHebrewDate();

  // ── view state (what month/year the calendar is currently showing) ──────────
  const [viewYear, setViewYear] = useState(
    gregorianDate ? parseInt(gregorianDate.slice(0, 4)) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    gregorianDate ? parseInt(gregorianDate.slice(5, 7)) - 1 : today.getMonth()
  );
  const [hViewYear, setHViewYear] = useState(_todayHeb.year);
  const [hViewMonth, setHViewMonth] = useState(
    hebrewMonth ? parseInt(hebrewMonth) : _todayHeb.month
  );

  // Hebrew year of the last *picked* date (for display in trigger button)
  const [selHebrewYear, setSelHebrewYear] = useState(0);

  // Year picker
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Sync Gregorian view when prop changes
  useEffect(() => {
    if (gregorianDate) {
      setViewYear(parseInt(gregorianDate.slice(0, 4)));
      setViewMonth(parseInt(gregorianDate.slice(5, 7)) - 1);
    }
  }, [gregorianDate]);

  // Sync Hebrew view month when prop changes
  useEffect(() => {
    if (hebrewMonth) setHViewMonth(parseInt(hebrewMonth));
  }, [hebrewMonth]);

  // ── popup positioning ──────────────────────────────────────────────────────
  const openPopup = useCallback(() => {
    if (!btnRef.current) return;
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
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!popupRef.current?.contains(e.target as Node) &&
          !btnRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── month navigation (NO state-inside-state anti-pattern) ─────────────────

  const prevGregMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextGregMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const prevHebMonth = () => {
    if (hViewMonth === 1) {
      const prevYear = hViewYear - 1;
      setHViewYear(prevYear);
      setHViewMonth(isHebrewLeapYear(prevYear) ? 13 : 12);
    } else {
      setHViewMonth(m => m - 1);
    }
  };
  const nextHebMonth = () => {
    const lastMonth = isHebrewLeapYear(hViewYear) ? 13 : 12;
    if (hViewMonth === lastMonth) {
      setHViewYear(y => y + 1);
      setHViewMonth(1);
    } else {
      setHViewMonth(m => m + 1);
    }
  };

  // ── mode toggle with cross-calendar sync ───────────────────────────────────
  const handleModeChange = (newMode: 'gregorian' | 'hebrew') => {
    setYearPickerOpen(false);
    if (newMode === 'hebrew' && gregorianDate) {
      const hDate = gregorianToHebrew(gregorianDate);
      if (hDate) {
        setHViewYear(hDate.year);
        setHViewMonth(hDate.month);
        setSelHebrewYear(hDate.year);
      }
    } else if (newMode === 'gregorian' && selHebrewYear) {
      setViewYear(selHebrewYear - 3760);
    }
    onModeChange(newMode);
  };

  // ── year picker ────────────────────────────────────────────────────────────
  const PAGE_SIZE = 12;

  const openYearPicker = (curYear: number) => {
    setYearPageStart(curYear - 5);
    setYearPickerOpen(true);
  };

  const renderYearPicker = (curYear: number, onSelect: (y: number) => void, isHeb: boolean) => {
    const years = Array.from({ length: PAGE_SIZE }, (_, i) => yearPageStart + i);
    return (
      <div className="mt-1">
        <div className="flex items-center justify-between mb-2">
          <NavBtn onClick={() => setYearPageStart(s => s - PAGE_SIZE)} title="טווח קודם">
            <ChevronsRight className="h-4 w-4" />
          </NavBtn>
          <span className="text-xs text-gray-400">
            {isHeb
              ? `${hebrewYearStr(yearPageStart)} – ${hebrewYearStr(yearPageStart + PAGE_SIZE - 1)}`
              : `${yearPageStart} – ${yearPageStart + PAGE_SIZE - 1}`}
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
              {isHeb ? hebrewYearStr(y) : y}
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

  // ── display labels (both calendars when available) ─────────────────────────
  const buildDisplays = (): { heb: string | null; greg: string | null } => {
    let heb: string | null = null;
    let greg: string | null = null;

    if (mode === 'gregorian') {
      if (!gregorianDate) return { heb: null, greg: null };
      const [y, m, d] = gregorianDate.split('-');
      greg = `${d}/${m}/${y}`;
      if (!gregorianOnly) {
        const hDate = gregorianToHebrew(gregorianDate);
        if (hDate) {
          heb = `${HEBREW_DAYS[hDate.day]} ${hebrewMonthName(hDate.year, hDate.month)} ${hebrewYearStr(hDate.year)}`;
        }
      }
    } else {
      if (!hebrewDay || !hebrewMonth || !selHebrewYear) return { heb: null, greg: null };
      const day = HEBREW_DAYS[parseInt(hebrewDay)] ?? hebrewDay;
      const mon = hebrewMonthName(selHebrewYear, parseInt(hebrewMonth));
      heb = `${day} ${mon} ${hebrewYearStr(selHebrewYear)}`;
      const iso = hebrewToGregorianISO(selHebrewYear, parseInt(hebrewMonth), parseInt(hebrewDay));
      const [y, m, d] = iso.split('-');
      greg = `${d}/${m}/${y}`;
    }

    return { heb, greg };
  };

  // ── Gregorian calendar grid ────────────────────────────────────────────────
  const renderGregorian = () => {
    const numDays  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: numDays }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const selDay = gregorianDate ? parseInt(gregorianDate.slice(8, 10)) : null;
    const selY   = gregorianDate ? parseInt(gregorianDate.slice(0, 4))  : null;
    const selM   = gregorianDate ? parseInt(gregorianDate.slice(5, 7)) - 1 : null;

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

        {yearPickerOpen ? renderYearPicker(viewYear, setViewYear, false) : (
          <>
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAY_NAMES.map((n, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{n}</div>
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

  // ── Hebrew calendar grid ───────────────────────────────────────────────────
  const renderHebrew = () => {
    const numDays  = daysInHebrewMonth(hViewYear, hViewMonth);
    const firstDow = hebrewMonthStartDow(hViewYear, hViewMonth);
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: numDays }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const todHeb = todayHebrewDate();

    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <NavBtn onClick={() => setHViewYear(y => y - 1)} title="שנה קודמת">
              <ChevronsRight className="h-4 w-4" />
            </NavBtn>
            {!yearPickerOpen && (
              <NavBtn onClick={prevHebMonth} title="חודש קודם">
                <ChevronRight className="h-4 w-4" />
              </NavBtn>
            )}
          </div>
          <button
            type="button"
            onClick={() => yearPickerOpen ? setYearPickerOpen(false) : openYearPicker(hViewYear)}
            className="text-center hover:bg-blue-50 rounded-lg px-2 py-0.5 transition-colors leading-tight"
          >
            <span className="text-sm font-semibold text-gray-800 hover:text-blue-600 block">
              {hebrewMonthName(hViewYear, hViewMonth)}
            </span>
            <span className="text-xs text-blue-600 block">
              {hebrewYearStr(hViewYear)}
            </span>
          </button>
          <div className="flex items-center">
            {!yearPickerOpen && (
              <NavBtn onClick={nextHebMonth} title="חודש הבא">
                <ChevronLeft className="h-4 w-4" />
              </NavBtn>
            )}
            <NavBtn onClick={() => setHViewYear(y => y + 1)} title="שנה הבאה">
              <ChevronsLeft className="h-4 w-4" />
            </NavBtn>
          </div>
        </div>

        {yearPickerOpen ? renderYearPicker(hViewYear, setHViewYear, true) : (
          <>
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAY_NAMES.map((n, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{n}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const isSel =
                  day === parseInt(hebrewDay) &&
                  hViewMonth === parseInt(hebrewMonth) &&
                  hViewYear === selHebrewYear;
                const isTod =
                  day === todHeb.day &&
                  hViewMonth === todHeb.month &&
                  hViewYear === todHeb.year;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onHebrewDayChange(String(day));
                      onHebrewMonthChange(String(hViewMonth));
                      setSelHebrewYear(hViewYear);
                      onYearPicked?.(hViewYear - 3760);
                      setIsOpen(false);
                    }}
                    className={`text-sm py-1.5 rounded-lg transition-colors ${
                      isSel ? 'bg-blue-600 text-white font-semibold'
                      : isTod ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {HEBREW_DAYS[day]}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </>
    );
  };

  const { heb: hebDisplay, greg: gregDisplay } = buildDisplays();
  const hasDate = !!(hebDisplay || gregDisplay);

  // ── render ─────────────────────────────────────────────────────────────────
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
                onClick={() => handleModeChange('gregorian')}
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
                onClick={() => handleModeChange('hebrew')}
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
