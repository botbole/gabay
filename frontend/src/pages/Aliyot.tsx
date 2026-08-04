import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, BookOpen, DollarSign, User, Calendar, Trash2 } from 'lucide-react';
import {
  aliyotApi,
  congregantsApi,
  paymentsApi,
  type Aliya,
  type AliyaCreate,
  type CalendarDay,
  type CalendarMonth,
} from '../api/client';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { CalendarDatePicker } from '../components/ui/CalendarDatePicker';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

// ─── Constants ───────────────────────────────────────────────────────────────

const ALIYA_TYPES = [
  { value: 'kohen', label: 'כהן' },
  { value: 'levi', label: 'לוי' },
  { value: 'shlishi', label: 'שלישי' },
  { value: "revi'i", label: "רביעי" },
  { value: 'chamishi', label: 'חמישי' },
  { value: 'shishi', label: 'שישי' },
  { value: "shvi'i", label: "שביעי" },
  { value: 'maftir', label: 'מפטיר' },
];

const ALIYA_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ALIYA_TYPES.map(t => [t.value, t.label])
);

const MINHAG_OPTIONS = [
  { value: '', label: 'לא צוין' },
  { value: 'ashkenaz', label: 'אשכנז' },
  { value: 'sephard', label: 'ספרד' },
  { value: 'mizrahi', label: 'מזרחי' },
  { value: 'hasidic', label: 'חסידי' },
];

// ─── Add Aliya Modal ──────────────────────────────────────────────────────────

const WEEKDAY_HE: Record<number, string> = {
  0: 'יום שני', 1: 'יום שלישי', 2: 'יום רביעי', 3: 'יום חמישי', 4: 'יום שישי', 5: 'שבת קודש', 6: 'יום ראשון',
};

function AddAliyaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AliyaCreate>({
    congregant_id: '',
    parasha: '',
    aliya_type: 'kohen',
    date_str: new Date().toISOString().slice(0, 10),
    minhag: '',
    donation_amount: 0,
    notes: '',
  });
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: congregantsData } = useQuery({
    queryKey: ['congregants'],
    queryFn: () => congregantsApi.list(),
  });

  const mutation = useMutation({
    mutationFn: () => aliyotApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aliyot'] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({ congregant_id: '', parasha: '', aliya_type: 'kohen', date_str: new Date().toISOString().slice(0, 10), minhag: '', donation_amount: 0, notes: '' });
    setSelectedDay(null);
    setShowDatePicker(false);
  };

  const set = (field: keyof AliyaCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = field === 'donation_amount' ? Number(e.target.value) : e.target.value;
      setForm(prev => ({ ...prev, [field]: val }));
    };

  const dayIdentification = (day: CalendarDay, monthData: CalendarMonth) => {
    // שבת - פרשת השבוע. חג/צום (גם באמצע שבוע, שני/חמישי) - שם החג של אותו יום עצמו.
    // יום חול רגיל - אין לו "שם", מזהים אותו לפי התאריך העברי שלו.
    if (day.is_shabbat && day.parasha_he) return day.parasha_he;
    if (day.holiday_he) return day.holiday_he;
    if (day.is_shabbat) return 'שבת קודש';
    return `${WEEKDAY_HE[day.day_of_week] ?? ''} ${day.hebrew_day_str} ${monthData.month_name_hebrew} ${monthData.hebrew_year_str}`.trim();
  };

  const handleSelectDay = (day: CalendarDay, monthData: CalendarMonth) => {
    setSelectedDay(day);
    setForm(prev => ({ ...prev, date_str: day.gregorian_date, parasha: dayIdentification(day, monthData) }));
    setShowDatePicker(false);
  };

  const canSubmit = !!form.congregant_id && !!form.parasha && !!form.date_str && !!form.aliya_type;

  return (
    <>
    <Modal open={open} onClose={() => { onClose(); resetForm(); }} title="הוספת עלייה לתורה" size="lg">
      <div className="space-y-4" dir="rtl">
        <Select label="מתפלל *" value={form.congregant_id} onChange={set('congregant_id')}>
          <option value="">בחר מתפלל...</option>
          {(congregantsData?.congregants ?? []).map(c => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}
              {c.is_kohen ? ' (כהן)' : c.is_levi ? ' (לוי)' : ''}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Select label="סוג עלייה *" value={form.aliya_type} onChange={set('aliya_type')}>
            {ALIYA_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך *</label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-800">{form.date_str || 'בחר תאריך...'}</span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Parasha (auto-derived from the selected date, editable) */}
        <div>
          <Input
            label="פרשה / זיהוי היום *"
            value={form.parasha}
            onChange={set('parasha')}
            placeholder="נבחר אוטומטית מהלוח, ניתן לערוך ידנית"
          />
          {selectedDay && (
            <p className="text-xs text-gray-400 mt-1">
              {WEEKDAY_HE[selectedDay.day_of_week] ?? ''}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="מנהג" value={form.minhag} onChange={set('minhag')}>
            {MINHAG_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          <Input
            label="נדבה / תרומה (₪)"
            type="number"
            min={0}
            value={form.donation_amount}
            onChange={set('donation_amount')}
            placeholder="0"
          />
        </div>

        {(form.donation_amount ?? 0) > 0 && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>תשלום של ₪{form.donation_amount} יירשם אוטומטית עם שמירת העלייה</span>
          </div>
        )}

        <Input label="הערות" value={form.notes} onChange={set('notes')} placeholder="הערות נוספות..." />

        {mutation.error && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}
        <div className="flex justify-start gap-3 pt-2">
          <Button variant="secondary" onClick={() => { onClose(); resetForm(); }}>ביטול</Button>
          <Button loading={mutation.isPending} disabled={!canSubmit} onClick={() => mutation.mutate()}>
            שמור עלייה
          </Button>
        </div>
      </div>
    </Modal>
    <Modal open={showDatePicker} onClose={() => setShowDatePicker(false)} title="בחר תאריך עלייה" size="md">
      <CalendarDatePicker value={form.date_str} onSelect={handleSelectDay} />
    </Modal>
    </>
  );
}

// ─── Aliya Row ────────────────────────────────────────────────────────────────

function AliyaRow({ a, congregantName, checked, onToggle }: {
  a: Aliya;
  congregantName: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <tr className={`hover:bg-slate-50 transition-colors ${checked ? 'bg-slate-50' : ''}`}>
      <td className="px-3 py-3">
        <input type="checkbox" checked={checked} onChange={onToggle}
          className="rounded border-gray-300 cursor-pointer" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#2E3A59] shrink-0" />
          <span className="text-sm font-medium text-gray-900">{a.parasha}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-[#2E3A59]/10 text-[#2E3A59]">
          {ALIYA_TYPE_LABELS[a.aliya_type] ?? a.aliya_type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          {congregantName}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{a.date || '—'}</td>
      <td className="px-4 py-3">
        {a.donation_amount > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <DollarSign className="h-3 w-3" />₪{a.donation_amount}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{a.minhag || '—'}</td>
    </tr>
  );
}

// ─── Congregant History Card ──────────────────────────────────────────────────

function CongregantHistoryPanel({ congregantId, congregantName, onClose }: {
  congregantId: string;
  congregantName: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['aliyot-history', congregantId],
    queryFn: () => aliyotApi.history(congregantId),
    enabled: !!congregantId,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments-history', congregantId],
    queryFn: () => paymentsApi.history(congregantId),
    enabled: !!congregantId,
  });

  const aliyaPayments = paymentsData?.payments.filter(p => p.purpose === 'aliya') ?? [];

  return (
    <Modal open={true} onClose={onClose} title={`היסטוריה עבור ${congregantName}`} size="lg">
      <div className="space-y-4" dir="rtl">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-4">טוען...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 text-white shadow-sm bg-linear-to-br from-[#2E3A59] to-[#3d4f7a] text-center">
                <p className="text-3xl font-bold tracking-tight">{data?.total_aliyot ?? 0}</p>
                <p className="text-xs text-white/70 mt-0.5">סה״כ עליות</p>
              </div>
              <div className="rounded-2xl p-4 text-white shadow-sm bg-linear-to-br from-emerald-600 to-emerald-500 text-center">
                <p className="text-3xl font-bold tracking-tight">₪{aliyaPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                <p className="text-xs text-white/70 mt-0.5">סה״כ נדבות</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="px-3 py-2">פרשה</th>
                    <th className="px-3 py-2">עלייה</th>
                    <th className="px-3 py-2">תאריך</th>
                    <th className="px-3 py-2">נדבה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.aliyot ?? []).map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{a.parasha}</td>
                      <td className="px-3 py-2 text-blue-600">{ALIYA_TYPE_LABELS[a.aliya_type] ?? a.aliya_type}</td>
                      <td className="px-3 py-2 text-gray-500">{a.date}</td>
                      <td className="px-3 py-2">
                        {a.donation_amount > 0 ? (
                          <span className="text-green-700 font-medium">₪{a.donation_amount}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                  {(data?.aliyot ?? []).length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400">אין עליות רשומות</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Aliyot() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterParasha, setFilterParasha] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [historyFor, setHistoryFor] = useState<{ id: string; name: string } | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['aliyot'],
    queryFn: () => aliyotApi.list(),
  });

  const { data: congregantsData } = useQuery({
    queryKey: ['congregants'],
    queryFn: () => congregantsApi.list(),
  });

  const congregantMap: Record<string, string> = {};
  (congregantsData?.congregants ?? []).forEach(c => {
    congregantMap[c.id] = `${c.first_name} ${c.last_name}`;
  });

  const allAliyot = data?.aliyot ?? [];

  const bulkDeleteMutation = useMutation({
    mutationFn: () => aliyotApi.bulkDelete([...checkedIds]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aliyot'] });
      setCheckedIds(new Set());
    },
  });

  const filtered = allAliyot.filter(a => {
    const name = congregantMap[a.congregant_id] ?? '';
    const textMatch = `${a.parasha} ${name} ${ALIYA_TYPE_LABELS[a.aliya_type] ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const parashaMatch = !filterParasha || a.parasha === filterParasha;
    const typeMatch = !filterType || a.aliya_type === filterType;
    return textMatch && parashaMatch && typeMatch;
  });

  const totalDonations = filtered.reduce((s, a) => s + (a.donation_amount ?? 0), 0);

  const uniqueParashot = [...new Set(allAliyot.map(a => a.parasha))].sort();

  const allChecked = filtered.length > 0 && filtered.every(a => checkedIds.has(a.id));
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(filtered.map(a => a.id)));
  };
  const toggle = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <PageHeader
        title="עליות לתורה"
        subtitle={`${data?.total ?? 0} עליות רשומות`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> הוסף עלייה
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 text-white shadow-md bg-linear-to-br from-[#2E3A59] to-[#3d4f7a] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/70">סה״כ עליות</p>
            <p className="text-3xl font-bold tracking-tight">{data?.total ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 text-white shadow-md bg-linear-to-br from-emerald-600 to-emerald-500 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/70">נדבות</p>
            <p className="text-3xl font-bold tracking-tight">₪{totalDonations.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 text-white shadow-md bg-linear-to-br from-[#C5A059] to-[#d4b070] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/70">פרשיות</p>
            <p className="text-3xl font-bold tracking-tight">{uniqueParashot.length}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 text-white shadow-md bg-linear-to-br from-amber-500 to-amber-400 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/70">מתפללים</p>
            <p className="text-3xl font-bold tracking-tight">{new Set(allAliyot.map(a => a.congregant_id)).size}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pr-9 pl-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3A59]"
                placeholder="חיפוש לפי פרשה, מתפלל..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterParasha} onChange={e => setFilterParasha(e.target.value)} className="w-40">
              <option value="">כל הפרשיות</option>
              {uniqueParashot.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-32">
              <option value="">כל הסוגים</option>
              {ALIYA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-auto">
              <Calendar className="h-4 w-4" />
              <span>{filtered.length} רשומות</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk bar */}
      {checkedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-[#2E3A59] text-white rounded-xl px-4 py-2.5">
          <span className="text-sm font-semibold">{checkedIds.size} נבחרו</span>
          <div className="flex gap-2 mr-auto">
            <Button size="sm" variant="danger" loading={bulkDeleteMutation.isPending}
              onClick={() => bulkDeleteMutation.mutate()}>
              <Trash2 className="h-3.5 w-3.5" /> מחק
            </Button>
            <button onClick={() => setCheckedIds(new Set())} className="text-white/70 hover:text-white text-sm px-2">✕</button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">רשימת עליות</span>
            {filtered.length > 0 && (
              <Badge variant="info">{filtered.filter(a => a.donation_amount > 0).length} עם נדבה</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">טוען...</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={search || filterParasha || filterType ? 'לא נמצאו תוצאות' : 'אין עליות רשומות עדיין'}
              description={search ? `לא נמצאו תוצאות עבור "${search}"` : 'הוסף עלייה ראשונה בעזרת הכפתור למעלה'}
              action={!search && !filterParasha && !filterType ? (
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4" /> הוסף עלייה ראשונה
                </Button>
              ) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-3 w-10">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll}
                        className="rounded border-gray-300 cursor-pointer" />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">פרשה</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">עלייה</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">מתפלל</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">תאריך</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">נדבה</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">מנהג</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(a => (
                    <AliyaRow
                      key={a.id}
                      a={a}
                      congregantName={congregantMap[a.congregant_id] ?? '—'}
                      checked={checkedIds.has(a.id)}
                      onToggle={() => toggle(a.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Congregant stats section */}
      {allAliyot.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <span className="font-semibold text-slate-800">עליות לפי מתפלל</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(
                allAliyot.reduce((acc, a) => {
                  if (!acc[a.congregant_id]) acc[a.congregant_id] = { count: 0, total: 0 };
                  acc[a.congregant_id].count++;
                  acc[a.congregant_id].total += a.donation_amount ?? 0;
                  return acc;
                }, {} as Record<string, { count: number; total: number }>)
              )
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 9)
                .map(([cid, stats]) => (
                  <button
                    key={cid}
                    onClick={() => setHistoryFor({ id: cid, name: congregantMap[cid] ?? cid })}
                    className="flex items-center gap-3 bg-slate-50 hover:bg-[#2E3A59]/5 rounded-xl px-4 py-3 border border-slate-100 hover:border-[#2E3A59]/20 transition-colors text-right w-full"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2E3A59]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#2E3A59]">{(congregantMap[cid] ?? '—')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{congregantMap[cid] ?? '—'}</p>
                      <p className="text-xs text-slate-500">{stats.count} עליות</p>
                    </div>
                    {stats.total > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ₪{stats.total.toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AddAliyaModal open={showAdd} onClose={() => setShowAdd(false)} />
      {historyFor && (
        <CongregantHistoryPanel
          congregantId={historyFor.id}
          congregantName={historyFor.name}
          onClose={() => setHistoryFor(null)}
        />
      )}
    </div>
  );
}
