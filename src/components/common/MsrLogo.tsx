import React from 'react';

interface MsrLogoProps {
  variant?: 'icon' | 'compact' | 'full' | 'hero';
  theme?: 'dark' | 'light';
  className?: string;
}

export const MsrLogo: React.FC<MsrLogoProps> = ({
  variant = 'compact',
  theme = 'light',
  className = '',
}) => {
  const isDark = theme === 'dark';

  // SVG Geometric Monogram Icon for MSR Solutions
  // Features interlocking architectural geometric polygons representing M, S, R and enterprise stability
  const renderIcon = (size: number = 32) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
    >
      <defs>
        <linearGradient id="msr-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient id="msr-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="msr-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Hexagonal container / shield node */}
      <rect x="4" y="4" width="56" height="56" rx="14" fill={isDark ? '#0F172A' : '#0B132B'} />
      <rect x="4" y="4" width="56" height="56" rx="14" stroke="url(#msr-grad-1)" strokeWidth="1.5" strokeOpacity="0.8" />

      {/* Stylized MSR Node Links */}
      {/* Pillar Left (M) */}
      <path
        d="M16 46V22L25 33L32 24V46"
        stroke="url(#msr-grad-accent)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* S curve & R diagonal flow */}
      <path
        d="M33 22H45C47.2 22 49 23.8 49 26C49 28.2 47.2 30 45 30H37C34.8 30 33 31.8 33 34C33 36.2 34.8 38 37 38H49"
        stroke="#E2E8F0"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M41 38L49 46"
        stroke="url(#msr-grad-2)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Core Technology Dot */}
      <circle cx="49" cy="22" r="2.5" fill="#38BDF8" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{renderIcon(28)}</div>;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {renderIcon(26)}
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1">
            <span
              className={`font-black tracking-wider text-xs font-mono uppercase ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              MSR SOLUTIONS
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-tight text-sky-500 font-semibold mt-0.5">
            Software Developer
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        {renderIcon(36)}
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-wide text-sm font-sans uppercase ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}
            >
              MSR SOLUTIONS
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-sky-500/10 text-sky-600 border border-sky-500/20">
              SOFTWARE
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1">
            Software Development & Engineering
          </span>
        </div>
      </div>
    );
  }

  // Hero variant (used in Login screen)
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="p-3 rounded-2xl bg-slate-900 shadow-xl border border-slate-800 ring-1 ring-sky-500/20">
        {renderIcon(52)}
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-center gap-2">
          <span
            className={`font-black text-lg tracking-wider uppercase font-sans ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}
          >
            MSR SOLUTIONS
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Software Developer
        </p>
      </div>
    </div>
  );
};
