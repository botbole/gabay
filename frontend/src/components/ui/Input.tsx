import { clsx } from 'clsx';
import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
          error && 'border-red-400 focus:ring-red-400',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, id, children, ...rest }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        id={inputId}
        className={clsx(
          'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
          error && 'border-red-400 focus:ring-red-400',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
