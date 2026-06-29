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

/**
 * Question authoring schema. A question is either MCQ (choices + a correct
 * index) or WRITTEN (a canonical free-response answer graded symbolically).
 * The answer-key fields are validated conditionally on `questionType`.
 */
export const questionSchema = z
  .object({
    questionType: z.enum(['MCQ', 'WRITTEN']),
    text: z.string().trim().min(1, 'Add the question text'),
    choices: z.array(z.string().trim().min(1, 'Choice text cannot be empty')),
    correctAnswerIndex: z.string().trim(),
    correctAnswer: z.string().trim(),
    tier: z.coerce.number().int().min(1).max(3),
    relationId: z.string().trim().min(1, 'Select a topic'),
  })
  .superRefine((data, ctx) => {
    if (data.questionType === 'WRITTEN') {
      if (!data.correctAnswer) {
        ctx.addIssue({
          code: 'custom',
          path: ['correctAnswer'],
          message: 'Add the correct answer (e.g. 2*x or x = 2)',
        })
      }
      return
    }

    // MCQ
    if (data.choices.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['choices'], message: 'Add at least two answer choices' })
    }
    const index = Number(data.correctAnswerIndex)
    if (
      !data.correctAnswerIndex ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= data.choices.length
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['correctAnswerIndex'],
        message: 'Correct answer index must point to one of the listed choices',
      })
    }
  })

export type QuestionFormState = z.infer<typeof questionSchema>
