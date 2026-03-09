import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes with proper conflict resolution.
 * 
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
 * 
 * @example
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500') // => 'px-4 py-2 bg-blue-500'
 * 
 * // Conditional classes
 * cn('px-4', isActive && 'bg-blue-500') // => 'px-4 bg-blue-500' or 'px-4'
 * 
 * // Conflict resolution (last wins)
 * cn('px-4', 'px-8') // => 'px-8'
 * 
 * // Object syntax
 * cn({ 'bg-blue-500': isActive, 'bg-gray-500': !isActive })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
