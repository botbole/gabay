import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Phone, Mail, Crown, Trash2, Archive, RotateCcw } from 'lucide-react';
import { congregantsApi, type Congregant, type CongregantCreate } from '../api/client';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

const memberTypeLabel: Record<string, string> = {
  regular: 'קבוע',
  guest: 'אורח',
  occasional: 'מזדמן',
};

const memberTypeVariant: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  regular: 'success',
  guest: 'info',
  occasional: 'warning',
};

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkBar({
  count,
  onDelete,
  onArchive,
  onRestore,
  onClear,
  isArchiveView,
  loading,
}: {
  count: number;
  onDelete: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onClear: () => void;
  isArchiveView: boolean;
  loading: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 bg-blue-700 text-white rounded-xl px-4 py-2.5 shadow-lg">
      <span className="text-sm font-semibold">{count} נבחרו</span>
      <div className="flex gap-2 mr-auto">
        {!isArchiveView && onArchive && (
          <Button size="sm" variant="secondary" loading={loading} onClick={onArchive}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            <Archive className="h-3.5 w-3.5" /> העבר לארכיב
          </Button>
        )}
        {isArchiveView && onRestore && (
          <Button size="sm" variant="secondary" loading={loading} onClick={onRestore}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            <RotateCcw className="h-3.5 w-3.5" /> שחזר
          </Button>
        )}
        <Button size="sm" variant="danger" loading={loading} onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> מחק
        </Button>
        <button onClick={onClear} className="text-white/70 hover:text-white text-sm px-2">✕</button>
      </div>
    </div>
  );
}

const EMPTY_FORM: CongregantCreate = {
  first_name: '', last_name: '', hebrew_name: '', father_name: '', mother_name: '',
  phone: '', email: '', address: '', is_kohen: false, is_levi: false,
  member_type: 'regular', notes: '', join_date: '',
  azkara_father: '', azkara_mother: '', birth_date: '', bar_mitzvah_shabbat: '',
};

// ─── Add congregant modal ─────────────────────────────────────────────────────

function AddCongregantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CongregantCreate>(EMPTY_FORM);
  const [showEvents, setShowEvents] = useState(false);

  const mutation = useMutation({
    mutationFn: () => congregantsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['congregants'] });
      qc.invalidateQueries({ queryKey: ['azkarot'] });
      qc.invalidateQueries({ queryKey: ['smachot'] });
      onClose();
      setForm(EMPTY_FORM);
      setShowEvents(false);
    },
  });

  const set = (field: keyof CongregantCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const hasEventData = !!(form.azkara_father || form.azkara_mother || form.birth_date || form.bar_mitzvah_shabbat);

  return (
    <Modal open={open} onClose={onClose} title="הוספת מתפלל חדש" size="lg">
      <div className="space-y-4" dir="rtl">

        {/* ── Personal info ── */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="שם פרטי *" value={form.first_name} onChange={set('first_name')} placeholder="משה" />
          <Input label="שם משפחה *" value={form.last_name} onChange={set('last_name')} placeholder="כהן" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="שם בעברית" value={form.hebrew_name ?? ''} onChange={set('hebrew_name')} placeholder="משה בן אברהם" />
          <Input label="שם האב" value={form.father_name ?? ''} onChange={set('father_name')} placeholder="אברהם" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="שם האמא" value={form.mother_name ?? ''} onChange={set('mother_name')} placeholder="שרה" />
          <Input label="תאריך הצטרפות" type="date" value={form.join_date ?? ''} onChange={set('join_date')} />
        </div>

        {/* ── Contact ── */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="טלפון" value={form.phone ?? ''} onChange={set('phone')} placeholder="050-1234567" />
          <Input label="אימייל" type="email" value={form.email ?? ''} onChange={set('email')} placeholder="moshe@example.com" />
        </div>
        <Input label="כתובת" value={form.address ?? ''} onChange={set('address')} placeholder="רחוב הרצל 1, ירושלים" />

        {/* ── Membership ── */}
        <div className="grid grid-cols-3 gap-4 items-end">
          <Select label="סוג חברות" value={form.member_type ?? 'regular'} onChange={set('member_type')}>
            <option value="regular">קבוע</option>
            <option value="guest">אורח</option>
            <option value="occasional">מזדמן</option>
          </Select>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer pb-2">
            <input type="checkbox" className="rounded border-gray-300" checked={!!form.is_kohen} onChange={set('is_kohen')} />
            כהן
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer pb-2">
            <input type="checkbox" className="rounded border-gray-300" checked={!!form.is_levi} onChange={set('is_levi')} />
            לוי
          </label>
        </div>

        {/* ── Notes ── */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">הערות</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            rows={2}
            placeholder="הערות נוספות..."
            value={form.notes ?? ''}
            onChange={set('notes')}
          />
        </div>

        {/* ── Azkarot & Smachot section ── */}
        <div className="border border-blue-100 rounded-xl overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-semibold text-blue-800"
            onClick={() => setShowEvents(v => !v)}
          >
            <span>אזכרות ואירועים {hasEventData && <span className="text-blue-500 font-normal">(מולא)</span>}</span>
            <span className="text-blue-400">{showEvents ? '▲' : '▼'}</span>
          </button>
          {showEvents && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-500">
                מלא תאריכים גרגוריאניים (DD/MM/YYYY) — המערכת תיצור רשומות אזכרה/שמחה אוטומטית.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="אזכרה אבא (תאריך פטירה)"
                  placeholder="DD/MM/YYYY"
                  value={form.azkara_father ?? ''}
                  onChange={set('azkara_father')}
                />
                <Input
                  label="אזכרה אמא (תאריך פטירה)"
                  placeholder="DD/MM/YYYY"
                  value={form.azkara_mother ?? ''}
                  onChange={set('azkara_mother')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="תאריך לידה"
                  placeholder="DD/MM/YYYY"
                  value={form.birth_date ?? ''}
                  onChange={set('birth_date')}
                />
                <Input
                  label="שבת בר מצווה"
                  placeholder="DD/MM/YYYY"
                  value={form.bar_mitzvah_shabbat ?? ''}
                  onChange={set('bar_mitzvah_shabbat')}
                />
              </div>
            </div>
          )}
        </div>

        {mutation.error && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-start gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>ביטול</Button>
          <Button loading={mutation.isPending} disabled={!form.first_name || !form.last_name} onClick={() => mutation.mutate()}>
            הוסף מתפלל
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Congregant detail modal ──────────────────────────────────────────────────

function CongregantDetailModal({ congregant, onClose }: { congregant: Congregant; onClose: () => void }) {
  const { data: place } = useQuery({
    queryKey: ['congregant-place', congregant.id],
    queryFn: () => congregantsApi.getPlace(congregant.id).catch(() => null),
  });

  return (
    <Modal open={true} onClose={onClose} title={`${congregant.first_name} ${congregant.last_name}`} size="md">
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold">
            {congregant.first_name[0]}{congregant.last_name[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{congregant.first_name} {congregant.last_name}</p>
            {congregant.hebrew_name && <p className="text-sm text-gray-500">{congregant.hebrew_name}</p>}
            <div className="flex gap-1.5 mt-1">
              <Badge variant={memberTypeVariant[congregant.member_type] ?? 'default'}>{memberTypeLabel[congregant.member_type] ?? congregant.member_type}</Badge>
              {congregant.is_kohen && <Badge variant="info">כהן</Badge>}
              {congregant.is_levi && <Badge variant="warning">לוי</Badge>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {congregant.phone && (
            <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-gray-400" />{congregant.phone}</div>
          )}
          {congregant.email && (
            <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-gray-400" />{congregant.email}</div>
          )}
          {congregant.father_name && (
            <div className="flex items-center gap-2 text-gray-600"><Crown className="h-4 w-4 text-gray-400" />בן {congregant.father_name}</div>
          )}
          {congregant.mother_name && (
            <div className="flex items-center gap-2 text-gray-600"><Crown className="h-4 w-4 text-gray-400" />בת {congregant.mother_name}</div>
          )}
        </div>
        {congregant.address && <p className="text-sm text-gray-500">{congregant.address}</p>}
        {place && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm border border-blue-100">
            <p className="font-medium text-blue-800">מקום מושב</p>
            <p className="text-blue-600">אגף: {place.section} · שורה {place.row} · מושב #{place.place_number}</p>
          </div>
        )}
        {congregant.notes && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">הערות</p>
            {congregant.notes}
          </div>
        )}
        <p className="text-xs text-gray-400">הצטרף: {congregant.join_date}</p>
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Congregants() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Congregant | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'active' | 'archived'>('active');

  const isArchiveView = view === 'archived';

  const { data, isLoading } = useQuery({
    queryKey: ['congregants', filterType, view],
    queryFn: () => congregantsApi.list(filterType || undefined, isArchiveView),
  });

  const filtered = (data?.congregants ?? []).filter(c =>
    `${c.first_name} ${c.last_name} ${c.hebrew_name} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Selection helpers ──
  const allChecked = filtered.length > 0 && filtered.every(c => checkedIds.has(c.id));
  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filtered.map(c => c.id)));
    }
  };
  const toggle = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearSelection = () => setCheckedIds(new Set());

  // ── Bulk mutations ──
  const bulkDeleteMutation = useMutation({
    mutationFn: () => congregantsApi.bulkDelete([...checkedIds]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['congregants'] }); clearSelection(); },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: () => congregantsApi.bulkArchive([...checkedIds]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['congregants'] }); clearSelection(); },
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: () => congregantsApi.bulkRestore([...checkedIds]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['congregants'] }); clearSelection(); },
  });

  const bulkLoading = bulkDeleteMutation.isPending || bulkArchiveMutation.isPending || bulkRestoreMutation.isPending;

  return (
    <div className="p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מתפללים</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} {isArchiveView ? 'בארכיב' : 'חברים רשומים'}</p>
        </div>
        {!isArchiveView && (
          <Button onClick={() => setShowAdd(true)}>
            <UserPlus className="h-4 w-4" /> הוסף מתפלל
          </Button>
        )}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-blue-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => { setView('active'); clearSelection(); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          פעילים
        </button>
        <button
          onClick={() => { setView('archived'); clearSelection(); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'archived' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Archive className="h-3.5 w-3.5 inline ml-1" />
          ארכיב
        </button>
      </div>

      {/* Bulk action bar */}
      <BulkBar
        count={checkedIds.size}
        onDelete={() => bulkDeleteMutation.mutate()}
        onArchive={!isArchiveView ? () => bulkArchiveMutation.mutate() : undefined}
        onRestore={isArchiveView ? () => bulkRestoreMutation.mutate() : undefined}
        onClear={clearSelection}
        isArchiveView={isArchiveView}
        loading={bulkLoading}
      />

      <Card className="border-blue-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pr-9 pl-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="חיפוש לפי שם, טלפון..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-36">
              <option value="">כל הסוגים</option>
              <option value="regular">קבוע</option>
              <option value="guest">אורח</option>
              <option value="occasional">מזדמן</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              {isArchiveView ? 'אין מתפללים בארכיב.' : 'לא נמצאו מתפללים.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50">
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="rounded border-gray-300 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">שם</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">טלפון</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">אימייל</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">סטטוס</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">סוג</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {isArchiveView ? 'הועבר לארכיב' : 'הצטרף'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {filtered.map(c => (
                    <tr
                      key={c.id}
                      className={`hover:bg-blue-50 transition-colors ${checkedIds.has(c.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checkedIds.has(c.id)}
                          onChange={() => toggle(c.id)}
                          className="rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(c)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
                            {c.first_name[0]}{c.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                            {c.hebrew_name && <p className="text-xs text-gray-400">{c.hebrew_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(c)}>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {c.phone && <><Phone className="h-3 w-3" />{c.phone}</>}
                        </div>
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(c)}>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {c.email && <><Mail className="h-3 w-3" />{c.email}</>}
                        </div>
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(c)}>
                        <div className="flex items-center gap-1.5">
                          {c.is_kohen && <Badge variant="info">כהן</Badge>}
                          {c.is_levi && <Badge variant="warning">לוי</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(c)}>
                        <Badge variant={memberTypeVariant[c.member_type] ?? 'default'}>
                          {memberTypeLabel[c.member_type] ?? c.member_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 cursor-pointer" onClick={() => setSelected(c)}>
                        {isArchiveView ? c.archived_at : c.join_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddCongregantModal open={showAdd} onClose={() => setShowAdd(false)} />
      {selected && <CongregantDetailModal congregant={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
