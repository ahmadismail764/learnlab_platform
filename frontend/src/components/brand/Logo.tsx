/**
 * LearnLab Brand Components
 *
 * Centralised brand assets for consistent visual identity.
 * The logo uses connected graph nodes forming an "L" shape —
 * a reference to discrete-mathematics graph theory, the core
 * subject of the platform.
 *
 * Brand palette:
 *   Primary  — Teal   (#0d9488 / #14b8a6)  scientific, fresh
 *   Secondary — Violet (#7c3aed / #a78bfa)  depth, discovery
 *   Accent   — Amber  (#f59e0b)             energy, achievement
 */

import { cn } from '@/utils/cn'

/* ------------------------------------------------------------------ */
/*  LogoMark — icon only (square)                                      */
/* ------------------------------------------------------------------ */

interface LogoMarkProps {
  /** px size of the square (default 32) */
  size?: number
  /** Remove the background rect – useful when the logo sits on a branded surface */
  transparent?: boolean
  className?: string
}

export function LogoMark({ size = 32, transparent = false, className }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ll-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="ll-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {!transparent && <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#ll-bg)" />}

      {/* Edges */}
      <line x1="20" y1="16" x2="20" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="32" x2="20" y2="46" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="46" x2="34" y2="46" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <line x1="34" y1="46" x2="46" y2="46" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

      {/* Discovery paths */}
      <line x1="20" y1="32" x2="34" y2="24" stroke="url(#ll-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="34" y1="24" x2="46" y2="16" stroke="url(#ll-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

      {/* Nodes */}
      <circle cx="20" cy="16" r="5" fill="white" />
      <circle cx="20" cy="32" r="5" fill="white" />
      <circle cx="20" cy="46" r="5" fill="white" />
      <circle cx="34" cy="46" r="5" fill="white" />
      <circle cx="46" cy="46" r="4" fill="#f59e0b" />

      <circle cx="34" cy="24" r="3.5" fill="#a78bfa" />
      <circle cx="46" cy="16" r="3" fill="#a78bfa" opacity="0.7" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  LogoFull — icon + "LearnLab" wordmark                              */
/* ------------------------------------------------------------------ */

interface LogoFullProps {
  /** px size of the icon portion (default 32) */
  iconSize?: number
  /** Show the wordmark text (default true) */
  showText?: boolean
  className?: string
}

export function LogoFull({ iconSize = 32, showText = true, className }: LogoFullProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={iconSize} />
      {showText && (
        <span className="font-display font-bold text-lg tracking-tight text-neutral-800 dark:text-neutral-100 select-none">
          Learn<span className="text-primary-600 dark:text-primary-400">Lab</span>
        </span>
      )}
    </div>
  )
}
