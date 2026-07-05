import type { ReactNode, ElementType } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-indigo) 8%, transparent)' }}
      >
        <Icon className="w-7 h-7" style={{ color: 'var(--color-indigo)', opacity: 0.5 }} />
      </div>
      <p className="text-base font-semibold text-slate-700 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-slate-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
