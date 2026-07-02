import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Phone, Mail, Crown, Trash2, Archive, RotateCcw, Pencil, CreditCard, BookOpen, Star, Loader2 } from 'lucide-react';
import { congregantsApi, paymentsApi, aliyotApi, azkarotApi, smachotApi, type Congregant, type CongregantCreate } from '../api/client';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { DatePickerField } from '../components/ui/DatePickerField';
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
    <div className="flex items-center gap-3 bg-[#2E3A59] text-white rounded-xl px-4 py-2.5 shadow-lg">
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
  member_type: 'regular', notes: '', join_date: '', gender: 'male',
  azkara_father: '', azkara_mother: '', birth_date: '', bar_mitzvah_shabbat: '',
};

// Convert YYYY-MM-DD → DD/MM/YYYY (for event date fields sent to the backend)
function isoToDdMmYyyy(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
// Convert DD/MM/YYYY → YYYY-MM-DD (for initialising DatePickerField from form state)
function ddMmYyyyToIso(dmy: string) {
  if (!dmy) return '';
  const [d, m, y] = dmy.split('/');
  if (!d || !m || !y) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// ─── Add congregant modal ─────────────────────────────────────────────────────

function AddCongregantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CongregantCreate>(EMPTY_FORM);
  const [showEvents, setShowEvents] = useState(false);

  // ── Hebrew/Gregorian date state for the 3 event date fields ──────────────
  const [fatherMode, setFatherMode] = useState<'gregorian' | 'hebrew'>('hebrew');
  const [fatherHebrewDay, setFatherHebrewDay] = useState('');
  const [fatherHebrewMonth, setFatherHebrewMonth] = useState('');

  const [motherMode, setMotherMode] = useState<'gregorian' | 'hebrew'>('hebrew');
  const [motherHebrewDay, setMotherHebrewDay] = useState('');
  const [motherHebrewMonth, setMotherHebrewMonth] = useState('');

  const [birthMode, setBirthMode] = useState<'gregorian' | 'hebrew'>('hebrew');
  const [birthHebrewDay, setBirthHebrewDay] = useState('');
  const [birthHebrewMonth, setBirthHebrewMonth] = useState('');

  const resetEventState = () => {
    setFatherMode('hebrew'); setFatherHebrewDay(''); setFatherHebrewMonth('');
    setMotherMode('hebrew'); setMotherHebrewDay(''); setMotherHebrewMonth('');
    setBirthMode('hebrew');  setBirthHebrewDay('');  setBirthHebrewMonth('');
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CongregantCreate = { ...form };
      // Gregorian dates are already in YYYY-MM-DD on form; convert to DD/MM/YYYY for backend
      if (fatherMode === 'gregorian') {
        payload.azkara_father = isoToDdMmYyyy(form.azkara_father ?? '');
        payload.azkara_father_hebrew_day = 0;
        payload.azkara_father_hebrew_month = 0;
      } else {
        payload.azkara_father = '';
        payload.azkara_father_hebrew_day = parseInt(fatherHebrewDay) || 0;
        payload.azkara_father_hebrew_month = parseInt(fatherHebrewMonth) || 0;
      }
      if (motherMode === 'gregorian') {
        payload.azkara_mother = isoToDdMmYyyy(form.azkara_mother ?? '');
        payload.azkara_mother_hebrew_day = 0;
        payload.azkara_mother_hebrew_month = 0;
      } else {
        payload.azkara_mother = '';
        payload.azkara_mother_hebrew_day = parseInt(motherHebrewDay) || 0;
        payload.azkara_mother_hebrew_month = parseInt(motherHebrewMonth) || 0;
      }
      if (birthMode === 'gregorian') {
        payload.birth_date = isoToDdMmYyyy(form.birth_date ?? '');
        payload.birth_date_hebrew_day = 0;
        payload.birth_date_hebrew_month = 0;
      } else {
        payload.birth_date = '';
        payload.birth_date_hebrew_day = parseInt(birthHebrewDay) || 0;
        payload.birth_date_hebrew_month = parseInt(birthHebrewMonth) || 0;
      }
      return congregantsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['congregants'] });
      qc.invalidateQueries({ queryKey: ['azkarot'] });
      qc.invalidateQueries({ queryKey: ['smachot'] });
      onClose();
      setForm(EMPTY_FORM);
      setShowEvents(false);
      resetEventState();
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
        <div className="grid grid-cols-3 gap-4 items-end">
          <Input label="שם האמא" value={form.mother_name ?? ''} onChange={set('mother_name')} placeholder="שרה" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">מגדר</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden h-[38px]">
              <button type="button" onClick={() => setForm(p => ({ ...p, gender: 'male' }))}
                className={`flex-1 text-sm font-medium transition-colors ${form.gender !== 'female' ? 'bg-[#2E3A59] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                זכר
              </button>
              <button type="button" onClick={() => setForm(p => ({ ...p, gender: 'female' }))}
                className={`flex-1 text-sm font-medium transition-colors border-r border-gray-300 ${form.gender === 'female' ? 'bg-[#2E3A59] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                נקבה
              </button>
            </div>
          </div>
          <DatePickerField
            label="תאריך הצטרפות"
            gregorianOnly
            mode="gregorian"
            onModeChange={() => {}}
            gregorianDate={form.join_date ?? ''}
            onGregorianChange={v => setForm(prev => ({ ...prev, join_date: v }))}
            hebrewDay=""
            hebrewMonth=""
            onHebrewDayChange={() => {}}
            onHebrewMonthChange={() => {}}
          />
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E3A59] focus:border-[#2E3A59] transition-colors resize-none"
            rows={2}
            placeholder="הערות נוספות..."
            value={form.notes ?? ''}
            onChange={set('notes')}
          />
        </div>

        {/* ── Azkarot & Smachot section ── */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-semibold text-[#2E3A59]"
            onClick={() => setShowEvents(v => !v)}
          >
            <span>אזכרות ואירועים {hasEventData && <span className="text-[#C5A059] font-normal">(מולא)</span>}</span>
            <span className="text-slate-400">{showEvents ? '▲' : '▼'}</span>
          </button>
          {showEvents && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-500">
                בחר תאריכים — המערכת תיצור רשומות אזכרה/שמחה אוטומטית.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <DatePickerField
                  label="אזכרה אבא (תאריך פטירה)"
                  mode={fatherMode}
                  onModeChange={setFatherMode}
                  gregorianDate={form.azkara_father ?? ''}
                  onGregorianChange={v => setForm(prev => ({ ...prev, azkara_father: v }))}
                  hebrewDay={fatherHebrewDay}
                  hebrewMonth={fatherHebrewMonth}
                  onHebrewDayChange={setFatherHebrewDay}
                  onHebrewMonthChange={setFatherHebrewMonth}
                />
                <DatePickerField
                  label="אזכרה אמא (תאריך פטירה)"
                  mode={motherMode}
                  onModeChange={setMotherMode}
                  gregorianDate={form.azkara_mother ?? ''}
                  onGregorianChange={v => setForm(prev => ({ ...prev, azkara_mother: v }))}
                  hebrewDay={motherHebrewDay}
                  hebrewMonth={motherHebrewMonth}
                  onHebrewDayChange={setMotherHebrewDay}
                  onHebrewMonthChange={setMotherHebrewMonth}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DatePickerField
                  label="תאריך לידה"
                  mode={birthMode}
                  onModeChange={setBirthMode}
                  gregorianDate={form.birth_date ?? ''}
                  onGregorianChange={v => setForm(prev => ({ ...prev, birth_date: v }))}
                  hebrewDay={birthHebrewDay}
                  hebrewMonth={birthHebrewMonth}
                  onHebrewDayChange={setBirthHebrewDay}
                  onHebrewMonthChange={setBirthHebrewMonth}
                />
                <Input
                  label="שבת בר מצווה"
                  value={form.bar_mitzvah_shabbat ?? ''}
                  onChange={set('bar_mitzvah_shabbat')}
                  placeholder="בראשית, נח, לך לך..."
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

// ─── Purpose label map ───────────────────────────────────────────────────────

const purposeLabel: Record<string, string> = {
  aliya: 'עלייה',
  kiddush: 'קידוש',
  annual_dues: 'דמי חבר',
  donation: 'תרומה',
};

const aliyaTypeLabel: Record<string, string> = {
  Kohen: 'כהן',
  Levi: 'לוי',
  Shlishi: 'שלישי',
  "Revi'i": "רביעי",
  Chamishi: 'חמישי',
  Shishi: 'שישי',
  "Shvi'i": 'שביעי',
  Maftir: 'מפטיר',
};

const relationLabel: Record<string, string> = {
  father: 'אבא',
  mother: 'אמא',
  spouse: 'בן/בת זוג',
  sibling: 'אח/אחות',
  child: 'ילד',
  other: 'אחר',
};

const simchaTypeLabel: Record<string, string> = {
  birthday: 'יום הולדת',
  anniversary: 'יום נישואין',
  bar_mitzvah: 'בר מצווה',
  bat_mitzvah: 'בת מצווה',
  brit: 'ברית מילה',
  upsherin: 'אפשרין',
  other: 'אחר',
};

// ─── Sub-tab components ───────────────────────────────────────────────────────

function PaymentsTab({ congregantId }: { congregantId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['congregant-payments', congregantId],
    queryFn: () => paymentsApi.history(congregantId),
  });

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-[#2E3A59]/40" />
    </div>
  );
  const payments = data?.payments ?? [];
  if (payments.length === 0)
    return <p className="text-sm text-gray-400 text-center py-8">אין תשלומים רשומים</p>;

  return (
    <div className="space-y-2">
      {data && (
        <div className="flex gap-4 text-xs text-gray-500 bg-slate-50 rounded-lg px-3 py-2">
          <span>סה"כ שולם: <span className="font-semibold text-[#2E3A59]">₪{data.total_paid.toLocaleString()}</span></span>
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {payments.map(p => (
          <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-gray-800">{purposeLabel[p.purpose] ?? p.purpose}</span>
              {p.notes && <span className="text-xs text-gray-400">{p.notes}</span>}
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-semibold text-[#2E3A59]">₪{p.amount.toLocaleString()}</span>
              {p.date && <span className="text-xs text-gray-400">{p.date}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AliyotTab({ congregantId }: { congregantId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['congregant-aliyot', congregantId],
    queryFn: () => aliyotApi.history(congregantId),
  });

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-[#2E3A59]/40" />
    </div>
  );
  const aliyot = data?.aliyot ?? [];
  if (aliyot.length === 0)
    return <p className="text-sm text-gray-400 text-center py-8">אין עליות רשומות</p>;

  return (
    <div className="space-y-2">
      {data && (
        <div className="text-xs text-gray-500 bg-slate-50 rounded-lg px-3 py-2">
          סה"כ עליות: <span className="font-semibold text-[#2E3A59]">{data.total_aliyot}</span>
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {aliyot.map(a => (
          <div key={a.id} className="flex items-center justify-between py-2.5 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-gray-800">{a.parasha}</span>
              <span className="text-xs text-gray-400">{aliyaTypeLabel[a.aliya_type] ?? a.aliya_type}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              {a.donation_amount > 0 && (
                <span className="text-xs font-medium text-[#C5A059]">₪{a.donation_amount.toLocaleString()}</span>
              )}
              {a.date && <span className="text-xs text-gray-400">{a.date}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsTab({ congregantId }: { congregantId: string }) {
  const { data: azData, isLoading: azLoading } = useQuery({
    queryKey: ['congregant-azkarot', congregantId],
    queryFn: () => azkarotApi.list(congregantId),
  });
  const { data: smData, isLoading: smLoading } = useQuery({
    queryKey: ['congregant-smachot', congregantId],
    queryFn: () => smachotApi.list(congregantId),
  });

  const isLoading = azLoading || smLoading;
  if (isLoading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-[#2E3A59]/40" />
    </div>
  );

  const azkarot = azData?.azkarot ?? [];
  const smachot = smData?.smachot ?? [];

  if (azkarot.length === 0 && smachot.length === 0)
    return <p className="text-sm text-gray-400 text-center py-8">אין אזכרות או שמחות רשומות</p>;

  return (
    <div className="space-y-4">
      {azkarot.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">אזכרות</p>
          <div className="divide-y divide-slate-100">
            {azkarot.map(az => (
              <div key={az.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-gray-800">{az.deceased_name}</span>
                  {az.relation && <span className="text-xs text-gray-400">{relationLabel[az.relation] ?? az.relation}</span>}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {az.next_gregorian && (
                    <span className="text-xs font-medium text-amber-600">הבא: {az.next_gregorian}</span>
                  )}
                  {az.gregorian_date && <span className="text-xs text-gray-400">{az.gregorian_date}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {smachot.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">שמחות</p>
          <div className="divide-y divide-slate-100">
            {smachot.map(sm => (
              <div key={sm.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-gray-800">
                    {simchaTypeLabel[sm.occasion_type] ?? sm.occasion_type}
                    {sm.description && ` – ${sm.description}`}
                  </span>
                  {sm.parasha && <span className="text-xs text-gray-400">פרשה: {sm.parasha}</span>}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {sm.next_gregorian && (
                    <span className="text-xs font-medium text-pink-500">הבא: {sm.next_gregorian}</span>
                  )}
                  {sm.gregorian_date && <span className="text-xs text-gray-400">{sm.gregorian_date}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Congregant detail / edit modal ──────────────────────────────────────────

type DetailTab = 'details' | 'payments' | 'aliyot' | 'events';

function CongregantDetailModal({
  congregant,
  onClose,
}: {
  congregant: Congregant;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>('details');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<CongregantCreate>>({
    first_name: congregant.first_name,
    last_name: congregant.last_name,
    hebrew_name: congregant.hebrew_name,
    father_name: congregant.father_name,
    mother_name: congregant.mother_name,
    phone: congregant.phone,
    email: congregant.email,
    address: congregant.address,
    is_kohen: congregant.is_kohen,
    is_levi: congregant.is_levi,
    member_type: congregant.member_type,
    notes: congregant.notes,
    join_date: congregant.join_date,
    gender: congregant.gender ?? 'male',
  });

  const { data: place } = useQuery({
    queryKey: ['congregant-place', congregant.id],
    queryFn: () => congregantsApi.getPlace(congregant.id).catch(() => null),
  });

  const updateMutation = useMutation({
    mutationFn: () => congregantsApi.update(congregant.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['congregants'] });
      setEditMode(false);
    },
  });

  const set = (field: keyof CongregantCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm(prev => ({ ...prev, [field]: value }));
    };

  const isFemale = form.gender === 'female';
  const title = editMode
    ? `עריכת ${congregant.first_name} ${congregant.last_name}`
    : `${congregant.first_name} ${congregant.last_name}`;

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'פרטים', icon: <Crown className="h-3.5 w-3.5" /> },
    { id: 'payments', label: 'תשלומים', icon: <CreditCard className="h-3.5 w-3.5" /> },
    { id: 'aliyot', label: 'עליות', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { id: 'events', label: 'אזכרות ושמחות', icon: <Star className="h-3.5 w-3.5" /> },
  ];

  return (
    <Modal open={true} onClose={onClose} title={title} size="lg">
      <div className="space-y-4" dir="rtl">
        {!editMode ? (
          <>
            {/* ── Profile header ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#2E3A59]/10 flex items-center justify-center text-[#2E3A59] text-xl font-bold shrink-0">
                  {congregant.first_name[0]}{congregant.last_name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{congregant.first_name} {congregant.last_name}</p>
                  {congregant.hebrew_name && <p className="text-sm text-gray-500">{congregant.hebrew_name}</p>}
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <Badge variant={isFemale ? 'warning' : 'info'}>{isFemale ? 'נקבה' : 'זכר'}</Badge>
                    <Badge variant={memberTypeVariant[congregant.member_type] ?? 'default'}>
                      {memberTypeLabel[congregant.member_type] ?? congregant.member_type}
                    </Badge>
                    {congregant.is_kohen && <Badge variant="info">כהן</Badge>}
                    {congregant.is_levi && <Badge variant="warning">לוי</Badge>}
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setEditMode(true)}>
                <Pencil className="h-3.5 w-3.5" /> עריכה
              </Button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm text-[#2E3A59]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            <div className="min-h-[160px]">
              {activeTab === 'details' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {congregant.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400" />{congregant.phone}
                      </div>
                    )}
                    {congregant.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />{congregant.email}
                      </div>
                    )}
                    {congregant.father_name && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Crown className="h-4 w-4 text-gray-400" />אבא: {congregant.father_name}
                      </div>
                    )}
                    {congregant.mother_name && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Crown className="h-4 w-4 text-gray-400" />אמא: {congregant.mother_name}
                      </div>
                    )}
                  </div>
                  {congregant.address && (
                    <p className="text-sm text-gray-500">{congregant.address}</p>
                  )}
                  {place && (
                    <div className="bg-[#2E3A59]/5 rounded-lg p-3 text-sm border border-[#2E3A59]/10">
                      <p className="font-medium text-[#2E3A59]">מקום מושב</p>
                      <p className="text-[#2E3A59]/70">אגף: {place.section} · שורה {place.row} · מושב #{place.place_number}</p>
                    </div>
                  )}
                  {congregant.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                      <p className="font-medium text-gray-700 mb-1">הערות</p>
                      {congregant.notes}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    הצטרף{isFemale ? 'ה' : ''}: {congregant.join_date}
                  </p>
                </div>
              )}
              {activeTab === 'payments' && <PaymentsTab congregantId={congregant.id} />}
              {activeTab === 'aliyot' && <AliyotTab congregantId={congregant.id} />}
              {activeTab === 'events' && <EventsTab congregantId={congregant.id} />}
            </div>
          </>
        ) : (
          /* ── Edit mode ── */
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="שם פרטי *" value={form.first_name ?? ''} onChange={set('first_name')} />
              <Input label="שם משפחה *" value={form.last_name ?? ''} onChange={set('last_name')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="שם בעברית" value={form.hebrew_name ?? ''} onChange={set('hebrew_name')} />
              <Input label="שם האב" value={form.father_name ?? ''} onChange={set('father_name')} />
            </div>
            <div className="grid grid-cols-3 gap-4 items-end">
              <Input label="שם האמא" value={form.mother_name ?? ''} onChange={set('mother_name')} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">מגדר</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden h-[38px]">
                  <button type="button" onClick={() => setForm(p => ({ ...p, gender: 'male' }))}
                    className={`flex-1 text-sm font-medium transition-colors ${form.gender !== 'female' ? 'bg-[#2E3A59] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    זכר
                  </button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, gender: 'female' }))}
                    className={`flex-1 text-sm font-medium transition-colors border-r border-gray-300 ${form.gender === 'female' ? 'bg-[#2E3A59] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    נקבה
                  </button>
                </div>
              </div>
              <DatePickerField
                label="תאריך הצטרפות"
                gregorianOnly
                mode="gregorian"
                onModeChange={() => {}}
                gregorianDate={form.join_date ?? ''}
                onGregorianChange={v => setForm(p => ({ ...p, join_date: v }))}
                hebrewDay="" hebrewMonth=""
                onHebrewDayChange={() => {}} onHebrewMonthChange={() => {}}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="טלפון" value={form.phone ?? ''} onChange={set('phone')} />
              <Input label="אימייל" type="email" value={form.email ?? ''} onChange={set('email')} />
            </div>
            <Input label="כתובת" value={form.address ?? ''} onChange={set('address')} />
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
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">הערות</label>
              <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E3A59] focus:border-[#2E3A59] transition-colors resize-none"
            rows={2}
            value={form.notes ?? ''}
            onChange={set('notes')}
              />
            </div>

            {updateMutation.error && (
              <p className="text-sm text-red-600">{(updateMutation.error as Error).message}</p>
            )}
            <div className="flex justify-start gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditMode(false)}>ביטול</Button>
              <Button
                loading={updateMutation.isPending}
                disabled={!form.first_name || !form.last_name}
                onClick={() => updateMutation.mutate()}
              >
                שמור שינויים
              </Button>
            </div>
          </>
        )}
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">מתפללים</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? 0} {isArchiveView ? 'בארכיב' : 'חברים רשומים'}</p>
        </div>
        {!isArchiveView && (
          <Button onClick={() => setShowAdd(true)}>
            <UserPlus className="h-4 w-4" /> הוסף מתפלל
          </Button>
        )}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => { setView('active'); clearSelection(); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'active' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          פעילים
        </button>
        <button
          onClick={() => { setView('archived'); clearSelection(); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'archived' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
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

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pr-9 pl-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3A59]"
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
            <div className="px-5 py-10 text-center text-sm text-slate-400">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="bg-slate-50 p-5 rounded-full mb-3">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">{isArchiveView ? 'אין מתפללים בארכיב.' : 'לא נמצאו מתפללים.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="rounded border-gray-300 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">שם</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">טלפון</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">אימייל</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">סטטוס</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">סוג</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {isArchiveView ? 'הועבר לארכיב' : 'הצטרף'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(c => (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 transition-colors ${checkedIds.has(c.id) ? 'bg-slate-50' : ''}`}
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
                          <div className="w-8 h-8 rounded-full bg-[#2E3A59]/10 flex items-center justify-center text-[#2E3A59] text-sm font-semibold shrink-0">
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
