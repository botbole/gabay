import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, PartyPopper, Calendar, AlertCircle } from 'lucide-react';
import {
  smachotApi,
  congregantsApi,
  type Simcha,
  type SimchaCreate,
} from '../api/client';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

// ─── Hebrew helpers ──────────────────────────────────────────────────────────

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

const OCCASION_LABELS: Record<string, string> = {
  birthday: 'יום הולדת',
  anniversary: 'יום נישואין',
  bar_mitzvah: 'בר מצוה',
  bat_mitzvah: 'בת מצוה',
  brit: 'ברית מילה',
  upsherin: 'חלאקה',
  other: 'אחר',
};

const OCCASION_COLORS: Record<string, string> = {
  birthday: 'bg-pink-100 text-pink-700',
  anniversary: 'bg-rose-100 text-rose-700',
  bar_mitzvah: 'bg-blue-100 text-blue-700',
  bat_mitzvah: 'bg-purple-100 text-purple-700',
  brit: 'bg-cyan-100 text-cyan-700',
  upsherin: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-600',
};

function formatHebrewDate(day: number, month: number) {
  if (!day || !month) return '—';
  return `${HEBREW_DAYS[day] ?? day} ${HEBREW_MONTHS[month] ?? month}`;
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

// ─── Add Simcha Modal ────────────────────────────────────────────────────────

function AddSimchaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SimchaCreate>({
    congregant_id: '',
    occasion_type: 'birthday',
    description: '',
    gregorian_date: '',
    parasha: '',
    notes: '',
  });
  const [dateMode, setDateMode] = useState<'gregorian' | 'hebrew'>('gregorian');
  const [hebrewDay, setHebrewDay] = useState('');
  const [hebrewMonth, setHebrewMonth] = useState('');

  const { data: congregantsData } = useQuery({
    queryKey: ['congregants'],
    queryFn: () => congregantsApi.list(),
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload: SimchaCreate = { ...form };
      if (dateMode === 'hebrew') {
        payload.gregorian_date = '';
        payload.hebrew_day = hebrewDay ? parseInt(hebrewDay) : undefined;
        payload.hebrew_month = hebrewMonth ? parseInt(hebrewMonth) : undefined;
      }
      return smachotApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smachot'] });
      qc.invalidateQueries({ queryKey: ['smachot-upcoming'] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({ congregant_id: '', occasion_type: 'birthday', description: '', gregorian_date: '', parasha: '', notes: '' });
    setHebrewDay('');
    setHebrewMonth('');
    setDateMode('gregorian');
  };

  const set = (field: keyof SimchaCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const canSubmit = !!form.congregant_id && !!form.occasion_type &&
    (dateMode === 'gregorian' ? !!form.gregorian_date : !!(hebrewDay && hebrewMonth));

  const isBarBat = form.occasion_type === 'bar_mitzvah' || form.occasion_type === 'bat_mitzvah';

  return (
    <Modal open={open} onClose={() => { onClose(); resetForm(); }} title="הוספת שמחה" size="lg">
      <div className="space-y-4" dir="rtl">
        <Select label="מתפלל *" value={form.congregant_id} onChange={set('congregant_id')}>
          <option value="">בחר מתפלל...</option>
          {(congregantsData?.congregants ?? []).map(c => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Select label="סוג שמחה *" value={form.occasion_type} onChange={set('occasion_type')}>
            {Object.entries(OCCASION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
          <Input label="תיאור" value={form.description} onChange={set('description')} placeholder="פרטים נוספים..." />
        </div>

        {isBarBat && (
          <Input label="פרשה" value={form.parasha} onChange={set('parasha')} placeholder="בראשית, נח, לך לך..." />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setDateMode('gregorian')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${dateMode === 'gregorian' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              לועזי
            </button>
            <button
              type="button"
              onClick={() => setDateMode('hebrew')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${dateMode === 'hebrew' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              עברי
            </button>
          </div>
          {dateMode === 'gregorian' ? (
            <Input type="date" value={form.gregorian_date} onChange={set('gregorian_date')} />
          ) : (
            <div className="flex gap-3">
              <Select label="יום" value={hebrewDay} onChange={e => setHebrewDay(e.target.value)}>
                <option value="">יום...</option>
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{HEBREW_DAYS[d] ?? d}</option>
                ))}
              </Select>
              <Select label="חודש" value={hebrewMonth} onChange={e => setHebrewMonth(e.target.value)}>
                <option value="">חודש...</option>
                {Object.entries(HEBREW_MONTHS).map(([m, name]) => (
                  <option key={m} value={m}>{name}</option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <Input label="הערות" value={form.notes} onChange={set('notes')} placeholder="הערות נוספות..." />

        {mutation.error && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}
        <div className="flex justify-start gap-3 pt-2">
          <Button variant="secondary" onClick={() => { onClose(); resetForm(); }}>ביטול</Button>
          <Button loading={mutation.isPending} disabled={!canSubmit} onClick={() => mutation.mutate()}>
            הוסף שמחה
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Simcha Row ──────────────────────────────────────────────────────────────

function SimchaRow({
  s,
  congregantName,
  onDelete,
}: {
  s: Simcha;
  congregantName: string;
  onDelete: () => void;
}) {
  return (
    <tr className="hover:bg-blue-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-4 w-4 text-pink-500 shrink-0" />
          <div>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${OCCASION_COLORS[s.occasion_type] ?? 'bg-gray-100 text-gray-600'}`}>
              {OCCASION_LABELS[s.occasion_type] ?? s.occasion_type}
            </span>
            {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{congregantName}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-800">
        {formatHebrewDate(s.hebrew_day, s.hebrew_month)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{s.gregorian_date || '—'}</td>
      {s.parasha && (
        <td className="px-4 py-3 text-xs text-blue-600">{s.parasha}</td>
      )}
      {!s.parasha && <td className="px-4 py-3" />}
      <td className="px-4 py-3">
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
          title="מחק"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

// ─── Upcoming Card ───────────────────────────────────────────────────────────

function UpcomingCard({
  s,
  congregantName,
}: {
  s: Simcha;
  congregantName: string;
}) {
  const days = daysUntil(s.next_gregorian ?? '');
  const isToday = days === 0;
  const isUrgent = days !== null && days <= 3;

  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-3 ${
        isToday
          ? 'border-pink-400 bg-pink-50'
          : isUrgent
          ? 'border-rose-200 bg-rose-50'
          : 'border-blue-100 bg-white'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${OCCASION_COLORS[s.occasion_type] ?? 'bg-gray-100'}`}>
        <PartyPopper className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">
          {OCCASION_LABELS[s.occasion_type] ?? s.occasion_type}
        </p>
        <p className="text-xs text-gray-500">{congregantName}</p>
        {s.description && <p className="text-xs text-gray-600 mt-0.5">{s.description}</p>}
        <p className="text-xs text-gray-600 mt-0.5">
          {formatHebrewDate(s.hebrew_day, s.hebrew_month)}
        </p>
      </div>
      <div className="text-left shrink-0">
        {isToday ? (
          <Badge variant="default">היום</Badge>
        ) : days !== null ? (
          <span className={`text-xs font-medium ${isUrgent ? 'text-rose-600' : 'text-gray-500'}`}>
            עוד {days} ימים
          </span>
        ) : null}
        <p className="text-xs text-gray-400 mt-1">{s.next_gregorian}</p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function Smachot() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [upcomingDays, setUpcomingDays] = useState(30);

  const { data: listData, isLoading } = useQuery({
    queryKey: ['smachot', filterType],
    queryFn: () => smachotApi.list(undefined, filterType || undefined),
  });

  const { data: upcomingData } = useQuery({
    queryKey: ['smachot-upcoming', upcomingDays, filterType],
    queryFn: () => smachotApi.upcoming(upcomingDays, filterType || undefined),
  });

  const { data: congregantsData } = useQuery({
    queryKey: ['congregants'],
    queryFn: () => congregantsApi.list(),
  });

  const congregantMap: Record<string, string> = {};
  (congregantsData?.congregants ?? []).forEach(c => {
    congregantMap[c.id] = `${c.first_name} ${c.last_name}`;
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => smachotApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smachot'] });
      qc.invalidateQueries({ queryKey: ['smachot-upcoming'] });
    },
  });

  const filtered = (listData?.smachot ?? []).filter(s =>
    `${OCCASION_LABELS[s.occasion_type] ?? ''} ${s.description} ${congregantMap[s.congregant_id] ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const upcoming = upcomingData?.smachot ?? [];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">שמחות</h1>
          <p className="text-sm text-gray-500 mt-1">{listData?.total ?? 0} שמחות רשומות</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> הוסף שמחה
        </Button>
      </div>

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <Card className="border-pink-200 bg-pink-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-pink-600" />
                <span className="font-semibold text-gray-800">שמחות קרובות</span>
                <Badge variant="default">{upcoming.length}</Badge>
              </div>
              <Select
                value={String(upcomingDays)}
                onChange={e => setUpcomingDays(Number(e.target.value))}
                className="w-32 !mt-0"
              >
                <option value="7">7 ימים</option>
                <option value="14">14 ימים</option>
                <option value="30">30 ימים</option>
                <option value="60">60 ימים</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcoming.map(s => (
                <UpcomingCard
                  key={s.id}
                  s={s}
                  congregantName={congregantMap[s.congregant_id] ?? '—'}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full list */}
      <Card className="border-blue-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pr-9 pl-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="חיפוש לפי מתפלל, תיאור..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-40">
              <option value="">כל הסוגים</option>
              {Object.entries(OCCASION_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{filtered.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              {search || filterType ? 'לא נמצאו תוצאות.' : 'אין שמחות רשומות עדיין.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">סוג שמחה</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">מתפלל</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">תאריך עברי</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">תאריך לועזי</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">פרשה</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {filtered.map(s => (
                    <SimchaRow
                      key={s.id}
                      s={s}
                      congregantName={congregantMap[s.congregant_id] ?? '—'}
                      onDelete={() => deleteMutation.mutate(s.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddSimchaModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
