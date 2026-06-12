import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, AlertCircle, Trash2 } from 'lucide-react';
import { paymentsApi, congregantsApi, type PaymentCreate } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

const purposeLabel: Record<string, string> = {
  aliya: 'עלייה לתורה',
  kiddush: 'קידוש',
  annual_dues: 'דמי חבר שנתיים',
  donation: 'תרומה',
  seat_fee: 'דמי מקום',
  other: 'אחר',
};

const purposeVariant: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  aliya: 'info',
  kiddush: 'success',
  annual_dues: 'warning',
  donation: 'default',
};

function RecordPaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: congregantsData } = useQuery({
    queryKey: ['congregants'],
    queryFn: () => congregantsApi.list(),
  });

  const [form, setForm] = useState<PaymentCreate>({
    congregant_id: '', amount: 0, purpose: 'donation', currency: 'ILS', notes: '', payment_date: '',
  });

  const mutation = useMutation({
    mutationFn: () => paymentsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
      onClose();
      setForm({ congregant_id: '', amount: 0, purpose: 'donation', currency: 'ILS', notes: '', payment_date: '' });
    },
  });

  const set = (field: keyof PaymentCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: field === 'amount' ? Number(e.target.value) : e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="רישום תשלום">
      <div className="space-y-4" dir="rtl">
        <Select label="מתפלל *" value={form.congregant_id} onChange={set('congregant_id')}>
          <option value="">בחר חבר...</option>
          {congregantsData?.congregants.map(c => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label="סכום *" type="number" min={0} step={0.01} value={form.amount} onChange={set('amount')} placeholder="100" />
          <Select label="מטבע" value={form.currency} onChange={set('currency')}>
            <option value="ILS">₪ שקל</option>
            <option value="USD">$ דולר</option>
            <option value="EUR">€ יורו</option>
          </Select>
        </div>
        <Select label="מטרה *" value={form.purpose} onChange={set('purpose')}>
          <option value="donation">תרומה</option>
          <option value="aliya">עלייה לתורה</option>
          <option value="kiddush">קידוש</option>
          <option value="annual_dues">דמי חבר שנתיים</option>
          <option value="seat_fee">דמי מקום</option>
          <option value="other">אחר</option>
        </Select>
        <Input label="תאריך" type="date" value={form.payment_date} onChange={set('payment_date')} />
        <Input label="הערות" value={form.notes} onChange={set('notes')} placeholder="הערות אופציונליות..." />
        {mutation.error && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-start gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>ביטול</Button>
          <Button loading={mutation.isPending} disabled={!form.congregant_id || form.amount <= 0} onClick={() => mutation.mutate()}>
            רשום תשלום
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function Payments() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['payments', purposeFilter],
    queryFn: () => paymentsApi.list(purposeFilter || undefined),
  });

  const { data: pendingData } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => paymentsApi.pending(),
  });

  const { data: congregantsData } = useQuery({
    queryKey: ['congregants'],
    queryFn: () => congregantsApi.list(),
  });

  const congregantMap: Record<string, string> = {};
  (congregantsData?.congregants ?? []).forEach(c => {
    congregantMap[c.id] = `${c.first_name} ${c.last_name}`;
  });

  const payments = data?.payments ?? [];
  const allChecked = payments.length > 0 && payments.every(p => checkedIds.has(p.id));

  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(payments.map(p => p.id)));
  };
  const toggle = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: () => paymentsApi.bulkDelete([...checkedIds]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
      setCheckedIds(new Set());
    },
  });

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">תשלומים</h1>
          <p className="text-sm text-gray-500 mt-1">
            סה״כ נגבה: <span className="font-semibold text-emerald-600">₪{(data?.total_amount ?? 0).toLocaleString()}</span>
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <PlusCircle className="h-4 w-4" /> רשום תשלום
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-blue-100 rounded-xl p-1 w-fit">
        {(['all', 'pending'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'all' ? 'כל התשלומים' : `ממתינים (${pendingData?.total_pending ?? 0})`}
          </button>
        ))}
      </div>

      {/* Bulk bar */}
      {checkedIds.size > 0 && activeTab === 'all' && (
        <div className="flex items-center gap-3 bg-blue-700 text-white rounded-xl px-4 py-2.5">
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

      {activeTab === 'all' && (
        <Card className="border-blue-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>רשומות תשלומים</CardTitle>
              <div className="mr-auto">
                <Select value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)} className="w-44">
                  <option value="">כל המטרות</option>
                  <option value="donation">תרומה</option>
                  <option value="aliya">עלייה לתורה</option>
                  <option value="kiddush">קידוש</option>
                  <option value="annual_dues">דמי חבר</option>
                  <option value="seat_fee">דמי מקום</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">טוען...</div>
            ) : !payments.length ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">לא נמצאו תשלומים.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-blue-50 bg-blue-50">
                      <th className="px-3 py-3 w-10">
                        <input type="checkbox" checked={allChecked} onChange={toggleAll}
                          className="rounded border-gray-300 cursor-pointer" />
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">תאריך</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">מתפלל</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">סכום</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">מטרה</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">הערות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {payments.map(p => (
                      <tr key={p.id} className={`hover:bg-blue-50 transition-colors ${checkedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={checkedIds.has(p.id)} onChange={() => toggle(p.id)}
                            className="rounded border-gray-300 cursor-pointer" />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{p.date}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                          {congregantMap[p.congregant_id] ?? <span className="text-xs text-gray-400 font-mono">{p.congregant_id.slice(0, 8)}…</span>}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                          {p.currency === 'ILS' ? '₪' : p.currency === 'USD' ? '$' : '€'}{p.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={purposeVariant[p.purpose] ?? 'default'}>{purposeLabel[p.purpose] ?? p.purpose}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{p.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'pending' && (
        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <CardTitle>חברים ללא תשלום</CardTitle>
              <Badge variant="warning" className="mr-auto">{pendingData?.total_pending ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!pendingData?.congregants.length ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">כל החברים שילמו!</div>
            ) : (
              <ul className="divide-y divide-amber-50">
                {pendingData.congregants.map(c => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>רשום תשלום</Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <RecordPaymentModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
