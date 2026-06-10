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
  { to: '/chat', label: 'עוזר גבאי AI', icon: MessageCircle },
  { to: '/', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
  { to: '/congregants', label: 'מתפללים', icon: Users },
  { to: '/payments', label: 'תשלומים', icon: CreditCard },
  { to: '/seating', label: 'מפת מושבים', icon: Armchair },
  { to: '/aliyot', label: 'עליות לתורה', icon: BookOpen },
  { to: '/azkarot', label: 'אזכרות', icon: Star },
  { to: '/smachot', label: 'שמחות', icon: Heart },
  { to: '/calendar', label: 'לוח עברי', icon: Calendar },
  { to: '/import', label: 'ייבוא מתפללים', icon: Upload },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-white border-l border-blue-100 flex flex-col h-screen sticky top-0 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-blue-100">
        <div className="flex items-center gap-3">
          {/* Logo placeholder – replace src with your actual logo */}
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden">
            <img
              src="/logo.png"
              alt="לוגו"
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="absolute">ג</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">גבאי</p>
            <p className="text-xs text-blue-400">מערכת ניהול בית כנסת</p>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-blue-100">
        <p className="text-xs text-gray-400 text-center">© 2026 מערכת גבאי</p>
      </div>
    </aside>
  );
}
