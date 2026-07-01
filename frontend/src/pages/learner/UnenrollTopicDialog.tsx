import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface UnenrollTopicDialogProps {
  isOpen: boolean
  topicName: string
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Confirm removing a topic from the learner's plan. Unenrolling deletes the
 * SubtopicMastery row, which discards the topic's FSRS review history — so this
 * is a deliberate, warned action.
 */
export function UnenrollTopicDialog({ isOpen, topicName, isPending, onConfirm, onClose }: UnenrollTopicDialogProps) {
  const { t } = useTranslation(['learner', 'common'])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isPending) onClose()
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="z-10 w-full max-w-md"
          >
            <Card className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {t('learner:removeTopicTitle', { topic: topicName })}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {t('learner:removeTopicWarning')}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose} disabled={isPending}>
                  {t('common:cancel')}
                </Button>
                <Button variant="danger" onClick={onConfirm} isLoading={isPending}>
                  {t('learner:removeTopicConfirm')}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
