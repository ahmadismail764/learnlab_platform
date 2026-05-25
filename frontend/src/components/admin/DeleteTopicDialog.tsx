import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { topicsService } from '@/services/topics'
import { useToast } from '@/contexts'

interface BackendTopic {
  id: number
  name: string
  description: string
  parent_module: string
  question_count: number
}

interface DeleteTopicDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  topic: BackendTopic | null
}

export function DeleteTopicDialog({ isOpen, onClose, onSuccess, topic }: DeleteTopicDialogProps) {
  const { t } = useTranslation(['admin', 'common'])
  const { showSuccess, showError } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!topic) return

    setIsDeleting(true)
    try {
      await topicsService.deleteTopic(topic.id)
      showSuccess(t('admin:topicsManagement.form.deleteSuccess'))
      onClose()
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed'
      showError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && topic && (
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
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                    {t('admin:topicsManagement.delete.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {t('admin:topicsManagement.delete.description')}
                  </p>
                  
                  {/* Cascade Warning Box */}
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {t('admin:topicsManagement.delete.cascadeWarning')}
                    </p>
                  </div>
                  
                  {/* Topic Details Info */}
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">
                    {t('admin:topicsManagement.delete.topicLabel')}: <strong>{topic.name}</strong>
                    <br />
                    {t('admin:topicsManagement.delete.questionsAffected', { count: topic.question_count })}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
              <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                {t('common:cancel')}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? t('common:loading') : t('common:delete')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
