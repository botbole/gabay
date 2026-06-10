import { clsx } from 'clsx';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variantClasses: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  );
}
