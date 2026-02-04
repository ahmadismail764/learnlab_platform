/**
 * UI Components Index
 * 
 * This barrel file exports all base UI components.
 * Components here should be atomic, reusable, and styling-focused.
 */

// Button
export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

// Input
export { Input } from './Input'
export type { InputProps } from './Input'

// Card
export { Card, CardHeader, CardContent, CardFooter } from './Card'
export type { CardProps, CardHeaderProps } from './Card'

// Badge
export { Badge } from './Badge'
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge'

// Avatar
export { Avatar } from './Avatar'
export type { AvatarProps, AvatarSize } from './Avatar'

// Progress
export { ProgressBar, ProgressRing } from './Progress'
export type { ProgressBarProps, ProgressRingProps } from './Progress'

// Loading
export { Spinner, LoadingOverlay, PageLoader, Skeleton, CardSkeleton, ListSkeleton } from './Loading'
export type {} from './Loading'

// EmptyState
export { EmptyState } from './EmptyState'
export type {} from './EmptyState'
