import { useTranslation } from 'react-i18next'
import { X, Edit2, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, CardHeader, CardContent, Button, Badge } from '@/components/ui'
import type { BackendQuestion } from '@/services/questions'

interface QuestionPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  question: BackendQuestion | null
  onEdit: () => void
  onDelete: () => void
}

export function QuestionPreviewModal({
  isOpen,
  onClose,
  question,
  onEdit,
  onDelete,
}: QuestionPreviewModalProps) {
  const { t } = useTranslation(['admin', 'common'])

  if (!question) return null
  const correctAnswerIndex = question.correct_answer_index
  const hasCorrectAnswer = correctAnswerIndex !== null

  const getTierBadge = (tier: number) => {
    const configs: Record<number, { variant: 'success' | 'secondary' | 'accent'; label: string }> = {
      1: { variant: 'success', label: t('admin:questions.difficulty.basic') },
      2: { variant: 'secondary', label: t('admin:questions.difficulty.intermediate') },
      3: { variant: 'accent', label: t('admin:questions.difficulty.advanced') },
    }
    const config = configs[tier] || { variant: 'secondary' as const, label: t('admin:questions.tierValue', { tier }) }
    return <Badge variant={config.variant}>{config.label}</Badge>
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
            onClick={onClose}
          />

          {/* Modal Container */}
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
                    {t('admin:questions.preview.title')}
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="p-1 rounded-lg">
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-6 p-6">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{question.topic_name || t('admin:questions.unlinked')}</Badge>
                  {getTierBadge(question.tier)}
                  <Badge variant="primary">
                    {t('admin:questions.optionsCount', { count: question.choices?.length || 0 })}
                  </Badge>
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {t('admin:questions.preview.question')}
                  </h3>
                  <p className="text-base text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap font-medium">
                    {question.text}
                  </p>
                </div>

                {/* Choices */}
                {question.choices && question.choices.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      {t('admin:questions.preview.answerChoices')}
                    </h3>
                    <div className="space-y-2">
                      {question.choices.map((choice, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                            hasCorrectAnswer && i === correctAnswerIndex
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/60'
                              : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/60'
                          }`}
                        >
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            hasCorrectAnswer && i === correctAnswerIndex
                              ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className={`text-sm ${
                            hasCorrectAnswer && i === correctAnswerIndex
                              ? 'text-green-800 dark:text-green-200 font-semibold'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {choice}
                          </span>
                          {hasCorrectAnswer && i === correctAnswerIndex && (
                            <Badge variant="success" size="sm" className="ms-auto font-medium">
                              ✓ {t('admin:questions.preview.correct')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Metadata */}
                <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:questions.preview.correctAnswerIndex')}</p>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {hasCorrectAnswer
                        ? `${correctAnswerIndex} (${String.fromCharCode(65 + correctAnswerIndex)})`
                        : t('admin:questions.preview.notExposed')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:questions.preview.subtopic')}</p>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {question.subtopic_name ?? t('admin:questions.preview.general')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-700 pt-4 bg-transparent">
                  <Button
                    variant="outline"
                    leftIcon={<Edit2 className="h-4 w-4" />}
                    onClick={onEdit}
                  >
                    {t('admin:editQuestion')}
                  </Button>
                  <Button
                    variant="danger"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={onDelete}
                  >
                    {t('admin:deleteQuestion')}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    {t('common:close')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
