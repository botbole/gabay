import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Printer,
  RefreshCw,
  Newspaper,
  MessageCircle,
  Star,
  Heart,
} from 'lucide-react';
import { bulletinApi } from '../api/client';
import type { BulletinEvent, BulletinPayload } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const SECTION_LABELS: Record<string, string> = {
  times: 'זמני שבת',
  prayers: 'סדרי תפילה',
  azkarot: 'אזכרות',
  smachot: 'שמחות',
  announcements: 'הכרזות',
};

const ALL_SECTIONS = Object.keys(SECTION_LABELS);

type PreviewTab = 'whatsapp' | 'html' | 'print';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function printHtml(html: string) {
  const frame = window.open('', '_blank', 'noopener,noreferrer');
  if (!frame) return;
  frame.document.write(html);
  frame.document.close();
  frame.focus();
  frame.print();
}

function BulletinSettings({
  initialRabbi,
  initialAddress,
  initialAnnouncements,
}: {
  initialRabbi: string;
  initialAddress: string;
  initialAnnouncements: string;
}) {
  const qc = useQueryClient();
  const [rabbi, setRabbi] = useState(initialRabbi);
  const [address, setAddress] = useState(initialAddress);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);

  const saveConfig = useMutation({
    mutationFn: () => bulletinApi.updateConfig({ rabbi, address, announcements }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bulletin-config'] });
      void qc.invalidateQueries({ queryKey: ['bulletin'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטי בית הכנסת</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          label="רב בית הכנסת"
          value={rabbi}
          onChange={(e) => setRabbi(e.target.value)}
        />
        <Input
          label="כתובת"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="announcements">
            הכרזות קבועות
          </label>
          <textarea
            id="announcements"
            rows={4}
            value={announcements}
            onChange={(e) => setAnnouncements(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button
          className="w-full"
          loading={saveConfig.isPending}
          onClick={() => saveConfig.mutate()}
        >
          שמור הגדרות
        </Button>
      </CardContent>
    </Card>
  );
}

function EventRow({
  item,
  title,
  subtitle,
}: {
  item: BulletinEvent;
  title: string;
  subtitle?: string;
}) {
  return (
    <li className="px-5 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {item.next_gregorian && <Badge variant="info">{item.next_gregorian}</Badge>}
        <a
          href={item.whatsapp_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--color-indigo)' }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          וואטסאפ
        </a>
      </div>
    </li>
  );
}

export function Bulletin() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [sectionOverride, setSectionOverride] = useState<string[] | null>(null);
  const [tab, setTab] = useState<PreviewTab>('whatsapp');
  const [copied, setCopied] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['bulletin-config'],
    queryFn: () => bulletinApi.getConfig(),
  });

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['bulletin', selectedDate, sectionOverride?.join(',') ?? 'default'],
    queryFn: () => bulletinApi.get(selectedDate, sectionOverride ?? undefined),
    retry: 1,
  });

  const sections = sectionOverride ?? data?.sections ?? ALL_SECTIONS;

  const saveWeek = useMutation({
    mutationFn: () => bulletinApi.saveWeek(data?.week_start ?? selectedDate, sections),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bulletin'] });
    },
  });

  const toggleSection = (section: string) => {
    setSectionOverride(
      sections.includes(section)
        ? sections.filter((item) => item !== section)
        : [...sections, section],
    );
  };

  const changeDate = (value: string) => {
    setSelectedDate(value);
    setSectionOverride(null);
  };

  const previewText = (payload: BulletinPayload) => {
    if (tab === 'html') return payload.formats.html;
    if (tab === 'print') return payload.formats.print_html;
    return payload.formats.whatsapp;
  };

  const handleCopy = async (payload: BulletinPayload) => {
    const value = tab === 'whatsapp' ? payload.formats.whatsapp : payload.formats.html;
    await copyText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="לוח שבועי"
        subtitle="תצוגה מקדימה, העתקה והדפסה של הלוח השבועי"
        action={(
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              רענון
            </Button>
            {data && (
              <>
                <Button variant="secondary" size="sm" onClick={() => void handleCopy(data)}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'הועתק' : 'העתק'}
                </Button>
                <Button size="sm" onClick={() => printHtml(data.formats.print_html)}>
                  <Printer className="h-3.5 w-3.5" />
                  הדפסה
                </Button>
              </>
            )}
          </div>
        )}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>שבוע וקטעים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="תאריך בשבוע"
                type="date"
                value={selectedDate}
                onChange={(e) => changeDate(e.target.value)}
              />
              <div className="space-y-2">
                {ALL_SECTIONS.map((section) => (
                  <label key={section} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={sections.includes(section)}
                      onChange={() => toggleSection(section)}
                    />
                    {SECTION_LABELS[section]}
                  </label>
                ))}
              </div>
              <Button
                variant="secondary"
                className="w-full"
                loading={saveWeek.isPending}
                onClick={() => saveWeek.mutate()}
                disabled={!data}
              >
                שמור קטעים לשבוע זה
              </Button>
            </CardContent>
          </Card>

          {config && (
            <BulletinSettings
              initialRabbi={config.rabbi}
              initialAddress={config.address}
              initialAnnouncements={config.announcements}
            />
          )}
        </div>

        <div className="space-y-5">
          {isFetching && (
            <div className="flex justify-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}

          {isError && !isFetching && (
            <EmptyState
              icon={Newspaper}
              title="שגיאה בטעינת הלוח השבועי"
              description="ייתכן שיש בעיית חיבור לשירות הזמנים"
              action={(
                <Button variant="secondary" onClick={() => void refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  נסה שנית
                </Button>
              )}
            />
          )}

          {data && !isFetching && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle>{data.synagogue_name}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        {data.parasha ? `פרשת ${data.parasha}` : 'לוח שבועי'}
                        {data.special_shabbat ? ` · ${data.special_shabbat}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                      {([
                        ['whatsapp', 'וואטסאפ'],
                        ['html', 'מייל'],
                        ['print', 'הדפסה'],
                      ] as [PreviewTab, string][]).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTab(id)}
                          className="rounded-md px-3 py-1.5 text-xs font-medium"
                          style={tab === id
                            ? { backgroundColor: 'var(--color-indigo)', color: 'white' }
                            : { color: 'var(--color-indigo)' }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {tab === 'whatsapp' ? (
                    <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700 font-sans">
                      {previewText(data)}
                    </pre>
                  ) : (
                    <iframe
                      title="תצוגת לוח שבועי"
                      className="w-full min-h-[420px] rounded-xl border border-slate-200 bg-white"
                      srcDoc={previewText(data)}
                    />
                  )}
                </CardContent>
              </Card>

              {sections.includes('azkarot') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4" style={{ color: 'var(--color-gold)' }} />
                      אזכרות השבוע
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.azkarot.length === 0 ? (
                      <EmptyState icon={Star} title="אין אזכרות השבוע" className="py-8" />
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {data.azkarot.map((item) => (
                          <EventRow
                            key={item.id}
                            item={item}
                            title={item.deceased_name ?? ''}
                            subtitle={item.congregant_name ? `של ${item.congregant_name}` : undefined}
                          />
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              {sections.includes('smachot') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-500" />
                      שמחות השבוע
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.smachot.length === 0 ? (
                      <EmptyState icon={Heart} title="אין שמחות השבוע" className="py-8" />
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {data.smachot.map((item) => (
                          <EventRow
                            key={item.id}
                            item={item}
                            title={item.occasion_label ?? ''}
                            subtitle={item.congregant_name ? `של ${item.congregant_name}` : undefined}
                          />
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
