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
} from 'lucide-react';

const nav = [
  { to: '/chat',        label: 'עוזר גבאי AI',      icon: MessageCircle },
  { to: '/',            label: 'לוח בקרה',           icon: LayoutDashboard, end: true },
  { to: '/congregants', label: 'מתפללים',            icon: Users },
  { to: '/payments',    label: 'תשלומים',            icon: CreditCard },
  { to: '/seating',     label: 'מפת מושבים',         icon: Armchair },
  { to: '/aliyot',      label: 'עליות לתורה',        icon: BookOpen },
  { to: '/azkarot',     label: 'אזכרות',             icon: Star },
  { to: '/smachot',     label: 'שמחות',              icon: Heart },
  { to: '/calendar',    label: 'לוח עברי',           icon: Calendar },
  { to: '/import',      label: 'ייבוא מתפללים',      icon: Upload },
];

export function Sidebar() {
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
            <img
              src="/logo.png"
              alt="לוגו"
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span>ג</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">גבאי</p>
            <p className="text-xs text-white/50 leading-tight">ניהול בית כנסת</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end }) => (
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
