import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Building2, Trash2, LayoutList, Map } from 'lucide-react';
import { seatingApi, congregantsApi, type Place, type PlaceCreate } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { clsx } from 'clsx';

// ─── Seat tile ────────────────────────────────────────────────────────────────

function SeatTile({ place, onClick }: { place: Place; onClick: () => void }) {
  const occupied = !!place.congregant_id;
  return (
    <button
      onClick={onClick}
      title={occupied ? `תפוס · ${place.section} ${place.row}${place.place_number}` : 'פנוי'}
      className={clsx(
        'w-10 h-10 rounded-lg text-xs font-semibold border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1',
        occupied
          ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 focus:ring-red-400'
          : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 focus:ring-blue-400',
      )}
    >
      {place.row}{place.place_number}
    </button>
  );
}

// ─── Single seat modal ────────────────────────────────────────────────────────

function AddSeatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: congregantsData } = useQuery({ queryKey: ['congregants'], queryFn: () => congregantsApi.list() });
  const [form, setForm] = useState<PlaceCreate>({ section: 'ראשי', row: 'א', place_number: 1, congregant_id: '', is_reserved: false, annual_fee: 0, notes: '' });

  const mutation = useMutation({
    mutationFn: () => seatingApi.create({ ...form, congregant_id: form.congregant_id || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['places'] }); onClose(); },
  });

  const set = (field: keyof PlaceCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === 'place_number' || field === 'annual_fee' ? Number(e.target.value)
      : field === 'is_reserved' ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal open={open} onClose={onClose} title="הוספת מושב">
      <div className="space-y-4" dir="rtl">
        <div className="grid grid-cols-3 gap-4">
          <Input label="אגף" value={form.section} onChange={set('section')} placeholder="ראשי" />
          <Input label="שורה" value={form.row} onChange={set('row')} placeholder="א" />
          <Input label="מספר מושב" type="number" min={1} value={form.place_number} onChange={set('place_number')} />
        </div>
        <Select label="שייך למתפלל (אופציונלי)" value={form.congregant_id ?? ''} onChange={set('congregant_id')}>
          <option value="">— לא משויך —</option>
          {congregantsData?.congregants.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label="דמי מקום שנתיים (₪)" type="number" min={0} value={form.annual_fee} onChange={set('annual_fee')} />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer mt-6">
            <input type="checkbox" className="rounded border-gray-300" checked={form.is_reserved} onChange={set('is_reserved')} />
            מקום שמור
          </label>
        </div>
        {mutation.error && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="flex justify-start gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>ביטול</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>הוסף מושב</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Seat detail modal ────────────────────────────────────────────────────────

function SeatDetailModal({ place, onClose }: { place: Place; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: congregantsData } = useQuery({ queryKey: ['congregants'], queryFn: () => congregantsApi.list() });
  const [assignId, setAssignId] = useState(place.congregant_id ?? '');

  const assignMutation = useMutation({
    mutationFn: () => seatingApi.assign(place.id, assignId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['places'] }); onClose(); },
  });
  const unassignMutation = useMutation({
    mutationFn: () => seatingApi.unassign(place.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['places'] }); onClose(); },
  });

  const currentName = congregantsData?.congregants.find(c => c.id === place.congregant_id);

  return (
    <Modal open={true} onClose={onClose} title={`מושב ${place.row}${place.place_number} · ${place.section}`}>
      <div className="space-y-4" dir="rtl">
        <div className="flex gap-2 flex-wrap">
          <Badge variant={place.congregant_id ? 'danger' : 'success'}>{place.congregant_id ? 'תפוס' : 'פנוי'}</Badge>
          {place.is_reserved && <Badge variant="warning">שמור</Badge>}
          {place.annual_fee > 0 && <Badge variant="info">₪{place.annual_fee}/שנה</Badge>}
        </div>
        {currentName && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 border border-blue-100">
            משויך כעת ל: <span className="font-semibold">{currentName.first_name} {currentName.last_name}</span>
          </div>
        )}
        <Select label="שייך למתפלל" value={assignId} onChange={e => setAssignId(e.target.value)}>
          <option value="">— לא משויך —</option>
          {congregantsData?.congregants.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </Select>
        <div className="flex justify-between gap-3 pt-2">
          {place.congregant_id && (
            <Button variant="danger" size="sm" loading={unassignMutation.isPending} onClick={() => unassignMutation.mutate()}>
              <Trash2 className="h-3 w-3" /> הסר שיוך
            </Button>
          )}
          <div className="flex gap-3 mr-auto">
            <Button variant="secondary" onClick={onClose}>ביטול</Button>
            <Button loading={assignMutation.isPending} disabled={!assignId} onClick={() => assignMutation.mutate()}>שייך</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Map Builder ─────────────────────────────────────────────────────────────

interface RowDef { rowLabel: string; count: number; }
interface SectionDef { name: string; rows: RowDef[]; }

function MapBuilderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [sections, setSections] = useState<SectionDef[]>([
    { name: 'ראשי', rows: [{ rowLabel: 'א', count: 10 }] },
  ]);
  const [annualFee, setAnnualFee] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);
  const [buildError, setBuildError] = useState('');

  const addSection = () => setSections(s => [...s, { name: `אגף ${s.length + 1}`, rows: [{ rowLabel: 'א', count: 10 }] }]);
  const removeSection = (si: number) => setSections(s => s.filter((_, i) => i !== si));
  const updateSection = (si: number, name: string) => setSections(s => s.map((sec, i) => i === si ? { ...sec, name } : sec));

  const addRow = (si: number) => {
    const nextLabel = String.fromCharCode('א'.charCodeAt(0) + sections[si].rows.length);
    setSections(s => s.map((sec, i) => i === si
      ? { ...sec, rows: [...sec.rows, { rowLabel: nextLabel, count: 10 }] }
      : sec));
  };
  const removeRow = (si: number, ri: number) => setSections(s => s.map((sec, i) => i === si
    ? { ...sec, rows: sec.rows.filter((_, j) => j !== ri) }
    : sec));
  const updateRow = (si: number, ri: number, field: keyof RowDef, value: string | number) =>
    setSections(s => s.map((sec, i) => i === si
      ? { ...sec, rows: sec.rows.map((r, j) => j === ri ? { ...r, [field]: value } : r) }
      : sec));

  const totalSeats = sections.reduce((acc, sec) => acc + sec.rows.reduce((a, r) => a + r.count, 0), 0);

  const hasEmptyRowLabels = sections.some(sec => sec.rows.some(r => !r.rowLabel.trim()));
  const hasEmptySectionNames = sections.some(s => !s.name.trim());

  const handleBuild = async () => {
    setIsBuilding(true);
    setResult(null);
    setBuildError('');
    let created = 0;
    let failed = 0;
    try {
      for (const sec of sections) {
        for (const row of sec.rows) {
          for (let n = 1; n <= row.count; n++) {
            try {
              await seatingApi.create({ section: sec.name.trim(), row: row.rowLabel.trim(), place_number: n, annual_fee: annualFee });
              created++;
            } catch {
              failed++;
            }
            setProgress(`יוצר מושבים... ${created + failed} / ${totalSeats}`);
          }
        }
      }
      if (created === 0) {
        setBuildError('לא נוצר אף מושב. ייתכן שהמושבים כבר קיימים או שיש בעיה בחיבור לשרת.');
      } else {
        setResult({ created, failed });
        await qc.invalidateQueries({ queryKey: ['places'] });
      }
    } catch (err) {
      setBuildError(`שגיאה בלתי צפויה: ${(err as Error).message}`);
    } finally {
      setIsBuilding(false);
      setProgress('');
    }
  };

  const handleClose = () => {
    setResult(null);
    setBuildError('');
    setProgress('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="בניית מפת בית הכנסת" size="lg">
      <div className="space-y-5" dir="rtl">

        {result ? (
          /* ── Success state ── */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{result.created} מושבים נוצרו בהצלחה!</p>
              {result.failed > 0 && (
                <p className="text-sm text-amber-600 mt-1">{result.failed} מושבים דולגו (כנראה כבר קיימים)</p>
              )}
            </div>
            <Button onClick={handleClose}>סגור וצפה במפה</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">הגדר אגפים, שורות ומספר מושבים בכל שורה. המערכת תיצור את כל המושבים אוטומטית.</p>

            {/* Annual fee */}
            <Input label="דמי מקום שנתיים (₪) — אחיד לכל המושבים" type="number" min={0} value={annualFee}
              onChange={e => setAnnualFee(Number(e.target.value))} placeholder="0" className="w-64" />

            {/* Sections */}
            <div className="space-y-4">
              {sections.map((sec, si) => (
                <div key={si} className="border border-blue-100 rounded-xl p-4 bg-blue-50 space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      label="שם אגף"
                      value={sec.name}
                      onChange={e => updateSection(si, e.target.value)}
                      placeholder="ראשי / מזרח / עזרת נשים..."
                      className="flex-1"
                    />
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(si)} className="mt-5 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Rows */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500">שורות</p>
                    {sec.rows.map((row, ri) => (
                      <div key={ri} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-blue-100">
                        <Input
                          placeholder="תווית שורה (א, ב, 1...)"
                          value={row.rowLabel}
                          onChange={e => updateRow(si, ri, 'rowLabel', e.target.value)}
                          className="w-40"
                        />
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>מספר מושבים:</span>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={row.count}
                            onChange={e => updateRow(si, ri, 'count', Number(e.target.value))}
                            className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {sec.rows.length > 1 && (
                          <button onClick={() => removeRow(si, ri)} className="text-red-400 hover:text-red-600 mr-auto">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addRow(si)} className="text-blue-600">
                      + הוסף שורה
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="secondary" onClick={addSection} className="w-full">
              + הוסף אגף
            </Button>

            {/* Summary */}
            <div className="bg-blue-100 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">סיכום</p>
              {sections.map((sec, si) => (
                <p key={si}>
                  אגף <strong>{sec.name || '?'}</strong>: {sec.rows.length} שורות, {sec.rows.reduce((a, r) => a + r.count, 0)} מושבים
                </p>
              ))}
              <p className="font-bold mt-2 text-blue-900">סה״כ: {totalSeats} מושבים ייוצרו</p>
            </div>

            {progress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-sm text-blue-700 text-center font-medium">{progress}</p>
              </div>
            )}

            {buildError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{buildError}</p>
            )}

            {(hasEmptySectionNames || hasEmptyRowLabels) && (
              <p className="text-xs text-amber-600">יש למלא שמות לכל האגפים והשורות לפני הבנייה.</p>
            )}

            <div className="flex justify-start gap-3 pt-2">
              <Button variant="secondary" onClick={handleClose}>ביטול</Button>
              <Button
                loading={isBuilding}
                disabled={totalSeats === 0 || hasEmptySectionNames || hasEmptyRowLabels}
                onClick={handleBuild}
              >
                <Building2 className="h-4 w-4" /> צור {totalSeats} מושבים
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Seating() {
  const qc = useQueryClient();
  const [sectionFilter, setSectionFilter] = useState('');
  const [onlyFree, setOnlyFree] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['places', sectionFilter, onlyFree],
    queryFn: () => seatingApi.list(sectionFilter || undefined, onlyFree),
  });

  const places = data?.places ?? [];
  const occupied = places.filter(p => p.congregant_id).length;
  const free = places.length - occupied;

  const sections = [...new Set(places.map(p => p.section))].sort();
  const grouped: Record<string, Record<string, Place[]>> = {};
  for (const p of places) {
    if (!grouped[p.section]) grouped[p.section] = {};
    if (!grouped[p.section][p.row]) grouped[p.section][p.row] = [];
    grouped[p.section][p.row].push(p);
  }
  for (const sec of Object.values(grouped)) {
    for (const row of Object.values(sec)) {
      row.sort((a, b) => a.place_number - b.place_number);
    }
  }

  const allChecked = places.length > 0 && places.every(p => checkedIds.has(p.id));
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(places.map(p => p.id)));
  };
  const toggle = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: () => seatingApi.bulkDelete([...checkedIds]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['places'] });
      setCheckedIds(new Set());
    },
  });

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מפת מושבים</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total ?? 0} מושבים · <span className="text-red-600">{occupied} תפוסים</span> · <span className="text-emerald-600">{free} פנויים</span>
          </p>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex gap-1 bg-blue-100 rounded-xl p-1">
            <button onClick={() => setViewMode('map')} title="מפה"
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Map className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} title="רשימה"
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          <Button variant="secondary" onClick={() => setShowBuilder(true)}>
            <Building2 className="h-4 w-4" /> בנה מפה
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <PlusCircle className="h-4 w-4" /> מושב בודד
          </Button>
        </div>
      </div>

      {/* Bulk bar (list mode only) */}
      {checkedIds.size > 0 && viewMode === 'list' && (
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

      {/* Legend + filters */}
      <Card className="border-blue-100">
        <CardContent className="flex items-center gap-6 py-3">
          {viewMode === 'map' && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded bg-blue-50 border-2 border-blue-300" />
                <span className="text-gray-600">פנוי</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded bg-red-100 border-2 border-red-300" />
                <span className="text-gray-600">תפוס</span>
              </div>
            </>
          )}
          <div className="mr-auto flex items-center gap-3">
            <Select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="w-36">
              <option value="">כל האגפים</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={onlyFree} onChange={e => setOnlyFree(e.target.checked)} className="rounded border-gray-300" />
              פנויים בלבד
            </label>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card><CardContent className="py-8 text-center text-sm text-gray-400">טוען מפת מושבים...</CardContent></Card>
      ) : places.length === 0 ? (
        <Card className="border-blue-100">
          <CardContent className="py-12 text-center">
            <Building2 className="h-10 w-10 text-blue-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">עוד אין מושבים</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">השתמש ב״בנה מפת בית כנסת״ כדי ליצור את כל המושבים בבת אחת</p>
            <Button onClick={() => setShowBuilder(true)}>
              <Building2 className="h-4 w-4" /> בנה מפת בית כנסת
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'map' ? (
        // Map view
        Object.entries(grouped).map(([section, rows]) => (
          <Card key={section} className="border-blue-100">
            <CardHeader><CardTitle>אגף {section}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(rows).sort().map(([row, seats]) => (
                <div key={row} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-semibold text-gray-400 text-center shrink-0">{row}</span>
                  <div className="flex flex-wrap gap-2">
                    {seats.map(seat => (
                      <SeatTile key={seat.id} place={seat} onClick={() => setSelected(seat)} />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      ) : (
        // List view with checkboxes
        <Card className="border-blue-100">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50">
                    <th className="px-3 py-3 w-10">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll}
                        className="rounded border-gray-300 cursor-pointer" />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">אגף</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">שורה</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">מספר</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">סטטוס</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">דמי מקום</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {places.map(p => (
                    <tr key={p.id} className={`hover:bg-blue-50 transition-colors ${checkedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={checkedIds.has(p.id)} onChange={() => toggle(p.id)}
                          className="rounded border-gray-300 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(p)}>{p.section}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(p)}>{p.row}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(p)}>{p.place_number}</td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(p)}>
                        {p.congregant_id
                          ? <Badge variant="warning">תפוס</Badge>
                          : <Badge variant="success">פנוי</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 cursor-pointer" onClick={() => setSelected(p)}>
                        {p.annual_fee ? `₪${p.annual_fee.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <AddSeatModal open={showAdd} onClose={() => setShowAdd(false)} />
      <MapBuilderModal open={showBuilder} onClose={() => setShowBuilder(false)} />
      {selected && <SeatDetailModal place={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
