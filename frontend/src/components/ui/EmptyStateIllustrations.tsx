import type { SVGProps } from 'react'
import { cn } from '@/utils/cn'

/**
 * Empty State Illustrations
 *
 * Lightweight, brand-themed inline SVGs for empty states.
 * Uses the LearnLab palette: Teal (primary), Violet (secondary), Amber (accent).
 * Each illustration is self-contained — no external assets required.
 */

interface IllustrationProps extends SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * "All Caught Up" — a calm checkmark orbit.
 * Used when a learner has no due reviews.
 */
export function AllCaughtUpIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-24 w-24', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Outer orbit ring */}
      <circle cx="60" cy="60" r="48" stroke="url(#acuGrad)" strokeWidth="2" strokeDasharray="6 4" opacity="0.35" />
      {/* Inner glow */}
      <circle cx="60" cy="60" r="32" fill="url(#acuFill)" opacity="0.12" />
      {/* Checkmark circle */}
      <circle cx="60" cy="60" r="22" fill="url(#acuFill)" opacity="0.25" />
      {/* Checkmark */}
      <path
        d="M49 60.5l7.5 7.5L72 53"
        stroke="url(#acuGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Orbiting dots */}
      <circle cx="60" cy="10" r="3.5" fill="#14b8a6" opacity="0.6">
        <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="12s" repeatCount="indefinite" />
      </circle>
      <circle cx="108" cy="60" r="2.5" fill="#8b5cf6" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="120 60 60" to="480 60 60" dur="12s" repeatCount="indefinite" />
      </circle>
      <circle cx="30" cy="100" r="2" fill="#f59e0b" opacity="0.45">
        <animateTransform attributeName="transform" type="rotate" from="240 60 60" to="600 60 60" dur="12s" repeatCount="indefinite" />
      </circle>
      <defs>
        <linearGradient id="acuGrad" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <radialGradient id="acuFill" cx="60" cy="60" r="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.3" />
        </radialGradient>
      </defs>
    </svg>
  )
}

/**
 * "Empty Search" — a magnifying glass with floating particles.
 * Used when a search returns zero results.
 */
export function EmptySearchIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-24 w-24', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Ambient particles */}
      <circle cx="25" cy="28" r="2" fill="#14b8a6" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="95" cy="22" r="1.5" fill="#8b5cf6" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="80" r="2.5" fill="#f59e0b" opacity="0.25">
        <animate attributeName="opacity" values="0.25;0.55;0.25" dur="3.5s" repeatCount="indefinite" />
      </circle>
      {/* Glass body */}
      <circle cx="52" cy="52" r="28" stroke="url(#esGrad)" strokeWidth="3" opacity="0.35" />
      <circle cx="52" cy="52" r="20" fill="url(#esFill)" opacity="0.1" />
      {/* Handle */}
      <line x1="73" y1="73" x2="96" y2="96" stroke="url(#esGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      {/* Question mark in center */}
      <text x="52" y="58" textAnchor="middle" fontSize="20" fontWeight="600" fill="url(#esGrad)" opacity="0.4">?</text>
      <defs>
        <linearGradient id="esGrad" x1="24" y1="24" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <radialGradient id="esFill" cx="52" cy="52" r="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#14b8a6" stopOpacity="0.2" />
        </radialGradient>
      </defs>
    </svg>
  )
}

/**
 * "Empty Data" — a beaker with sparkle particles.
 * Used when there is no data yet (no mastery, no learners, etc.).
 */
export function EmptyDataIllustration({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-24 w-24', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Sparkle particles */}
      <circle cx="30" cy="20" r="2" fill="#f59e0b" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="88" cy="16" r="1.5" fill="#14b8a6" opacity="0.35">
        <animate attributeName="opacity" values="0.35;0.7;0.35" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="95" cy="50" r="2" fill="#8b5cf6" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.65;0.3" dur="3.5s" repeatCount="indefinite" />
      </circle>
      {/* Beaker body */}
      <path
        d="M45 30V65c0 2-1 4-3 5.5L32 78c-3 2.5-1.5 7.5 2.5 7.5h51c4 0 5.5-5 2.5-7.5L78 70.5c-2-1.5-3-3.5-3-5.5V30"
        stroke="url(#edGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      {/* Beaker top rim */}
      <line x1="40" y1="30" x2="80" y2="30" stroke="url(#edGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      {/* Liquid fill */}
      <path
        d="M45 62V65c0 2-1 4-3 5.5L32 78c-3 2.5-1.5 7.5 2.5 7.5h51c4 0 5.5-5 2.5-7.5L78 70.5c-2-1.5-3-3.5-3-5.5V62H45z"
        fill="url(#edFill)"
        opacity="0.15"
      />
      {/* Bubbles */}
      <circle cx="52" cy="72" r="2.5" fill="#14b8a6" opacity="0.3">
        <animate attributeName="cy" values="72;66;72" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="68" r="1.5" fill="#8b5cf6" opacity="0.25">
        <animate attributeName="cy" values="68;62;68" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="58" cy="76" r="2" fill="#f59e0b" opacity="0.2">
        <animate attributeName="cy" values="76;70;76" dur="3s" repeatCount="indefinite" />
      </circle>
      <defs>
        <linearGradient id="edGrad" x1="32" y1="28" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="edFill" x1="32" y1="62" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  )
}
