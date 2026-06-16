import { z } from 'zod/v4'

/**
 * Admin Form Validation Schemas
 *
 * Centralizes validation rules for curriculum topics and question management.
 */

// ── Topics Validation ──────────────────────────────────────────────

/**
 * Factory for topic validation schema.
 * Allows checking for duplicates against active topic name list in memory.
 */
export const createTopicSchema = (
  topics: { id: number; name: string }[],
  editingTopicId?: number | null
) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Topic name is required')
      .refine(
        (name) => {
          const duplicate = topics.find(
            (t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== editingTopicId
          )
          return !duplicate
        },
        {
          message: 'A topic with this name already exists',
        }
      ),
    description: z.string().trim().optional(),
  })

export type TopicFormData = {
  name: string
  description: string
}

// ── Questions Validation ────────────────────────────────────────────

export const questionSchema = z
  .object({
    text: z.string().trim().min(1, 'Add the question text'),
    choices: z
      .array(z.string().trim().min(1, 'Choice text cannot be empty'))
      .min(2, 'Add at least two answer choices'),
    correctAnswerIndex: z
      .string()
      .trim()
      .min(1, 'Select the correct answer')
      .transform(Number)
      .refine(Number.isInteger, 'Correct index must be a whole number')
      .refine((value) => value >= 0, 'Correct index must be 0 or higher'),
    tier: z.coerce.number().int().min(1).max(3),
    relationId: z.string().trim().min(1, 'Select a topic'),
    explanationVideoUrl: z
      .string()
      .trim()
      .min(1, 'Select the correct answer')
      .transform(Number)
      .refine(Number.isInteger, 'Correct index must be a whole number')
      .refine((value) => value >= 0, 'Correct index must be 0 or higher'),
    tier: z.coerce.number().int().min(1).max(3),
    relationId: z.string().trim().min(1, 'Select a topic'),
  })
  .refine(
    (data) => {
      return data.correctAnswerIndex >= 0 && data.correctAnswerIndex < data.choices.length
    },
    {
      message: 'Correct answer index must point to one of the listed choices',
      path: ['correctAnswerIndex'],
    }
  )

export type QuestionFormState = z.infer<typeof questionSchema>
