import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'purple';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'text-emerald-700 bg-emerald-50 border-emerald-200/90',
    warning: 'text-amber-800 bg-amber-50 border-amber-200/90',
    danger: 'text-rose-700 bg-rose-50 border-rose-200/90',
    neutral: 'text-slate-700 bg-slate-100 border-slate-200',
    info: 'text-sky-700 bg-sky-50 border-sky-200/90',
    purple: 'text-indigo-700 bg-indigo-50 border-indigo-200/90',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded whitespace-nowrap tabular-nums ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {label}
    </span>
  );
};
