import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, AlertCircle, Heart, Star } from 'lucide-react';
import { congregantsApi, paymentsApi, eventsApi } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const hebrewMonthNames: Record<number, string> = {
  1: 'ניסן', 2: 'אייר', 3: 'סיוון', 4: 'תמוז', 5: 'אב', 6: 'אלול',
  7: 'תשרי', 8: 'חשוון', 9: 'כסלו', 10: 'טבת', 11: 'שבט',
  12: 'אדר', 13: 'אדר ב׳',
};

function StatCard({ title, value, icon: Icon, color, sub }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <Card className="bg-white border-blue-100">
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
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
    <div className="p-6 space-y-6" dir="rtl">

      {/* Header with logo area */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
          <p className="text-sm text-gray-500 mt-1">ברוכים הבאים למערכת גבאי לניהול בית הכנסת</p>
        </div>
        {/* Synagogue Logo area */}
        <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 border border-blue-100 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center overflow-hidden">
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
            <div className="hidden w-full h-full items-center justify-center text-blue-300 text-3xl">✡</div>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">בית הכנסת</p>
            <p className="text-xs text-blue-400">הוסף לוגו בתיקייה public/</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="סה״כ מתפללים"
          value={congregantsData?.total ?? '—'}
          icon={Users}
          color="bg-blue-500"
          sub="חברי קהילה רשומים"
        />
        <StatCard
          title="סה״כ תרומות"
          value={`₪${totalAmount.toLocaleString()}`}
          icon={CreditCard}
          color="bg-emerald-500"
          sub="מאז ההתחלה"
        />
        <StatCard
          title="יתרות פתוחות"
          value={pendingData?.total_pending ?? '—'}
          icon={AlertCircle}
          color="bg-amber-500"
          sub="חברים ללא תשלום"
        />
        <StatCard
          title="אירועים קרובים"
          value={(azkarotData?.total ?? 0) + (smachotData?.total ?? 0)}
          icon={Heart}
          color="bg-purple-500"
          sub="ב-30 הימים הקרובים"
        />
      </div>

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border-blue-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-gray-400" />
              <CardTitle>אזכרות קרובות</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!azkarotData?.azkarot?.length ? (
              <p className="text-sm text-gray-400 px-5 py-4">אין אזכרות ב-30 הימים הקרובים.</p>
            ) : (
              <ul className="divide-y divide-blue-50">
                {azkarotData.azkarot.slice(0, 5).map((a) => (
                  <li key={a.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.deceased_name}</p>
                      <p className="text-xs text-gray-500">
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

        <Card className="border-blue-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-gray-400" />
              <CardTitle>שמחות קרובות</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!smachotData?.smachot?.length ? (
              <p className="text-sm text-gray-400 px-5 py-4">אין שמחות ב-30 הימים הקרובים.</p>
            ) : (
              <ul className="divide-y divide-blue-50">
                {smachotData.smachot.slice(0, 5).map((s) => (
                  <li key={s.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.description || s.occasion_type}</p>
                      <p className="text-xs text-gray-500">
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
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <CardTitle>חברים ללא תשלום</CardTitle>
              </div>
              <Badge variant="warning">{pendingData?.total_pending} ממתינים</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-amber-50">
              {pendingData?.congregants.slice(0, 5).map((c) => (
                <li key={c.id} className="px-5 py-3 text-sm text-gray-700">{c.name}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
