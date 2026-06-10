import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Phone, Mail, Crown } from 'lucide-react';
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

function CongregantRow({ c, onSelect }: { c: Congregant; onSelect: () => void }) {
  return (
    <tr className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={onSelect}>
      <td className="px-4 py-3">
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
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          {c.phone && <><Phone className="h-3 w-3" />{c.phone}</>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          {c.email && <><Mail className="h-3 w-3" />{c.email}</>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {c.is_kohen && <Badge variant="info">כהן</Badge>}
          {c.is_levi && <Badge variant="warning">לוי</Badge>}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={memberTypeVariant[c.member_type] ?? 'default'}>
          {memberTypeLabel[c.member_type] ?? c.member_type}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{c.join_date}</td>
    </tr>
  );
}

function AddCongregantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CongregantCreate>({
    first_name: '', last_name: '', hebrew_name: '', father_name: '',
    phone: '', email: '', address: '', is_kohen: false, is_levi: false,
    member_type: 'regular', notes: '',
  });

  const mutation = useMutation({
    mutationFn: () => congregantsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['congregants'] });
      onClose();
      setForm({ first_name: '', last_name: '', hebrew_name: '', father_name: '', phone: '', email: '', address: '', is_kohen: false, is_levi: false, member_type: 'regular', notes: '' });
    },
  });

  const set = (field: keyof CongregantCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal open={open} onClose={onClose} title="הוספת מתפלל חדש" size="lg">
      <div className="space-y-4" dir="rtl">
        <div className="grid grid-cols-2 gap-4">
          <Input label="שם פרטי *" value={form.first_name} onChange={set('first_name')} placeholder="משה" />
          <Input label="שם משפחה *" value={form.last_name} onChange={set('last_name')} placeholder="כהן" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="שם בעברית" value={form.hebrew_name} onChange={set('hebrew_name')} placeholder="משה בן אברהם" />
          <Input label="שם האב" value={form.father_name} onChange={set('father_name')} placeholder="אברהם" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="טלפון" value={form.phone} onChange={set('phone')} placeholder="050-1234567" />
          <Input label="אימייל" value={form.email} onChange={set('email')} type="email" placeholder="moshe@example.com" />
        </div>
        <Input label="כתובת" value={form.address} onChange={set('address')} placeholder="רחוב הרצל 1, ירושלים" />
        <div className="grid grid-cols-3 gap-4 items-end">
          <Select label="סוג חברות" value={form.member_type} onChange={set('member_type')}>
            <option value="regular">קבוע</option>
            <option value="guest">אורח</option>
            <option value="occasional">מזדמן</option>
          </Select>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300" checked={form.is_kohen} onChange={set('is_kohen')} />
            כהן
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300" checked={form.is_levi} onChange={set('is_levi')} />
            לוי
          </label>
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

export function Congregants() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Congregant | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['congregants', filterType],
    queryFn: () => congregantsApi.list(filterType || undefined),
  });

  const filtered = (data?.congregants ?? []).filter(c =>
    `${c.first_name} ${c.last_name} ${c.hebrew_name} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מתפללים</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} חברים רשומים</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus className="h-4 w-4" /> הוסף מתפלל
        </Button>
      </div>

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
            <div className="px-5 py-8 text-center text-sm text-gray-400">לא נמצאו מתפללים.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">שם</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">טלפון</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">אימייל</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">סטטוס</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">סוג</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">הצטרף</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {filtered.map(c => (
                    <CongregantRow key={c.id} c={c} onSelect={() => setSelected(c)} />
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
