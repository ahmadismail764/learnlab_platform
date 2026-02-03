import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Loading Components
 * 
 * Various loading indicators for different use cases.
 */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Spinner - simple rotating spinner
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <Loader2
      className={cn('animate-spin text-primary-500', sizeClasses[size], className)}
      aria-label="Loading"
    />
  )
}

interface LoadingOverlayProps {
  /** Show the overlay */
  isLoading: boolean
  /** Text to display */
  text?: string
  /** Whether to blur the background */
  blur?: boolean
}

/**
 * LoadingOverlay - covers parent with loading state
 */
export function LoadingOverlay({
  isLoading,
  text = 'Loading...',
  blur = true,
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center',
        'bg-white/80',
        blur && 'backdrop-blur-sm'
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        {text && <p className="text-sm text-neutral-600">{text}</p>}
      </div>
    </div>
  )
}

interface PageLoaderProps {
  text?: string
}

/**
 * PageLoader - full page loading state
 */
export function PageLoader({ text = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-neutral-600 font-medium">{text}</p>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  /** Predefined shape */
  variant?: 'text' | 'circular' | 'rectangular'
  /** Width (for text/rectangular) */
  width?: string | number
  /** Height */
  height?: string | number
}

/**
 * Skeleton - placeholder loading animation
 */
export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-neutral-200'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      aria-hidden="true"
    />
  )
}

/**
 * CardSkeleton - skeleton for card components
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={100} />
      <div className="flex gap-2">
        <Skeleton width={80} height={32} variant="rectangular" />
        <Skeleton width={80} height={32} variant="rectangular" />
      </div>
    </div>
  )
}

/**
 * ListSkeleton - skeleton for list items
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
          <Skeleton variant="circular" width={36} height={36} />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" />
            <Skeleton width="50%" />
          </div>
        </div>
      ))}
    </div>
  )
}
