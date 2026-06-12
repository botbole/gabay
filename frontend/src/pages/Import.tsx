import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Link, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { congregantsApi, type BulkImportResult } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

const CSV_TEMPLATE = `first_name,last_name,father_name,mother_name,phone,email,address,is_kohen,is_levi,member_type,birth_date,bar_mitzvah_shabbat,azkara_father,azkara_mother,notes
משה,כהן,אברהם,שרה,050-1111111,moshe@example.com,ירושלים,true,false,regular,15/03/1975,,10/02/1955,,
ישראל,לוי,יצחק,רבקה,052-2222222,,תל אביב,false,true,regular,,,,21/11/1998,`;

const HEBREW_TEMPLATE = `שם פרטי,שם משפחה,שם אבא,שם אמא,טלפון,אימייל,כתובת,כהן/לוי/ישראל,סוג חברות,תאריך לידה,שבת בר מצווה,אזכרה אבא,אזכרה אמא,הערות
משה,כהן,אברהם,שרה,050-1111111,moshe@example.com,ירושלים,כהן,קבוע,15/03/1975,,,10/02/1955,
ישראל,לוי,יצחק,רבקה,052-2222222,,תל אביב,לוי,קבוע,,,,21/11/1998,`;

function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ResultSummary({ result }: { result: BulkImportResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-800">ייבוא הושלם!</p>
          <p className="text-sm text-emerald-600">{result.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-2xl font-bold text-emerald-700">{result.created}</p>
          <p className="text-xs text-emerald-600">נוצרו</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-2xl font-bold text-amber-700">{result.skipped?.length ?? 0}</p>
          <p className="text-xs text-amber-600">דולגו</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
          <p className="text-2xl font-bold text-red-700">{result.errors?.length ?? 0}</p>
          <p className="text-xs text-red-600">שגיאות</p>
        </div>
      </div>

      {result.skipped?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-amber-700 mb-2">שורות שדולגו</p>
          <ul className="space-y-1">
            {result.skipped.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                שורה {s.row}: {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.errors?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-red-700 mb-2">שגיאות</p>
          <ul className="space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                שורה {e.row} ({e.name}): {e.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Import() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [activeTab, setActiveTab] = useState<'csv' | 'sheets'>('csv');

  const csvMutation = useMutation({
    mutationFn: (file: File) => congregantsApi.bulkImportCsv(file),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['congregants'] });
    },
  });

  const sheetsMutation = useMutation({
    mutationFn: () => congregantsApi.bulkImportSheets(sheetsUrl),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['congregants'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) csvMutation.mutate(file);
  };

  const reset = () => {
    setResult(null);
    csvMutation.reset();
    sheetsMutation.reset();
    setSheetsUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ייבוא מתפללים</h1>
        <p className="text-sm text-gray-500 mt-1">ייבוא מרובה של מתפללים מקובץ CSV או מטופס Google</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-blue-100 rounded-xl p-1 w-fit">
        {(['csv', 'sheets'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); reset(); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'csv' ? '📄 קובץ CSV' : '📊 Google Sheets'}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>תוצאות ייבוא</CardTitle>
              <Button variant="ghost" size="sm" onClick={reset}>ייבוא נוסף</Button>
            </div>
          </CardHeader>
          <CardContent><ResultSummary result={result} /></CardContent>
        </Card>
      )}

      {!result && (
        <>
          {/* CSV Tab */}
          {activeTab === 'csv' && (
            <Card className="border-blue-100">
              <CardHeader><CardTitle>ייבוא מקובץ CSV</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {/* Template download */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-semibold text-blue-800 mb-2">הורד תבנית CSV</p>
                  <p className="text-xs text-blue-600 mb-3">
                    הורד תבנית, מלא אותה בנתוני המתפללים, ואז העלה אותה חזרה.
                    ניתן להשתמש בעברית או באנגלית כותרות עמודות.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => downloadCsv(CSV_TEMPLATE, 'mispallelim_template_en.csv')}>
                      <Download className="h-3.5 w-3.5" /> תבנית באנגלית
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => downloadCsv(HEBREW_TEMPLATE, 'mispallelim_template_he.csv')}>
                      <Download className="h-3.5 w-3.5" /> תבנית בעברית
                    </Button>
                  </div>
                </div>

                {/* Column guide */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">עמודות נתמכות</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                    {[
                      ['שם פרטי / first_name', 'חובה'],
                      ['שם משפחה / last_name', 'חובה'],
                      ['שם אבא / father_name', 'אופציונלי'],
                      ['שם אמא / mother_name', 'אופציונלי'],
                      ['טלפון / phone', 'אופציונלי'],
                      ['אימייל / email', 'אופציונלי'],
                      ['כתובת / address', 'אופציונלי'],
                      ['כהן/לוי/ישראל', 'כהן | לוי | ישראל'],
                      ['תאריך לידה / birth_date', 'DD/MM/YYYY'],
                      ['שבת בר מצווה / bar_mitzvah_shabbat', 'DD/MM/YYYY'],
                      ['אזכרה אבא / azkara_father', 'DD/MM/YYYY'],
                      ['אזכרה אמא / azkara_mother', 'DD/MM/YYYY'],
                      ['סוג חברות / member_type', 'regular/guest/occasional'],
                      ['הערות / notes', 'אופציונלי'],
                    ].map(([col, note]) => (
                      <div key={col} className="flex gap-1">
                        <span className="font-mono bg-gray-100 px-1 rounded text-xs">{col}</span>
                        <Badge variant={note === 'חובה' ? 'danger' : 'default'} className="text-xs">{note}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">לחץ לבחירת קובץ CSV</p>
                  <p className="text-xs text-gray-400 mt-1">קובץ CSV בקידוד UTF-8 (ניתן לייצא מ-Excel)</p>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                </div>

                {csvMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                    מייבא מתפללים...
                  </div>
                )}
                {csvMutation.error && (
                  <p className="text-sm text-red-600">{(csvMutation.error as Error).message}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Google Sheets Tab */}
          {activeTab === 'sheets' && (
            <Card className="border-blue-100">
              <CardHeader><CardTitle>ייבוא מ-Google Sheets</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {/* Instructions */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-2">
                  <p className="text-sm font-semibold text-blue-800">איך לקבל את הקישור מ-Google Sheets</p>
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>פתח את ה-Google Sheet שלך</li>
                    <li>לחץ על <strong>קובץ ← שתף ← פרסם לאינטרנט</strong></li>
                    <li>בחר את הגיליון הרצוי ואת הפורמט <strong>ערכים מופרדים בפסיקים (.csv)</strong></li>
                    <li>לחץ <strong>פרסם</strong> והעתק את הקישור</li>
                    <li>הדבק את הקישור למטה</li>
                  </ol>
                  <p className="text-xs text-blue-500 mt-2">
                    💡 טיפ: ניתן גם להשתמש בטופס Google Forms — התשובות נשמרות אוטומטית ב-Sheets.
                    פרסם את גיליון התשובות.
                  </p>
                </div>

                {/* Google Forms field mapping tip */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-sm font-semibold text-amber-800 mb-1">הכנת טופס Google Forms</p>
                  <p className="text-xs text-amber-700">
                    צור טופס עם שאלות בשמות:{' '}
                    {['שם פרטי','שם משפחה','שם אבא','שם אמא','טלפון','אימייל','כתובת',
                      'כהן/לוי/ישראל','תאריך לידה','שבת בר מצווה','אזכרה אבא','אזכרה אמא'].map(f => (
                      <span key={f} className="font-mono bg-amber-100 px-1 rounded mx-0.5">{f}</span>
                    ))}.{' '}
                    Google Forms ישמור תשובות לגיליון שניתן לפרסם.
                  </p>
                </div>

                <Input
                  label="קישור לגיליון שפורסם"
                  value={sheetsUrl}
                  onChange={e => setSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  type="url"
                />

                {sheetsMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                    מייבא מהגיליון...
                  </div>
                )}
                {sheetsMutation.error && (
                  <p className="text-sm text-red-600">{(sheetsMutation.error as Error).message}</p>
                )}

                <Button
                  loading={sheetsMutation.isPending}
                  disabled={!sheetsUrl.startsWith('http')}
                  onClick={() => sheetsMutation.mutate()}
                  className="w-full"
                >
                  <Link className="h-4 w-4" /> ייבא מהגיליון
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
