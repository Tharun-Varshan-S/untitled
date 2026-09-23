import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LogLensLogo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 border border-blue-400/30 ${sizeClasses[size]} ${className}`}>
      {/* Outer Aperture Glow */}
      <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-sm pointer-events-none"></div>

      {/* Futuristic LogLens Aperture SVG */}
      <svg
        className={`relative z-10 text-white ${iconSizes[size]}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer Lens Ring */}
        <circle cx="12" cy="12" r="9" className="stroke-white/90" />
        {/* Inner AI Scanner Core */}
        <circle cx="12" cy="12" r="3" className="fill-white stroke-white" />
        {/* Log Stream Pulse Rays */}
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" className="stroke-sky-200" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

export default LogLensLogo;
