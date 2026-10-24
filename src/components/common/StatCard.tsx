import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning';
  };
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon,
  onClick,
  className = '',
}) => {
  const trendColor = {
    positive: 'text-emerald-700',
    negative: 'text-rose-700',
    warning: 'text-amber-700',
    neutral: 'text-slate-500',
  }[trend?.type || 'neutral'];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/90 rounded-lg p-4 transition-colors ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:bg-slate-50/50' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-500 tracking-tight">{label}</span>
        {icon && <div className="text-slate-400 shrink-0">{icon}</div>}
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
        {value}
      </div>
      {(subValue || trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {trend && <span className={`font-medium ${trendColor}`}>{trend.text}</span>}
          {trend && subValue && <span className="text-slate-300">·</span>}
          {subValue && <span className="text-slate-500 truncate">{subValue}</span>}
        </div>
      )}
    </div>
  );
};
