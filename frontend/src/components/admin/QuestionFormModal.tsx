import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Save } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, CardHeader, Button, Input } from '@/components/ui'
import { questionsService, type BackendQuestion, type QuestionMutationPayload } from '@/services/questions'
import { queryKeys } from '@/hooks'
import { questionSchema } from '@/validation'

interface QuestionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  editingQuestion?: BackendQuestion | null
}

interface QuestionFormState {
  text: string
  choicesText: string
  correctAnswerIndex: string
  tier: '1' | '2' | '3'
  relationId: string
  explanationVideoUrl: string
}

const EMPTY_FORM: QuestionFormState = {
  text: '',
  choicesText: '',
  correctAnswerIndex: '0',
  tier: '1',
  relationId: '',
  explanationVideoUrl: '',
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function QuestionFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingQuestion,
}: QuestionFormModalProps) {
  const { t } = useTranslation(['admin', 'common'])
  const queryClient = useQueryClient()

  const [form, setForm] = useState<QuestionFormState>({ ...EMPTY_FORM })
  const [error, setError] = useState('')

  // Map choicesText string to a cleaned array of choices
  const choicesArray = useMemo(() => {
    return form.choicesText
      .split('\n')
      .map((choice) => choice.trim())
      .filter(Boolean)
  }, [form.choicesText])

  // Sync state when modal is opened or when changing active editing target
  useEffect(() => {
    if (isOpen) {
      if (editingQuestion) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
          text: editingQuestion.text,
          choicesText: editingQuestion.choices.join('\n'),
          correctAnswerIndex: String(editingQuestion.correct_answer_index),
          tier: String(editingQuestion.tier || 1) as QuestionFormState['tier'],
          relationId: String(editingQuestion.subtopic ?? editingQuestion.knowledge_point ?? ''),
          explanationVideoUrl: editingQuestion.explanation_video_url ?? '',
        })
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({ ...EMPTY_FORM })
      }
      setError('')
    }
  }, [isOpen, editingQuestion])

  // Invalidate React Query cache to trigger list refetch
  const invalidateQuestions = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.questions.list })
  }

  // React Query Mutations for creation and update
  const createQuestionMutation = useMutation({
    mutationFn: (payload: QuestionMutationPayload) => questionsService.createQuestion(payload),
    onSuccess: async () => {
      await invalidateQuestions()
      onSuccess(t('admin:questions.form.createSuccess', { defaultValue: 'Question created successfully.' }))
      onClose()
    },
    onError: (err) => {
      setError(getErrorMessage(err, 'Failed to create question'))
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: QuestionMutationPayload }) =>
      questionsService.updateQuestion(id, payload),
    onSuccess: async () => {
      await invalidateQuestions()
      onSuccess(t('admin:questions.form.updateSuccess', { defaultValue: 'Question updated successfully.' }))
      onClose()
    },
    onError: (err) => {
      setError(getErrorMessage(err, 'Failed to update question'))
    },
  })

  const isSaving = createQuestionMutation.isPending || updateQuestionMutation.isPending

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const validationResult = questionSchema.safeParse({
      text: form.text,
      choices: choicesArray,
      correctAnswerIndex: form.correctAnswerIndex,
      tier: form.tier,
      relationId: form.relationId,
      explanationVideoUrl: form.explanationVideoUrl,
    })

    if (!validationResult.success) {
      // Pick the first error issue to show in the error banner
      const firstIssue = validationResult.error.issues[0]
      setError(firstIssue.message)
      return
    }

    const payload: QuestionMutationPayload = {
      text: validationResult.data.text,
      choices: validationResult.data.choices,
      correct_answer_index: validationResult.data.correctAnswerIndex,
      tier: validationResult.data.tier,
      subtopic: validationResult.data.relationId || null,
      explanation_video_url: validationResult.data.explanationVideoUrl || null,
    }

    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, payload })
    } else {
      createQuestionMutation.mutate(payload)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isSaving) onClose()
            }}
          />

          {/* Modal Content Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl z-10 bg-white dark:bg-neutral-900"
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="flex flex-row items-start justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {editingQuestion ? 'Edit question' : 'Add question'}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Keep choices on separate lines. The correct answer index starts at 0.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                  onClick={onClose}
                  className="p-1 rounded-lg"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {/* Question Text */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Question text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.text}
                    onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                    disabled={isSaving}
                    className="min-h-28 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    required
                  />
                </div>

                {/* Choices */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Choices (One per line) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.choicesText}
                    onChange={(e) => setForm((prev) => ({ ...prev, choicesText: e.target.value }))}
                    disabled={isSaving}
                    className="min-h-32 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    placeholder={'Choice A\nChoice B\nChoice C'}
                    required
                  />
                </div>

                {/* Inline Fields */}
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Correct Index */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Correct index
                    </label>
                    <select
                      value={form.correctAnswerIndex}
                      onChange={(e) => setForm((prev) => ({ ...prev, correctAnswerIndex: e.target.value }))}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 h-[38px]"
                    >
                      {Array.from({ length: Math.max(choicesArray.length, 1) }).map((_, index) => (
                        <option key={index} value={index}>
                          {index} (Option {String.fromCharCode(65 + index)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tier */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Tier
                    </label>
                    <select
                      value={form.tier}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          tier: e.target.value as QuestionFormState['tier'],
                        }))
                      }
                      disabled={isSaving}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 h-[38px]"
                    >
                      <option value="1">Tier 1 (Basic)</option>
                      <option value="2">Tier 2 (Intermediate)</option>
                      <option value="3">Tier 3 (Advanced)</option>
                    </select>
                  </div>

                  {/* Subtopic ID */}
                  <Input
                    label="Subtopic ID"
                    value={form.relationId}
                    onChange={(e) => setForm((prev) => ({ ...prev, relationId: e.target.value }))}
                    placeholder="UUID or numeric id"
                    disabled={isSaving}
                  />
                </div>

                {/* Explanation Video URL */}
                <Input
                  label="Explanation video URL"
                  value={form.explanationVideoUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, explanationVideoUrl: e.target.value }))}
                  placeholder="https://..."
                  disabled={isSaving}
                />

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={onClose}
                  >
                    {t('common:cancel')}
                  </Button>
                  <Button type="submit" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                    {editingQuestion ? 'Save changes' : 'Create question'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
