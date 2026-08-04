import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Clock,
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Sun,
  Sunset,
  CalendarDays,
  Star,
  GripVertical,
  ArrowUpDown,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import {
  scheduleApi,
  calendarApi,
  type PrayerRule,
  type PrayerRuleCreate,
  type PrayerRuleUpdate,
  type SpecialDay,
  type SpecialDayCreate,
  type DayTimes,
  type CalculatedPrayer,
} from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_TYPES: { id: string; label: string }[] = [
  { id: 'daily',       label: 'יום חול' },
  { id: 'shabbat',     label: 'שבת' },
  { id: 'yom_tov',     label: 'ימים טובים' },
  { id: 'rosh_hashana', label: 'ראש השנה' },
  { id: 'yom_kippur',  label: 'יום כיפור' },
  { id: 'special',     label: 'ימים מיוחדים' },
];

const ANCHORS: { id: string; label: string }[] = [
  { id: 'fixed',                label: 'זמן קבוע' },
  { id: 'alot_hashachar',       label: 'עלות השחר' },
  { id: 'sunrise',              label: 'הנץ החמה' },
  { id: 'chatzot',              label: 'חצות' },
  { id: 'mincha_gedola',        label: 'מנחה גדולה' },
  { id: 'plag_hamincha',        label: 'פלג המנחה' },
  { id: 'sunset',               label: 'שקיעה' },
  { id: 'tzeit',                label: 'צאת הכוכבים' },
  { id: 'candle_lighting',      label: 'הדלקת נרות' },
  { id: 'havdalah',             label: 'מוצאי שבת' },
  { id: 'next_candle_lighting', label: 'הדלקת נרות שבת הבאה' },
  { id: 'tuesday_sunset',       label: 'שקיעת יום שלישי' },
];

const ANCHOR_LABELS: Record<string, string> = Object.fromEntries(
  ANCHORS.map(a => [a.id, a.label])
);

/** Natural chronological order for auto-sort */
const ANCHOR_ORDER: Record<string, number> = {
  alot_hashachar:       0,
  sunrise:              1,
  chatzot:              2,
  mincha_gedola:        3,
  plag_hamincha:        4,
  sunset:               5,
  tuesday_sunset:       5,
  tzeit:                6,
  candle_lighting:      7,
  next_candle_lighting: 7,
  havdalah:             8,
  fixed:                9,
};

// ─── Client-side date helpers ─────────────────────────────────────────────────

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Most recent Friday (inclusive of today if Friday). */
function prevFridayIso(from: Date): string {
  const d = new Date(from);
  // getDay(): 0=Sun, 5=Fri, 6=Sat
  d.setDate(d.getDate() - ((d.getDay() + 2) % 7));
  return toIso(d);
}

/** Next Friday strictly after today (7 days ahead if today is already Friday). */
function nextFridayIso(from: Date): string {
  const d = new Date(from);
  const daysUntil = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (daysUntil === 0 ? 7 : daysUntil));
  return toIso(d);
}

/** Add N days to a date string and return ISO. */
function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

/** Return the JS Date.getDay() (0=Sun…6=Sat) for an ISO date string. */
function jsWeekday(iso: string): number {
  return new Date(iso).getDay();
}

/** Tuesday of the current Jewish week (week starts Sunday). */
function thisTuesdayIso(from: Date): string {
  const d = new Date(from);
  const sunBased = (d.getDay() + 7) % 7; // getDay() already Sun=0
  d.setDate(d.getDate() - sunBased + 2);  // last Sunday + 2
  return toIso(d);
}

/** Next Saturday (including today if it already is Saturday). */
function nextSaturdayIso(from: Date): string {
  const d = new Date(from);
  const daysUntil = (6 - d.getDay() + 7) % 7; // 0 if today is Sat
  d.setDate(d.getDate() + daysUntil);
  return toIso(d);
}

/** Map anchor id → field key inside DayTimes */
const ANCHOR_TO_ZMANIM_KEY: Record<string, keyof DayTimes> = {
  alot_hashachar:       'alot_hashachar',
  sunrise:              'sunrise',
  chatzot:              'chatzot',
  mincha_gedola:        'mincha_gedola',
  plag_hamincha:        'plag_hamincha',
  sunset:               'sunset',
  tzeit:                'tzeit_hakochavim',
  // routed to their correct-date zmanim inside computeRuleTime:
  candle_lighting:      'candle_lighting',   // → nextFriZmanim
  havdalah:             'havdalah',           // → nextSatZmanim
  next_candle_lighting: 'candle_lighting',   // → nextFriZmanim
  tuesday_sunset:       'sunset',            // → tuesdayZmanim
};

