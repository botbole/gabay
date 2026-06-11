import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Flame, Calendar, AlertCircle } from 'lucide-react';
import {
  azkarotApi,
  congregantsApi,
  type Azkara,
  type AzkaraCreate,
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

const RELATION_LABELS: Record<string, string> = {
  father: 'אב',
  mother: 'אם',
  spouse: 'בן/בת זוג',
  sibling: 'אח/אחות',
  child: 'ילד',
  other: 'אחר',
};

function formatHebrewDate(day: number, month: number) {
  if (!day || !month) return '—';
  return `${HEBREW_DAYS[day] ?? day} ${HEBREW_MONTHS[month] ?? month}`;
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const diff = Math.round(
    (new Date(dateStr).getTime() - Date.now()) / 86_400_000
  );
  return diff;
}

// ─── Add Azkara Modal ────────────────────────────────────────────────────────

function AddAzkaraModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AzkaraCreate>({
    congregant_id: '',
    deceased_name: '',
    deceased_hebrew_name: '',
    relation: '',
    gregorian_date: '',
    notes: '',
  });
  const [dateMode, setDateMode] = useState<'gregorian' | 'hebrew'>('gregorian');
  const [hebrewDay, setHebrewDay] = useState('');
  const [hebrewMonth, setHebrewMonth] = useState('');
  const [yearOccurred, setYearOccurred] = useState('');

  const { data: congregantsData } = useQuery({
    queryKey: ['congregants'],
    queryFn: () => congregantsApi.list(),
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload: AzkaraCreate = { ...form };
      if (dateMode === 'hebrew') {
        payload.gregorian_date = '';
        payload.hebrew_day = hebrewDay ? parseInt(hebrewDay) : undefined;
        payload.hebrew_month = hebrewMonth ? parseInt(hebrewMonth) : undefined;
      }
      if (yearOccurred) payload.year_occurred = parseInt(yearOccurred);
      return azkarotApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['azkarot'] });
      qc.invalidateQueries({ queryKey: ['azkarot-upcoming'] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({ congregant_id: '', deceased_name: '', deceased_hebrew_name: '', relation: '', gregorian_date: '', notes: '' });
    setHebrewDay('');
    setHebrewMonth('');
    setYearOccurred('');
    setDateMode('gregorian');
  };

  const set = (field: keyof AzkaraCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const canSubmit = !!form.congregant_id && !!form.deceased_name &&
    (dateMode === 'gregorian' ? !!form.gregorian_date : !!(hebrewDay && hebrewMonth));

  return (
    <Modal open={open} onClose={() => { onClose(); resetForm(); }} title="הוספת אזכרה" size="lg">
      <div className="space-y-4" dir="rtl">
        <Select label="מתפלל *" value={form.congregant_id} onChange={set('congregant_id')}>
          <option value="">בחר מתפלל...</option>
          {(congregantsData?.congregants ?? []).map(c => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input label="שם הנפטר *" value={form.deceased_name} onChange={set('deceased_name')} placeholder="ישראל מנחם" />
          <Input label="שם הנפטר בעברית" value={form.deceased_hebrew_name} onChange={set('deceased_hebrew_name')} placeholder="ישראל מנחם בן אברהם" />
        </div>

        <Select label="קרבה" value={form.relation} onChange={set('relation')}>
          <option value="">בחר קרבה...</option>
          {Object.entries(RELATION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תאריך פטירה</label>
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

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="שנת פטירה (לועזי)"
            type="number"
            value={yearOccurred}
            onChange={e => setYearOccurred(e.target.value)}
            placeholder={`${new Date().getFullYear() - 20}`}
          />
          <Input label="הערות" value={form.notes} onChange={set('notes')} placeholder="הערות נוספות..." />
        </div>

        {mutation.error && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}
        <div className="flex justify-start gap-3 pt-2">
          <Button variant="secondary" onClick={() => { onClose(); resetForm(); }}>ביטול</Button>
          <Button loading={mutation.isPending} disabled={!canSubmit} onClick={() => mutation.mutate()}>
            הוסף אזכרה
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Azkara Row ──────────────────────────────────────────────────────────────

function yahrzeitNumber(yearOccurred?: number | null): string | null {
  if (!yearOccurred) return null;
  const years = new Date().getFullYear() - yearOccurred;
  return years > 0 ? `יארצייט ${years}` : null;
}

function AzkaraRow({
  a,
  congregantName,
  onDelete,
}: {
  a: Azkara;
  congregantName: string;
  onDelete: () => void;
}) {
  const yahrzeit = yahrzeitNumber(a.year_occurred);
  return (
    <tr className="hover:bg-blue-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">{a.deceased_name}</p>
            {a.deceased_hebrew_name && (
              <p className="text-xs text-gray-400">{a.deceased_hebrew_name}</p>
            )}
            {yahrzeit && (
              <p className="text-xs text-amber-600 font-medium">{yahrzeit}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{congregantName}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {RELATION_LABELS[a.relation] ?? a.relation ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-800">
        {formatHebrewDate(a.hebrew_day, a.hebrew_month)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {a.year_occurred ? `${a.year_occurred}` : a.gregorian_date || '—'}
      </td>
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
  a,
  congregantName,
}: {
  a: Azkara;
  congregantName: string;
}) {
  const days = daysUntil(a.next_gregorian ?? '');
  const isToday = days === 0;
  const isUrgent = days !== null && days <= 3;

  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-3 ${
        isToday
          ? 'border-amber-400 bg-amber-50'
          : isUrgent
          ? 'border-orange-200 bg-orange-50'
          : 'border-blue-100 bg-white'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <Flame className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{a.deceased_name}</p>
        <p className="text-xs text-gray-500">{congregantName} · {RELATION_LABELS[a.relation] ?? a.relation ?? ''}</p>
        <p className="text-xs text-gray-600 mt-0.5">
          {formatHebrewDate(a.hebrew_day, a.hebrew_month)}
        </p>
        {a.year_occurred && (
          <p className="text-xs text-amber-600 font-medium mt-0.5">{yahrzeitNumber(a.year_occurred)}</p>
        )}
      </div>
      <div className="text-left shrink-0">
        {isToday ? (
          <Badge variant="warning">היום</Badge>
        ) : days !== null ? (
          <span className={`text-xs font-medium ${isUrgent ? 'text-orange-600' : 'text-gray-500'}`}>
            עוד {days} ימים
          </span>
        ) : null}
        <p className="text-xs text-gray-400 mt-1">{a.next_gregorian}</p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function Azkarot() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [upcomingDays, setUpcomingDays] = useState(30);

  const { data: listData, isLoading } = useQuery({
    queryKey: ['azkarot'],
    queryFn: () => azkarotApi.list(),
  });

  const { data: upcomingData } = useQuery({
    queryKey: ['azkarot-upcoming', upcomingDays],
    queryFn: () => azkarotApi.upcoming(upcomingDays),
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
    mutationFn: (id: string) => azkarotApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['azkarot'] });
      qc.invalidateQueries({ queryKey: ['azkarot-upcoming'] });
    },
  });

  const filtered = (listData?.azkarot ?? []).filter(a =>
    `${a.deceased_name} ${a.deceased_hebrew_name} ${congregantMap[a.congregant_id] ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const upcoming = upcomingData?.azkarot ?? [];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">אזכרות</h1>
          <p className="text-sm text-gray-500 mt-1">{listData?.total ?? 0} אזכרות רשומות</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> הוסף אזכרה
        </Button>
      </div>

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-gray-800">אזכרות קרובות</span>
                <Badge variant="warning">{upcoming.length}</Badge>
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
              {upcoming.map(a => (
                <UpcomingCard
                  key={a.id}
                  a={a}
                  congregantName={congregantMap[a.congregant_id] ?? '—'}
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
                placeholder="חיפוש לפי שם נפטר, מתפלל..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{filtered.length} רשומות</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              {search ? 'לא נמצאו תוצאות לחיפוש.' : 'אין אזכרות רשומות עדיין.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">שם הנפטר</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">מתפלל</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">קרבה</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">תאריך עברי</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">שנה</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {filtered.map(a => (
                    <AzkaraRow
                      key={a.id}
                      a={a}
                      congregantName={congregantMap[a.congregant_id] ?? '—'}
                      onDelete={() => deleteMutation.mutate(a.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddAzkaraModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
