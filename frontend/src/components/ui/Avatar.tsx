import { forwardRef, type ImgHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/**
 * Avatar Component
 * 
 * User profile images with fallback to initials.
 */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  /** Size variant */
  size?: AvatarSize
  /** User's name for generating initials fallback */
  name?: string
  /** Show online status indicator */
  showStatus?: boolean
  /** Online status */
  status?: 'online' | 'offline' | 'away' | 'busy'
  /** User's unique dynamic avatar color (HSL format) */
  avatarColor?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-neutral-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Generate a consistent color based on name
function getColorFromName(name: string): string {
  const colors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-accent-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size = 'md',
      name = '',
      src,
      alt,
      avatarColor,
      showStatus = false,
      status = 'offline',
      ...props
    },
    ref
  ) => {
    const initials = name ? getInitials(name) : '?'
    const bgColor = name ? getColorFromName(name) : 'bg-neutral-400'

    return (
      <div ref={ref} className={cn('relative inline-block', className)}>
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className={cn(
              'rounded-full object-cover',
              sizeStyles[size]
            )}
            {...props}
          />
        ) : (
          <div
            className={cn(
              'rounded-full flex items-center justify-center font-medium text-white',
              sizeStyles[size],
              !avatarColor && bgColor
            )}
            style={avatarColor ? { backgroundColor: avatarColor } : undefined}
          >
            {initials}
          </div>
        )}
        
        {showStatus && (
          <span
            className={cn(
              'absolute bottom-0 end-0 block rounded-full ring-2 ring-white',
              statusColors[status],
              size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
            )}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'
