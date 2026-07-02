import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, AlertCircle, Heart, Star, CalendarDays } from 'lucide-react';
import { congregantsApi, paymentsApi, eventsApi } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const hebrewMonthNames: Record<number, string> = {
  1: 'ניסן', 2: 'אייר', 3: 'סיוון', 4: 'תמוז', 5: 'אב', 6: 'אלול',
  7: 'תשרי', 8: 'חשוון', 9: 'כסלו', 10: 'טבת', 11: 'שבט',
  12: 'אדר', 13: 'אדר ב׳',
};

function StatCard({ title, value, icon: Icon, gradient, sub }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  sub?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-md ${gradient} flex items-center gap-4`}>
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-white/70">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyListMessage({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <CalendarDays className="w-8 h-8 text-slate-300 mb-2" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

export function Dashboard() {
  const { data: congregantsData } = useQuery({
    queryKey: ['congregants'],
    queryFn: () => congregantsApi.list(),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.list(),
  });

  const { data: pendingData } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => paymentsApi.pending(),
  });

  const { data: azkarotData } = useQuery({
    queryKey: ['upcoming-azkarot'],
    queryFn: () => eventsApi.upcomingAzkarot(30),
  });

  const { data: smachotData } = useQuery({
    queryKey: ['upcoming-smachot'],
    queryFn: () => eventsApi.upcomingSmachot(30),
  });

  const totalAmount = paymentsData?.total_amount ?? 0;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">לוח בקרה</h1>
          <p className="text-slate-500 mt-1">ברוכים הבאים למערכת גבאי — ניהול קהילה חכם ומסורתי</p>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="/synagogue-logo.png"
              alt="לוגו בית הכנסת"
              className="w-full h-full object-contain"
              onError={e => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                (el.nextSibling as HTMLElement).style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-slate-300 text-2xl">✡</div>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">בית הכנסת</p>
            <p className="text-xs text-slate-400">הוסף לוגו בתיקייה public/</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="סה״כ מתפללים"
          value={congregantsData?.total ?? '—'}
          icon={Users}
          gradient="bg-gradient-to-br from-[#2E3A59] to-[#3d4f7a]"
          sub="חברי קהילה רשומים"
        />
        <StatCard
          title="סה״כ תרומות"
          value={`₪${totalAmount.toLocaleString()}`}
          icon={CreditCard}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-500"
          sub="מאז ההתחלה"
        />
        <StatCard
          title="יתרות פתוחות"
          value={pendingData?.total_pending ?? '—'}
          icon={AlertCircle}
          gradient="bg-gradient-to-br from-amber-500 to-amber-400"
          sub="חברים ללא תשלום"
        />
        <StatCard
          title="אירועים קרובים"
          value={(azkarotData?.total ?? 0) + (smachotData?.total ?? 0)}
          icon={Heart}
          gradient="bg-gradient-to-br from-[#C5A059] to-[#d4b070]"
          sub="ב-30 הימים הקרובים"
        />
      </div>

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Azkarot */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-slate-500" />
                </div>
                <CardTitle>אזכרות קרובות</CardTitle>
              </div>
              {(azkarotData?.total ?? 0) > 0 && (
                <Badge variant="info">{azkarotData?.total} אזכרות</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!azkarotData?.azkarot?.length ? (
              <EmptyListMessage text="אין אזכרות ב-30 הימים הקרובים." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {azkarotData.azkarot.slice(0, 5).map((a) => (
                  <li key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{a.deceased_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.relation} · {hebrewMonthNames[a.hebrew_month]} {a.hebrew_day}
                      </p>
                    </div>
                    {a.next_gregorian && <Badge variant="info">{a.next_gregorian}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Smachot */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-rose-400" />
                </div>
                <CardTitle>שמחות קרובות</CardTitle>
              </div>
              {(smachotData?.total ?? 0) > 0 && (
                <Badge variant="success">{smachotData?.total} שמחות</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!smachotData?.smachot?.length ? (
              <EmptyListMessage text="אין שמחות ב-30 הימים הקרובים." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {smachotData.smachot.slice(0, 5).map((s) => (
                  <li key={s.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{s.description || s.occasion_type}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.occasion_type} · {hebrewMonthNames[s.hebrew_month]} {s.hebrew_day}
                      </p>
                    </div>
                    {s.next_gregorian && <Badge variant="success">{s.next_gregorian}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      {(pendingData?.total_pending ?? 0) > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </div>
                <CardTitle>חברים ללא תשלום</CardTitle>
              </div>
              <Badge variant="warning">{pendingData?.total_pending} ממתינים</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-amber-50">
              {pendingData?.congregants.slice(0, 5).map((c) => (
                <li key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-amber-50/50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-amber-600">{c.name?.[0]}</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{c.name}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