function addOffsetToHHMM(timeStr: string, offsetMinutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = Math.max(0, Math.min(h * 60 + m + offsetMinutes, 23 * 60 + 59));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function computeRuleTime(
  rule: PrayerRule,
  todayZmanim: DayTimes | undefined,
  prevFriZmanim: DayTimes | undefined,
  nextFriZmanim: DayTimes | undefined,
  nextSatZmanim: DayTimes | undefined,
  tuesdayZmanim: DayTimes | undefined,
): string | null {
  if (rule.no_auto_time) return null;
  if (rule.free_text) return rule.free_text;
  if (rule.anchor === 'fixed') return rule.exact_time ?? null;

  const isTodaySaturday = new Date().getDay() === 6;

  // Route each anchor to the zmanim dataset for the correct date
  let zmanim: DayTimes | undefined;
  switch (rule.anchor) {
    case 'candle_lighting':
    case 'next_candle_lighting':
      // If viewed on a Saturday, "candle lighting" uses the previous Friday (so it doesn't show next week's time)
      zmanim = isTodaySaturday ? prevFriZmanim : nextFriZmanim;
      break;
    case 'havdalah':
      // havdalah is only non-null on Saturdays (we fetch nextSatZmanim which includes today if today is Sat)
      zmanim = nextSatZmanim;
      break;
    case 'tuesday_sunset':
      zmanim = tuesdayZmanim;
      break;
    default:
      zmanim = todayZmanim;
  }

  if (!zmanim) return null;
  const key = ANCHOR_TO_ZMANIM_KEY[rule.anchor];
  const base = key ? (zmanim[key] as string | null) : null;
  if (!base) return null;
  return addOffsetToHHMM(base, rule.offset_minutes);
}

const HEBREW_MONTHS: { value: number; label: string }[] = [
  { value: 1,  label: 'ניסן' },
  { value: 2,  label: 'אייר' },
  { value: 3,  label: 'סיוון' },
  { value: 4,  label: 'תמוז' },
  { value: 5,  label: 'אב' },
  { value: 6,  label: 'אלול' },
  { value: 7,  label: 'תשרי' },
  { value: 8,  label: 'חשוון' },
  { value: 9,  label: 'כסלו' },
  { value: 10, label: 'טבת' },
  { value: 11, label: 'שבט' },
  { value: 12, label: 'אדר' },
  { value: 13, label: 'אדר ב׳' },
];

function anchorDescription(rule: PrayerRule): string {
  if (rule.anchor === 'fixed') return rule.exact_time ?? '—';
  const base = ANCHOR_LABELS[rule.anchor] ?? rule.anchor;
  if (rule.offset_minutes === 0) return base;
  const sign = rule.offset_minutes > 0 ? '+' : '';
  return `${sign}${rule.offset_minutes} דק׳ מ${base}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Rule Form Modal ──────────────────────────────────────────────────────────

interface RuleFormModalProps {
  open: boolean;
  onClose: () => void;
  dayType: string;
  editRule?: PrayerRule;
  onSaved?: (rule: PrayerRule, isEdit: boolean) => void;
}

function RuleFormModal({ open, onClose, dayType, editRule, onSaved }: RuleFormModalProps) {
  const qc = useQueryClient();
  const isEdit = !!editRule;

  // Parse days_of_week string ("0,1,5") → number[] for local state
  const parseDaysOfWeek = (rule?: PrayerRule): number[] | null => {
    if (!rule?.is_lesson) return null;
    if (rule.days_of_week) {
      const parsed = rule.days_of_week.split(',').map(Number).filter(n => !isNaN(n));
      return parsed.length ? parsed : null;
    }
    if (rule.day_of_week !== null && rule.day_of_week !== undefined) return [rule.day_of_week];
    return null;
  };

  const defaultForm = (): PrayerRuleCreate => ({
    name: editRule?.name ?? '',
    day_type: editRule?.day_type ?? dayType,
    anchor: editRule?.anchor ?? 'sunset',
    offset_minutes: editRule?.offset_minutes ?? 0,
    exact_time: editRule?.exact_time ?? '',
    free_text: editRule?.free_text ?? '',
    no_auto_time: editRule?.no_auto_time ?? false,
    is_lesson: editRule?.is_lesson ?? false,
    days_of_week: parseDaysOfWeek(editRule),
    notes: editRule?.notes ?? '',
    display_order: editRule?.display_order ?? 0,
    is_active: editRule?.is_active ?? true,
  });

  const [form, setForm] = useState<PrayerRuleCreate>(defaultForm);

  const set = (k: keyof PrayerRuleCreate, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: () => scheduleApi.createRule(form),
    onSuccess: (rule) => {
      onSaved?.(rule, false);
      qc.invalidateQueries({ queryKey: ['prayer-rules', dayType] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const update: PrayerRuleUpdate = {
        name: form.name,
        anchor: form.anchor,
        offset_minutes: form.offset_minutes,
        exact_time: form.anchor === 'fixed' ? (form.exact_time || null) : null,
        free_text: form.free_text || null,
        no_auto_time: form.no_auto_time,
        is_lesson: form.is_lesson,
        days_of_week: form.is_lesson ? (form.days_of_week ?? null) : null,
        notes: form.notes,
        display_order: form.display_order,
        is_active: form.is_active,
      };
      return scheduleApi.updateRule(editRule!.id, update);
    },
    onSuccess: (rule) => {
      onSaved?.(rule, true);
      qc.invalidateQueries({ queryKey: ['prayer-rules', dayType] });
      onClose();
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isFixed = form.anchor === 'fixed';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'עריכת כלל תפילה' : 'הוספת כלל תפילה'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="שם התפילה / שיעור"
              placeholder='למשל: שחרית, מנחה, שיעור גמרא'
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col justify-end pb-1">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded accent-green-600"
                checked={!!form.is_lesson}
                onChange={e => {
                set('is_lesson', e.target.checked);
                if (!e.target.checked) set('days_of_week', null);
              }}
              />
              <span className="text-sm font-medium text-green-700">שיעור</span>
            </label>
          </div>
        </div>

        <Select
          label="סוג יום"
          value={form.day_type}
          onChange={e => set('day_type', e.target.value)}
        >
          {DAY_TYPES.map(dt => (
            <option key={dt.id} value={dt.id}>{dt.label}</option>
          ))}
        </Select>

        {/* Day-of-week multi-selector (lessons on weekdays only) */}
        {form.is_lesson && form.day_type === 'daily' && (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500">ימי השיעור:</span>
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* "כל יום" clears the selection */}
              <button
                type="button"
                onClick={() => set('days_of_week', null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  !form.days_of_week || (form.days_of_week as number[]).length === 0
                    ? 'text-white border-green-600'
                    : 'bg-white border-gray-200 text-slate-600 hover:bg-green-50 hover:border-green-300'
                }`}
                style={!form.days_of_week || (form.days_of_week as number[]).length === 0
                  ? { backgroundColor: '#15803d', borderColor: '#15803d' }
                  : undefined}
              >
                כל יום
              </button>
              {[
                { label: "א'", value: 0 },
                { label: "ב'", value: 1 },
                { label: "ג'", value: 2 },
                { label: "ד'", value: 3 },
                { label: "ה'", value: 4 },
                { label: "ערב שבת", value: 5 },
              ].map(opt => {
                const selected = Array.isArray(form.days_of_week) && (form.days_of_week as number[]).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const current: number[] = Array.isArray(form.days_of_week) ? [...(form.days_of_week as number[])] : [];
                      const next = selected
                        ? current.filter(d => d !== opt.value)
                        : [...current, opt.value];
                      set('days_of_week', next.length ? next : null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      selected
                        ? 'text-white border-green-600'
                        : 'bg-white border-gray-200 text-slate-600 hover:bg-green-50 hover:border-green-300'
                    }`}
                    style={selected ? { backgroundColor: '#15803d', borderColor: '#15803d' } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* No-auto-time checkbox */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            id="no_auto_time"
            type="checkbox"
            className="rounded"
            checked={!!form.no_auto_time}
            onChange={e => set('no_auto_time', e.target.checked)}
          />
          <label htmlFor="no_auto_time" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
            ללא זמן אוטומטי
          </label>
          {form.no_auto_time && (
            <span className="text-xs text-slate-400 mr-auto">לא יחושב זמן לפריט זה</span>
          )}
        </div>

        {/* Anchor + offset — dimmed when no_auto_time is on */}
        <div className={form.no_auto_time ? 'opacity-40 pointer-events-none select-none' : ''}>
        <Select
          label="עוגן זמן"
          value={form.anchor}
          onChange={e => set('anchor', e.target.value)}
        >
          {ANCHORS.map(a => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </Select>

        {isFixed ? (
          <Input
            label="שעה מדויקת"
            type="time"
            value={form.exact_time ?? ''}
            onChange={e => set('exact_time', e.target.value)}
          />
        ) : (
          <div className="flex flex-col gap-1 mt-3">
            <label className="text-sm font-medium text-gray-700">
              הזזה בדקות <span className="text-gray-400 font-normal">(שלילי = לפני, חיובי = אחרי)</span>
            </label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={form.offset_minutes}
              onChange={e => set('offset_minutes', parseInt(e.target.value) || 0)}
            />
          </div>
        )}
        </div>

        {/* Free-text time override — hidden when no_auto_time is on */}
        {!form.no_auto_time && <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-medium text-slate-500">
            טקסט חופשי לזמן{' '}
            <span className="font-normal">(מחליף את הזמן המחושב אם מולא)</span>
          </p>
          <Input
            placeholder='למשל: בנץ החמה, חצי שעה לפני שקיעה'
            value={form.free_text ?? ''}
            onChange={e => set('free_text', e.target.value)}
          />
          {form.free_text && (
            <p className="text-xs text-amber-600">
              ⚠️ הזמן המחושב יוסתר — יוצג: «{form.free_text}»
            </p>
          )}
        </div>}

        <Input
          label={form.is_lesson ? 'זמן השיעור' : 'פרטים נוספים (אופציונלי)'}
          placeholder={form.is_lesson ? 'למשל: 18:30, 45 דקות לפני מנחה' : 'למשל: מניין ראשון'}
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            id="is_active"
            type="checkbox"
            className="rounded"
            checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">כלל פעיל</label>
        </div>

        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-red-600">אירעה שגיאה. נסה שנית.</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>ביטול</Button>
          <Button variant="primary" type="submit" loading={isLoading}>
            {isEdit ? 'שמור שינויים' : 'הוסף כלל'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Special Day Form Modal ───────────────────────────────────────────────────

function SpecialDayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SpecialDayCreate>({
    name: '',
    hebrew_month: 7,
    hebrew_day: 1,
    notes: '',
  });
  const set = (k: keyof SpecialDayCreate, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => scheduleApi.createSpecialDay(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['special-days'] }); onClose(); },
  });

  return (
    <Modal open={open} onClose={onClose} title="הוספת יום מיוחד">
      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <Input
          label="שם היום"
          placeholder='למשל: יום ירושלים, יום העצמאות'
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="חודש עברי"
            value={form.hebrew_month}
            onChange={e => set('hebrew_month', parseInt(e.target.value))}
          >
            {HEBREW_MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>

          <Select
            label="יום"
            value={form.hebrew_day}
            onChange={e => set('hebrew_day', parseInt(e.target.value))}
          >
            {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>

        <Input
          label="הערות (אופציונלי)"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />

        {mutation.isError && (
          <p className="text-sm text-red-600">אירעה שגיאה. נסה שנית.</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>ביטול</Button>
          <Button variant="primary" type="submit" loading={mutation.isPending}>הוסף</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Sortable Rule Row ────────────────────────────────────────────────────────

function SortableRuleRow({
  rule,
  calculatedTime,
  onEdit,
  onDelete,
  isDeleting,
}: {
  rule: PrayerRule;
  calculatedTime: string | null | undefined;
  onEdit: (r: PrayerRule) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isLesson = rule.is_lesson;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
        !rule.is_active
          ? 'bg-gray-50 border-gray-100 opacity-60'
          : isLesson
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-gray-200'
      }`}
    >
      {/* Drag handle */}
      <button
        className={`shrink-0 cursor-grab active:cursor-grabbing touch-none ${
          isLesson ? 'text-green-300 hover:text-green-500' : 'text-slate-300 hover:text-slate-500'
        }`}
        {...attributes}
        {...listeners}
        aria-label="גרור לשינוי סדר"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Name + anchor subtitle */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className={`text-sm font-semibold truncate ${isLesson ? 'text-green-800' : 'text-gray-900'}`}>
            {rule.name}
          </p>
          {isLesson && (() => {
            const DAY_LABELS = ["א'", "ב'", "ג'", "ד'", "ה'", "ערב שבת"];
            let days: number[] | null = null;
            if (rule.days_of_week) {
              days = rule.days_of_week.split(',').map(Number).filter(n => !isNaN(n));
            } else if (rule.day_of_week !== null && rule.day_of_week !== undefined) {
              days = [rule.day_of_week];
            }
            if (!days || days.length === 0) return null;
            return (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-100 text-green-700">
                {days.sort((a, b) => a - b).map(d => DAY_LABELS[d] ?? '').filter(Boolean).join(', ')}
              </span>
            );
          })()}
        </div>
        {!rule.no_auto_time && (
          <p className="text-xs text-slate-400">{anchorDescription(rule)}</p>
        )}
      </div>

      {/* Time display — for lessons: notes (lesson time) takes priority */}
      <div className="shrink-0 text-center min-w-18">
        {(() => {
          const isCombined = isLesson && !rule.no_auto_time && !!calculatedTime;
          const display = isLesson
            ? isCombined
              ? rule.notes ? `${calculatedTime} (${rule.notes})` : calculatedTime
              : rule.notes || ''
            : calculatedTime || '';

          return display ? (
            <span
              className={`font-bold leading-none ${
                isLesson && !isCombined
                  ? 'text-green-700 text-sm font-semibold'
                  : isLesson && isCombined
                    ? 'text-green-700 font-mono text-sm font-semibold'
                    : 'font-mono text-xl'
              }`}
              style={!isLesson ? { color: 'var(--color-indigo)' } : undefined}
            >
              {display}
            </span>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          );
        })()}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="p-1.5 text-slate-400 hover:text-indigo-600"
          onClick={() => onEdit(rule)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="p-1.5 text-slate-400 hover:text-red-500"
          onClick={() => onDelete(rule.id)}
          loading={isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Rules Panel ─────────────────────────────────────────────────────────────

function RulesPanel({ dayType }: { dayType: string }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editRule, setEditRule] = useState<PrayerRule | undefined>();
  const [localRuleOverrides, setLocalRuleOverrides] = useState<PrayerRule[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const today = new Date();
  const todayIso   = toIso(today);
  const prevFriIso = prevFridayIso(today);
  const nextFriIso = nextFridayIso(today);
  const nextSatIso = nextSaturdayIso(today);
  const tuesdayIso = thisTuesdayIso(today);

  const { data, isLoading } = useQuery({
    queryKey: ['prayer-rules', dayType],
    queryFn: () => scheduleApi.getRules(dayType),
  });

  // Fetch zmanim for today + the special-anchor dates (all cached 5 min)
  const zmanimOpts = { staleTime: 1000 * 60 * 5 };
  const { data: todayZmanim }   = useQuery({ queryKey: ['zmanim', todayIso],   queryFn: () => calendarApi.dayTimes(todayIso),   ...zmanimOpts });
  const { data: prevFriZmanim } = useQuery({ queryKey: ['zmanim', prevFriIso], queryFn: () => calendarApi.dayTimes(prevFriIso), ...zmanimOpts });
  const { data: nextFriZmanim } = useQuery({ queryKey: ['zmanim', nextFriIso], queryFn: () => calendarApi.dayTimes(nextFriIso), ...zmanimOpts });
  const { data: nextSatZmanim } = useQuery({ queryKey: ['zmanim', nextSatIso], queryFn: () => calendarApi.dayTimes(nextSatIso), ...zmanimOpts });
  const { data: tuesdayZmanim } = useQuery({ queryKey: ['zmanim', tuesdayIso], queryFn: () => calendarApi.dayTimes(tuesdayIso), ...zmanimOpts });

  const localRules = localRuleOverrides ?? data?.rules ?? [];
  const setLocalRules = (
    next: PrayerRule[] | ((current: PrayerRule[]) => PrayerRule[]),
  ) => {
    setLocalRuleOverrides(current => {
      const rules = current ?? data?.rules ?? [];
      return typeof next === 'function' ? next(rules) : next;
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.deleteRule(id),
    onSuccess: (_data, id) => {
      setLocalRules(prev => prev.filter(r => r.id !== id));
      qc.invalidateQueries({ queryKey: ['prayer-rules', dayType] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => scheduleApi.reorderRules(dayType, ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prayer-rules', dayType] }),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localRules.findIndex(r => r.id === active.id);
    const newIndex = localRules.findIndex(r => r.id === over.id);
    const reordered = arrayMove(localRules, oldIndex, newIndex);
    setLocalRules(reordered);
    reorderMutation.mutate(reordered.map(r => r.id));
  }

  function handleAutoSort() {
    const sorted = [...localRules].sort((a, b) => {
      const ao = ANCHOR_ORDER[a.anchor] ?? 99;
      const bo = ANCHOR_ORDER[b.anchor] ?? 99;
      if (ao !== bo) return ao - bo;
      // Both fixed: sort by exact_time string
      return (a.exact_time ?? '').localeCompare(b.exact_time ?? '');
    });
    setLocalRules(sorted);
    reorderMutation.mutate(sorted.map(r => r.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-700">
          {localRules.length} כלל{localRules.length !== 1 ? 'ים' : ''} מוגדר{localRules.length !== 1 ? 'ים' : ''}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            הוסף תפילה או שיעור
          </Button>
          {localRules.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAutoSort}
              loading={reorderMutation.isPending}
              title="מיין לפי סדר הזמנים הטבעי"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              מיין לפי שעה
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : localRules.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="אין כללי תפילה"
          description="הוסף תפילה ראשונה לסוג יום זה"
          action={
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
             הוסף תפילה או שיעור
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={localRules.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {localRules.map(rule => (
                <SortableRuleRow
                  key={rule.id}
                  rule={rule}
                  calculatedTime={computeRuleTime(rule, todayZmanim, prevFriZmanim, nextFriZmanim, nextSatZmanim, tuesdayZmanim)}
                  onEdit={setEditRule}
                  onDelete={id => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <RuleFormModal
        key={addOpen ? 'add-open' : 'add-closed'}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        dayType={dayType}
        onSaved={(rule) => setLocalRules(prev => [...prev, rule])}
      />
      {editRule && (
        <RuleFormModal
          open={!!editRule}
          onClose={() => setEditRule(undefined)}
          dayType={dayType}
          editRule={editRule}
          onSaved={(rule) => setLocalRules(prev => prev.map(r => r.id === rule.id ? rule : r))}
        />
      )}
    </div>
  );
}

// ─── Special Days Panel ───────────────────────────────────────────────────────

function SpecialDaysPanel() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['special-days'],
    queryFn: () => scheduleApi.getSpecialDays(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.deleteSpecialDay(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['special-days'] }),
  });

  const days = data?.days ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {days.length} ימ{days.length !== 1 ? 'ים' : ''} מיוחד{days.length !== 1 ? 'ים' : ''}
        </h3>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          הוסף יום
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : days.length === 0 ? (
        <EmptyState
          icon={Star}
          title="אין ימים מיוחדים"
          description="הוסף ימים מיוחדים כדי לקבל כללי תפילה ייעודיים"
          action={
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              הוסף יום
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {days.map((sd: SpecialDay) => {
            const monthLabel = HEBREW_MONTHS.find(m => m.value === sd.hebrew_month)?.label ?? sd.hebrew_month;
            return (
              <div
                key={sd.id}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-white border-gray-200"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{sd.name}</p>
                  <p className="text-xs text-slate-500">{sd.hebrew_day} {monthLabel}{sd.notes ? ` · ${sd.notes}` : ''}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5 text-slate-400 hover:text-red-500 shrink-0"
                  onClick={() => deleteMutation.mutate(sd.id)}
                  loading={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <SpecialDayModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

// ─── Live Preview Panel ───────────────────────────────────────────────────────

const DAY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DAY_TYPES.map(dt => [dt.id, dt.label])
);

const ZMANIM_LABELS: Record<string, string> = {
  alot_hashachar:   'עלות השחר',
  sunrise:          'הנץ החמה',
  chatzot:          'חצות',
  mincha_gedola:    'מנחה גדולה',
  plag_hamincha:    'פלג המנחה',
  sunset:           'שקיעה',
  tzeit_hakochavim: 'צאת הכוכבים',
  candle_lighting:  'הדלקת נרות',
  havdalah:         'הבדלה',
};

const DAY_LABELS_SHORT = ["א'", "ב'", "ג'", "ד'", "ה'", "ערב שבת"];

function PrayerTable({ prayers }: { prayers: CalculatedPrayer[] }) {
  // Keep the configured display_order from the backend
  const ordered = [...prayers].sort((a, b) => a.display_order - b.display_order);
  return (
    <table className="w-full text-sm">
      <tbody>
        {ordered.map((p, i, arr) => (
          <tr
            key={p.id}
            className={`flex items-center justify-between px-5 py-2.5 ${
              i < arr.length - 1 ? 'border-b border-gray-50' : ''
            } ${!p.is_active ? 'opacity-50' : ''} ${p.is_lesson ? 'bg-green-50' : ''}`}
          >
            <td className="font-medium text-gray-800 flex items-center gap-1.5">
              {p.name}
              {p.is_lesson && (() => {
                const days = p.days_of_week
                  ? p.days_of_week.split(',').map(Number).filter(n => !isNaN(n))
                  : p.day_of_week !== null && p.day_of_week !== undefined
                    ? [p.day_of_week]
                    : null;
                if (!days || days.length === 0) return null;
                return (
                  <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-green-100 text-green-700 shrink-0">
                    {days.sort((a, b) => a - b).map(d => DAY_LABELS_SHORT[d] ?? '').join(', ')}
                  </span>
                );
              })()}
            </td>
            <td className="text-left shrink-0">
              {p.calculated_time ? (
                <span
                  className={`font-mono font-bold text-base`}
                  style={{ color: p.is_lesson ? '#15803d' : 'var(--color-indigo)' }}
                >
                  {p.calculated_time}
                </span>
              ) : !p.is_lesson ? (
                <span className="text-slate-400 text-xs">לא זמין</span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LivePreviewPanel() {
  const [selectedDate, setSelectedDate] = useState(todayIso());

  // Detect if the selected date is Friday (5) or Saturday (6) for erev-shabbat logic
  const selectedWeekday = jsWeekday(selectedDate); // 0=Sun … 5=Fri, 6=Sat
  const isFriday = selectedWeekday === 5;

  // On Friday also load next-day (Shabbat) schedule to show evening prayers
  const nextDayDate = isFriday ? addDaysIso(selectedDate, 1) : null;

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['schedule', selectedDate],
    queryFn: () => scheduleApi.getSchedule(selectedDate),
    enabled: !!selectedDate,
    retry: 1,
  });

  const { data: nextDayData, isFetching: nextFetching } = useQuery({
    queryKey: ['schedule', nextDayDate],
    queryFn: () => scheduleApi.getSchedule(nextDayDate!),
    enabled: !!nextDayDate,
    retry: 1,
  });

  // Zmanim rows sorted by time value; candle_lighting highlighted
  const zmanimEntries = data
    ? (Object.entries(data.zmanim) as [string, string | null][])
        .filter(([k, v]) => k in ZMANIM_LABELS && v !== null)
        .sort(([, a], [, b]) => (a ?? '').localeCompare(b ?? ''))
    : [];

  // On Friday: only show Shabbat prayers that start AT or AFTER candle lighting
  // (i.e. kabbalat shabbat / maariv — not shachrit/musaf which belong Saturday morning)
  // Also explicitly hide "ערבית" from erev shabbat per user request
  const candleLightingTime = isFriday ? (data?.zmanim?.candle_lighting as string | null) : null;
  const erevShabbatPrayers = nextDayData
    ? nextDayData.prayers.filter(p => {
        if (p.name.includes('ערבית')) return false;
        if (!candleLightingTime) return true;
        // Include prayers with no computed time (they show in configured order)
        if (!p.calculated_time) return false;
        return p.calculated_time >= candleLightingTime;
      })
    : [];

  // Filter today's prayers
  const isSaturday = selectedWeekday === 6;
  const todaysPrayers = data?.prayers.filter(p => {
    if (isFriday) {
      // On Friday, daily "מנחה" and "ערבית" are omitted (replaced by erev shabbat)
      if (p.name.includes('מנחה') || p.name.includes('ערבית')) return false;
    }
    if (isSaturday) {
      // On Saturday, "מנחה ערב שבת" (or any prayer before morning) is omitted
      // We assume erev shabbat prayers are those anchored to candle lighting
      if (p.anchor === 'candle_lighting' || p.anchor === 'next_candle_lighting') return false;
    }
    return true;
  }) ?? [];

  const loading = isFetching || nextFetching;

  return (
    <div className="flex flex-col gap-5">
      {/* Date picker */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">בחר תאריך לתצוגה</label>
        <input
          type="date"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}

      {isError && !loading && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-sm text-red-500">שגיאה בטעינת נתוני זמנים</p>
          <p className="text-xs text-slate-400">ייתכן שהשרת אינו זמין או שיש בעיית חיבור</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            נסה שנית
          </Button>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Date info */}
          <div
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-indigo) 6%, transparent)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-indigo)' }}>
              {data.hebrew_date}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {DAY_TYPE_LABELS[data.day_type] ?? data.day_type}
              {data.city ? ` · ${data.city}` : ''}
            </p>
          </div>

          {/* Today's prayer times — sorted by time */}
          {todaysPrayers.length > 0 ? (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: 'var(--color-gold)' }} />
                  זמני התפילות
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 px-0">
                <PrayerTable prayers={todaysPrayers} />
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Clock}
              title="אין תפילות להצגה"
              description="הוסף כללים בפאנל הכללים משמאל"
            />
          )}

          {/* Friday: Shabbat evening prayers only (≥ candle lighting) */}
          {isFriday && erevShabbatPrayers.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-indigo-400" />
                  תפילות ערב שבת
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 px-0">
                <PrayerTable prayers={erevShabbatPrayers} />
              </CardContent>
            </Card>
          )}

          {/* Zmanim reference — sorted by time, candle lighting highlighted */}
          {zmanimEntries.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  זמני היום
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 px-0">
                <table className="w-full text-xs">
                  <tbody>
                    {zmanimEntries.map(([key, val], i) => {
                      const isCandleLight = key === 'candle_lighting';
                      return (
                        <tr
                          key={key}
                          className={`flex items-center justify-between px-5 py-2 ${
                            i < zmanimEntries.length - 1 ? 'border-b border-gray-50' : ''
                          } ${isCandleLight ? 'bg-amber-50 rounded-lg' : ''}`}
                        >
                          <td className={`flex items-center gap-1.5 ${isCandleLight ? 'font-semibold text-amber-700' : 'text-slate-600'}`}>
                            {isCandleLight && <span>🕯️</span>}
                            {ZMANIM_LABELS[key]}
                          </td>
                          <td className={`font-mono ${isCandleLight ? 'font-bold text-amber-700' : 'text-slate-700'}`}>
                            {val}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────────

function GenerateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['schedule-generate'],
    queryFn: () => scheduleApi.generateWeekly(),
    enabled: open,
    staleTime: 0,
  });

  const text = data?.text ?? '';

  function handleCopy() {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="לוח שבועי מחושב">
      <div className="space-y-3">
        {isFetching && (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">מחשב לוח שבועי…</span>
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-600">שגיאה בייצור הלוח. נסה שנית.</p>
        )}
        {!isFetching && text && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                שבת: {data?.shabbat_date ? new Date(data.shabbat_date + 'T12:00:00').toLocaleDateString('he-IL') : ''}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs gap-1">
                  <RefreshCw className="h-3 w-3" />
                  רענן
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-1">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'הועתק!' : 'העתק'}
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              dir="rtl"
              className="w-full h-96 text-sm font-mono rounded-xl border border-gray-200 bg-gray-50 p-4 resize-none focus:outline-none focus:ring-2 leading-relaxed"
              style={{ color: 'var(--color-indigo)' }}
              value={text}
            />
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PrayerSchedule() {
  const [activeTab, setActiveTab] = useState('daily');
  const isSpecialTab = activeTab === 'special';
  const [generateOpen, setGenerateOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="לוח תפילות ושיעורים"
        subtitle="הגדר כללי תפילה לפי סוג יום וראה זמנים מחושבים אוטומטית"
        action={
          <Button variant="primary" onClick={() => setGenerateOpen(true)} className="gap-2">
            <FileText className="h-4 w-4" />
            צור לוח שבועי
          </Button>
        }
      />

      <GenerateModal open={generateOpen} onClose={() => setGenerateOpen(false)} />

      {/* Day-type tabs */}
      <div className="flex gap-1 flex-wrap">
        {DAY_TYPES.map(dt => (
          <button
            key={dt.id}
            onClick={() => setActiveTab(dt.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === dt.id
                ? 'text-white shadow-sm'
                : 'text-slate-600 bg-white border border-gray-200 hover:bg-gray-50'
            }`}
            style={activeTab === dt.id ? { backgroundColor: 'var(--color-indigo)' } : undefined}
          >
            {dt.label}
          </button>
        ))}
      </div>

      {/* Content — two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left: rules editor or special days manager */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" style={{ color: 'var(--color-gold)' }} />
              <CardTitle>
                {isSpecialTab ? 'ניהול ימים מיוחדים' : `כללי תפילה — ${DAY_TYPES.find(d => d.id === activeTab)?.label}`}
              </CardTitle>
            </div>
            {!isSpecialTab && (
              <p className="text-xs text-slate-400 mt-1">
                הגדר עוגן זמן (שקיעה, הנץ…) והזזה בדקות לכל תפילה
              </p>
            )}
          </CardHeader>
          <CardContent>
            {isSpecialTab ? (
              <>
                <p className="text-xs text-slate-500 mb-4">
                  ימים מיוחדים (כגון יום ירושלים, ל״ג בעומר) ישתמשו בכללים שמוגדרים לסוג ״ימים מיוחדים״
                </p>
                <SpecialDaysPanel />
              </>
            ) : (
              <RulesPanel key={activeTab} dayType={activeTab} />
            )}
          </CardContent>
        </Card>

        {/* Right: live preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sunset className="h-4 w-4" style={{ color: 'var(--color-gold)' }} />
              <CardTitle>תצוגה חיה</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              בחר תאריך לחישוב אוטומטי של הזמנים לפי הכללים הפעילים
            </p>
          </CardHeader>
          <CardContent>
            <LivePreviewPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
