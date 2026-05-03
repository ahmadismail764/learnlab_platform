import { z } from 'zod/v4'

/**
 * Auth Form Validation Schemas
 *
 * Zod schemas that centralise validation rules for login, registration,
 * and profile editing. Keeps client rules consistent with backend expectations.
 *
 * Each schema exports:
 * - The schema itself (for parsing / validating)
 * - An inferred TypeScript type (for type-safe form state)
 */

// ── Login ─────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(true),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ── Registration ──────────────────────────────────────────────────

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(150, 'First name is too long'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(150, 'Last name is too long'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(150, 'Username is too long')
      .regex(
        /^[\w.@+-]+$/,
        'Username can only contain letters, digits, and @/./+/-/_'
      ),
    email: z
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
    agreedToTerms: z
      .literal(true, 'You must agree to the terms'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

// ── Profile Edit ──────────────────────────────────────────────────

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(150, 'Username is too long')
    .regex(
      /^[\w.@+-]+$/,
      'Username can only contain letters, digits, and @/./+/-/_'
    ),
  email: z
    .email('Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(150, 'First name is too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(150, 'Last name is too long'),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Extract field errors from a Zod result into a flat Record<string, string>.
 * Useful for mapping to the existing `fieldErrors` pattern in form state.
 */
export function extractFieldErrors(
  error: z.ZodError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = issue.message
    }
  }
  return fieldErrors
}

/**
 * Validate form data against a schema.
 * Returns { success: true, data } or { success: false, fieldErrors }.
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; fieldErrors: Record<string, string> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, fieldErrors: extractFieldErrors(result.error) }
}
