import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Armchair,
  BookOpen,
  Star,
  Heart,
  Calendar,
  Upload,
  MessageCircle,
  Puzzle,
  type LucideIcon,
} from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';

/** Map module icon names (from backend) to Lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  CreditCard,
  Armchair,
  BookOpen,
  Star,
  Heart,
  Calendar,
  Upload,
  MessageCircle,
  Puzzle,
  LayoutDashboard,
};

/** All possible module nav items in the preferred display order */
const MODULE_NAV_ORDER = [
  'congregants',
  'payments',
  'seating',
  'aliyot',
  'azkarot',
  'smachot',
  'calendar',
];

export function Sidebar() {
  const { config } = useAppConfig();

  const enabledIds = config?.enabled_modules_list ?? [
    'congregants', 'payments', 'aliyot', 'seating',
    'azkarot', 'smachot', 'calendar', 'llm',
  ];

  // Build manifest map from config (or fall back to defaults)
  const manifestMap = Object.fromEntries(
    (config?.modules_manifest ?? []).map(m => [m.module_id, m])
  );

  const defaultItems: Record<string, { label: string; icon: LucideIcon; path: string }> = {
    congregants: { label: 'מתפללים',       icon: Users,           path: '/congregants' },
    payments:    { label: 'תשלומים',        icon: CreditCard,      path: '/payments' },
    seating:     { label: 'מפת מושבים',     icon: Armchair,        path: '/seating' },
    aliyot:      { label: 'עליות לתורה',   icon: BookOpen,        path: '/aliyot' },
    azkarot:     { label: 'אזכרות',         icon: Star,            path: '/azkarot' },
    smachot:     { label: 'שמחות',          icon: Heart,           path: '/smachot' },
    calendar:    { label: 'לוח עברי',       icon: Calendar,        path: '/calendar' },
    llm:         { label: 'עוזר גבאי AI',   icon: MessageCircle,   path: '/chat' },
  };

  // Build dynamic nav from enabled modules in the preferred order
  const moduleNav = MODULE_NAV_ORDER
    .filter(id => enabledIds.includes(id))
    .map(id => {
      const manifest = manifestMap[id];
      const def = defaultItems[id];
      const Icon = (manifest?.icon ? ICON_MAP[manifest.icon] : null) ?? def?.icon ?? Puzzle;
      return {
        to: manifest?.nav_path ?? def?.path ?? `/${id}`,
        label: manifest?.display_name ?? def?.label ?? id,
        icon: Icon,
        moduleId: id,
      };
    });

  // Chat (LLM) goes first if enabled, then dashboard, then modules
  const chatEnabled = enabledIds.includes('llm');
  const chatEntry = chatEnabled ? [{
    to: '/chat',
    label: manifestMap['llm']?.display_name ?? 'עוזר גבאי AI',
    icon: MessageCircle,
    end: false,
  }] : [];

  const nav = [
    ...chatEntry,
    { to: '/', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
    ...moduleNav.filter(m => m.moduleId !== 'llm'),
  ];

  // Extra static items not in modules
  const importEntry = { to: '/import', label: 'ייבוא מתפללים', icon: Upload, end: false };
  const allNav = [...nav, importEntry];

  const synagogueName = config?.synagogue_name ?? 'גבאי';

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-screen sticky top-0 shadow-xl"
      style={{ backgroundColor: 'var(--color-indigo)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden shadow-md"
            style={{ backgroundColor: 'var(--color-gold)' }}
          >
            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt="לוגו"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <img
                src="/logo.png"
                alt="לוגו"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span>ג</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">{synagogueName}</p>
            <p className="text-xs text-white/50 leading-tight">ניהול בית כנסת</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {allNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-white font-semibold shadow-sm'
                  : 'text-white/65 hover:text-white hover:bg-white/10',
              )
            }
            style={({ isActive }) =>
              isActive ? { backgroundColor: 'var(--color-gold)' } : undefined
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs text-white/30 text-center">© 2026 מערכת גבאי</p>
      </div>
    </aside>
  );
}
