import type { ElementType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, AlertCircle, Heart, Star, CalendarDays, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { congregantsApi, paymentsApi, azkarotApi, smachotApi, scheduleApi } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

const hebrewMonthNames: Record<number, string> = {
  1: 'ניסן', 2: 'אייר', 3: 'סיוון', 4: 'תמוז', 5: 'אב', 6: 'אלול',
  7: 'תשרי', 8: 'חשוון', 9: 'כסלו', 10: 'טבת', 11: 'שבט',
  12: 'אדר', 13: 'אדר ב׳',
};

const RELATION_LABELS: Record<string, string> = {
  father: 'אבא', mother: 'אמא', spouse: 'בן/בת זוג',
  sibling: 'אח/אחות', child: 'ילד', other: 'קרוב משפחה',
};

const OCCASION_LABELS: Record<string, string> = {
  birthday: 'יום הולדת', anniversary: 'יום נישואין',
  bar_mitzvah: 'בר מצוה', bat_mitzvah: 'בת מצוה',
  brit: 'ברית מילה', upsherin: 'חלאקה', other: 'שמחה',
};

// ─── Hero Banner ──────────────────────────────────────────────────────────────

function HeroBanner({ congregantsTotal }: { congregantsTotal: number }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';

  return (
    <div
      className="rounded-2xl px-7 py-6 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--color-indigo) 0%, var(--color-indigo-soft) 100%)' }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute top-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 left-1/3 w-32 h-32 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-white/60 text-sm font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-bold mt-1">ברוכים הבאים למערכת גבאי</h1>
          <p className="text-white/70 text-sm mt-1">ניהול קהילה חכם, מסורתי ויעיל</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{congregantsTotal}</p>
            <p className="text-white/60 text-xs mt-0.5">מתפללים רשומים</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden">
            <img
              src="/synagogue-logo.png"
              alt="לוגו"
              className="w-full h-full object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-2xl hidden">✡</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ElementType;
  accentColor: string;
  bgGradient: string;
  sub?: string;
  textColor?: string;
}

function StatCard({ title, value, icon: Icon, accentColor, bgGradient, sub, textColor }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ background: bgGradient }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white/25"
      >
        <Icon className="h-6 w-6" style={{ color: textColor ?? accentColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: textColor ? `${textColor}cc` : '#64748b' }}>{title}</p>
        <p className="text-2xl font-bold tracking-tight mt-0.5" style={{ color: textColor ?? accentColor }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: textColor ? `${textColor}99` : '#94a3b8' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section Card Header ──────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  badge,
}: {
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  badge?: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <CardTitle>{title}</CardTitle>
      </div>
      {badge !== undefined && Number(badge) > 0 && (
        <Badge variant="info">{badge}</Badge>
      )}
    </div>
  );
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function TodayTimesCard() {
  const today = todayIso();
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['schedule', today],
    queryFn: () => scheduleApi.getSchedule(today),
    retry: 1,
  });

  const prayers = data?.prayers ?? [];

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          icon={Clock}
          iconBg="color-mix(in srgb, var(--color-gold) 16%, white)"
          iconColor="var(--color-gold)"
          title="זמני היום"
          badge={prayers.length || undefined}
        />
      </CardHeader>
      <CardContent className="p-0">
        {isFetching && (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        )}
        {isError && !isFetching && (
          <div className="flex flex-col items-center gap-2 py-6 text-center px-5">
            <p className="text-sm text-red-500">שגיאה בטעינת נתוני זמנים</p>
            <p className="text-xs text-slate-400">ייתכן שיש בעיית חיבור לשירות הזמנים</p>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              נסה שנית
            </Button>
          </div>
        )}
        {data && !isFetching && !isError && (
          <>
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-indigo)' }}>
                {data.hebrew_date}
              </p>
              {data.city && (
                <p className="text-xs text-slate-400 mt-0.5">{data.city}</p>
              )}
            </div>
            {prayers.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="אין תפילות להצגה"
                description="הוסיפו כללי תפילה בעמוד לוח התפילות"
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {prayers.map((p) => (
                  <li
                    key={p.id}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: p.is_lesson ? '#15803d' : 'var(--color-indigo)' }}
                    >
                      {p.name}
                    </span>
                    <span className="text-sm font-mono text-slate-600 shrink-0">
                      {p.no_auto_time ? (p.notes || '—') : (p.calculated_time || '—')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
    queryFn: () => azkarotApi.upcoming(30),
  });

  const { data: smachotData } = useQuery({
    queryKey: ['upcoming-smachot'],
    queryFn: () => smachotApi.upcoming(30),
  });

  const totalAmount = paymentsData?.total_amount ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">

      {/* Hero Banner */}
      <HeroBanner congregantsTotal={congregantsData?.total ?? 0} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="סה״כ מתפללים"
          value={congregantsData?.total ?? '—'}
          icon={Users}
          accentColor="white"
          textColor="white"
          bgGradient="linear-gradient(135deg, var(--color-indigo) 0%, var(--color-indigo-soft) 100%)"
          sub="חברי קהילה רשומים"
        />
        <StatCard
          title="סה״כ נגבה"
          value={`₪${totalAmount.toLocaleString()}`}
          icon={TrendingUp}
          accentColor="#059669"
          bgGradient="linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
          sub="מאז ההתחלה"
        />
        <StatCard
          title="יתרות פתוחות"
          value={pendingData?.total_pending ?? '—'}
          icon={AlertCircle}
          accentColor="#d97706"
          bgGradient="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
          sub="חברים ללא תשלום"
        />
        <StatCard
          title="אירועים קרובים"
          value={(azkarotData?.total ?? 0) + (smachotData?.total ?? 0)}
          icon={Heart}
          accentColor="white"
          textColor="white"
          bgGradient="linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-light) 100%)"
          sub="ב-30 הימים הקרובים"
        />
      </div>

      <TodayTimesCard />

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Azkarot */}
        <Card>
          <CardHeader>
            <SectionHeader
              icon={Star}
              iconBg="color-mix(in srgb, var(--color-indigo) 8%, white)"
              iconColor="var(--color-indigo)"
              title="אזכרות קרובות"
              badge={azkarotData?.total}
            />
          </CardHeader>
          <CardContent className="p-0">
            {!azkarotData?.azkarot?.length ? (
              <EmptyState
                icon={CalendarDays}
                title="אין אזכרות קרובות"
                description="לא נמצאו אזכרות ב-30 הימים הקרובים"
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {azkarotData.azkarot.slice(0, 5).map((a) => (
                  <li key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {a.deceased_name}
                        <span className="font-normal text-slate-400 mx-1">·</span>
                        <span className="text-slate-500">{RELATION_LABELS[a.relation] ?? a.relation}</span>
                      </p>
                      {a.congregant_name && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          של {a.congregant_name} · {hebrewMonthNames[a.hebrew_month]} {a.hebrew_day}
                        </p>
                      )}
                    </div>
                    {a.next_gregorian && (
                      <Badge variant="info" className="shrink-0 mr-3">{a.next_gregorian}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Smachot */}
        <Card>
          <CardHeader>
            <SectionHeader
              icon={Heart}
              iconBg="#fff1f2"
              iconColor="#f43f5e"
              title="שמחות קרובות"
              badge={smachotData?.total}
            />
          </CardHeader>
          <CardContent className="p-0">
            {!smachotData?.smachot?.length ? (
              <EmptyState
                icon={CalendarDays}
                title="אין שמחות קרובות"
                description="לא נמצאו שמחות ב-30 הימים הקרובים"
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {smachotData.smachot.slice(0, 5).map((s) => (
                  <li key={s.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {OCCASION_LABELS[s.occasion_type] ?? s.occasion_type}
                        {s.description && (
                          <><span className="font-normal text-slate-400 mx-1">·</span>
                          <span className="text-slate-500 font-normal">{s.description}</span></>
                        )}
                      </p>
                      {s.congregant_name && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          של {s.congregant_name} · {hebrewMonthNames[s.hebrew_month]} {s.hebrew_day}
                        </p>
                      )}
                    </div>
                    {s.next_gregorian && (
                      <Badge variant="success" className="shrink-0 mr-3">{s.next_gregorian}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      {(pendingData?.total_pending ?? 0) > 0 && (
        <Card className="border-amber-200" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 60%)' }}>
          <CardHeader>
            <SectionHeader
              icon={AlertCircle}
              iconBg="#fef3c7"
              iconColor="#d97706"
              title="חברים ללא תשלום"
              badge={pendingData?.total_pending}
            />
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-amber-100/60">
              {pendingData?.congregants.slice(0, 5).map((c) => (
                <li key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-amber-50/60 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-amber-800">{c.name?.[0]}</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{c.name}</p>
                  <CreditCard className="h-3.5 w-3.5 text-amber-400 mr-auto" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
