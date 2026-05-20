import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Card } from '@/components/ui'
import { questionsService, type BackendQuestion } from '@/services/questions'
import { queryKeys } from '@/hooks'

interface DeleteQuestionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  question: BackendQuestion | null
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function DeleteQuestionDialog({
  isOpen,
  onClose,
  onSuccess,
  question,
}: DeleteQuestionDialogProps) {
  const { t } = useTranslation(['admin', 'common'])
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  // Mutation to delete the question
  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string | number) => questionsService.deleteQuestion(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions.list })
      onSuccess(t('admin:questions.form.deleteSuccess', { defaultValue: 'Question deleted successfully.' }))
      onClose()
    },
    onError: (err) => {
      setError(getErrorMessage(err, 'Failed to delete question'))
    },
  })

  const isDeleting = deleteQuestionMutation.isPending

  return (
    <AnimatePresence>
      {isOpen && question && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) onClose()
            }}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden z-10"
          >
            <Card className="border-0 shadow-none bg-transparent p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Delete this question?
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    This will call the backend delete endpoint for question #{question.id}.
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  disabled={isDeleting}
                  onClick={onClose}
                >
                  {t('common:cancel')}
                </Button>
                <Button
                  variant="danger"
                  isLoading={isDeleting}
                  leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  onClick={() => deleteQuestionMutation.mutate(question.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
