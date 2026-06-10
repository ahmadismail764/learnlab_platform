import { forwardRef, type SVGProps } from 'react'
import { cn } from '@/utils/cn'
import { useLanguage } from '@/hooks/useLanguage'

export type XpBadgeSize = 'sm' | 'md' | 'lg' | 'xl'
export type XpBadgeVariant = 'primary' | 'amber'
export type XpBadgeType = 'icon' | 'badge'

export interface XpBadgeProps extends Omit<SVGProps<SVGSVGElement>, 'size' | 'type'> {
  /** Sizing variant */
  size?: XpBadgeSize
  /** Styling theme variant (primary coordinates or amber emphasis) */
  variant?: XpBadgeVariant
  /** Renders as lightweight line 'icon' or filled duotone 'badge' */
  type?: XpBadgeType
  /** Enables hover transitions and shimmer sweep overlays */
  animated?: boolean
}

const sizeClasses: Record<XpBadgeSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
}

export const XpBadge = forwardRef<SVGSVGElement, XpBadgeProps>(
  (
    {
      className,
      size = 'md',
      variant = 'primary',
      type = 'icon',
      animated = true,
      ...props
    },
    ref
  ) => {
    const { language } = useLanguage()
    const isArabic = language === 'ar'
    const isBadge = type === 'badge'

    const shieldPath = 'M12 0.5L1.5 3.5v8.5c0 7 5 10.5 10.5 11.5c5.5-1 10.5-4.5 10.5-11.5V3.5L12 0.5z'
    const arabicCoinPath = 'M12 1.6l2.45 1.24 2.74-.08 1.43 2.34 2.42 1.3-.08 2.74L22.2 12l-1.24 2.86.08 2.74-2.42 1.3-1.43 2.34-2.74-.08L12 22.4l-2.45-1.24-2.74.08-1.43-2.34-2.42-1.3.08-2.74L1.8 12l1.24-2.86-.08-2.74 2.42-1.3 1.43-2.34 2.74.08L12 1.6z'

    const badgePath = isArabic ? arabicCoinPath : shieldPath

    // Centered Latin letterforms for the English badge.
    const pathX1 = 'M5 6.5L11 17.5'
    const pathX2 = 'M11 6.5L5 17.5'
    const pathPStem = 'M13.5 6.5v11'
    const pathPLoop = 'M13.5 6.5h3.5c1.5 0 2.5 1 2.5 2.75s-1 2.75-2.5 2.75H13.5'

    const arabicLetter = 'خ'

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          'shrink-0 select-none transition-all duration-300 ease-out',
          sizeClasses[size],
          animated && 'hover:scale-110 active:scale-95',
          isBadge
            ? 'filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]'
            : variant === 'primary'
            ? 'text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300'
            : 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300',
          className
        )}
        {...props}
      >
        <defs>
          {/* Dynamic primary brand gradients linked to HSL tokens */}
          <linearGradient id="xp-primary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary-400, #2dd4bf)" />
            <stop offset="50%" stopColor="var(--color-primary-500, #14b8a6)" />
            <stop offset="100%" stopColor="var(--color-primary-600, #0d9488)" />
          </linearGradient>

          {/* Achievement golden amber gradients */}
          <linearGradient id="xp-amber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Sweep shimmer reflection gradient */}
          <linearGradient id="xp-shimmer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Clipping mask using the badge path to bound the shimmer shine */}
          <mask id="xp-shield-mask">
            <path d={badgePath} fill="white" />
          </mask>
        </defs>

        {isBadge ? (
          <>
            {/* Filled background badge with vibrant gradient */}
            <path
              d={badgePath}
              fill={variant === 'primary' ? 'url(#xp-primary-gradient)' : 'url(#xp-amber-gradient)'}
              stroke={variant === 'primary' ? 'var(--color-primary-300, #5eead4)' : '#fde68a'}
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />

            {/* Sweep shimmer overlay */}
            {animated && (
              <rect
                x="-24"
                y="0"
                width="24"
                height="24"
                fill="url(#xp-shimmer-gradient)"
                mask="url(#xp-shield-mask)"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="-24 0"
                  to="48 0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </rect>
            )}

            <g className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.25)]">
              {isArabic ? (
                <text
                  x="12"
                  y="12.7"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="'Noto Naskh Arabic', 'Amiri', 'Segoe UI', Tahoma, sans-serif"
                  fontSize="15.25"
                  fontWeight="800"
                  fill="white"
                  stroke="none"
                >
                  {arabicLetter}
                </text>
              ) : (
                <>
                  <path d={pathX1} stroke="white" strokeWidth="2.5" />
                  <path d={pathX2} stroke="white" strokeWidth="2.5" />
                  <path d={pathPStem} stroke="white" strokeWidth="2.5" />
                  <path d={pathPLoop} stroke="white" strokeWidth="2.5" />
                </>
              )}
            </g>
          </>
        ) : (
          <>
            {/* Outline badge shape */}
            <path d={badgePath} />

            {/* Outlined letterforms */}
            {isArabic ? (
              <text
                x="12"
                y="12.7"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="'Noto Naskh Arabic', 'Amiri', 'Segoe UI', Tahoma, sans-serif"
                fontSize="15.25"
                fontWeight="800"
                fill="currentColor"
                stroke="none"
              >
                {arabicLetter}
              </text>
            ) : (
              <>
                <path d={pathX1} />
                <path d={pathX2} />
                <path d={pathPStem} />
                <path d={pathPLoop} />
              </>
            )}
          </>
        )}
      </svg>
    )
  }
)

XpBadge.displayName = 'XpBadge'
