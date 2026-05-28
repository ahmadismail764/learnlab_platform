import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Loader2, Save, AlertTriangle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { topicsService } from '@/services/topics'
import { useToast } from '@/contexts'
import { createTopicSchema, validateForm as zodValidateForm } from '@/validation'

interface BackendTopic {
  id: number
  name: string
  description: string
  parent_module: string
  question_count: number
}

interface TopicFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingTopic?: BackendTopic | null
  topics: BackendTopic[]
}

interface TopicFormData {
  name: string
  description: string
  parent_module: string
}

const EMPTY_FORM: TopicFormData = {
  name: '',
  description: '',
  parent_module: '',
}

export function TopicFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingTopic,
  topics,
}: TopicFormModalProps) {
  const { t } = useTranslation(['admin', 'common'])
  const { showSuccess, showError } = useToast()

  const [formData, setFormData] = useState<TopicFormData>({ ...EMPTY_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Memoized existing parent modules for dropdown suggestions
  const parentModuleOptions = useMemo(() => {
    return [...new Set(topics.map((t) => t.parent_module).filter(Boolean))].sort()
  }, [topics])

  // Sync form state when modal opens or active topic changes
  useEffect(() => {
    if (isOpen) {
      if (editingTopic) {
        setFormData({
          name: editingTopic.name,
          description: editingTopic.description,
          parent_module: editingTopic.parent_module || '',
        })
      } else {
        setFormData({ ...EMPTY_FORM })
      }
      setFormErrors({})
    }
  }, [isOpen, editingTopic])

  const validateForm = (): boolean => {
    const schema = createTopicSchema(topics, editingTopic?.id)
    const result = zodValidateForm(schema, formData)
    if (result.success) {
      setFormErrors({})
      return true
    } else {
      const errors = { ...result.fieldErrors }
      if (errors.name) {
        if (errors.name === 'Topic name is required') {
          errors.name = t('admin:topicsManagement.form.errorName')
        } else if (errors.name === 'A topic with this name already exists') {
          errors.name = t('admin:topicsManagement.form.errorDuplicate')
        }
      }
      setFormErrors(errors)
      return false
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parent_module: formData.parent_module.trim(),
      }

      if (!editingTopic) {
        await topicsService.createTopic(payload)
        showSuccess(t('admin:topicsManagement.form.createSuccess'))
      } else {
        await topicsService.updateTopic(editingTopic.id, payload)
        showSuccess(t('admin:topicsManagement.form.updateSuccess'))
      }

      onClose()
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('admin:topicsManagement.form.saveError')
      showError(message)
      if (message.toLowerCase().includes('name')) {
        setFormErrors((prev) => ({ ...prev, name: message }))
      }
    } finally {
      setIsSaving(false)
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

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                  {!editingTopic
                    ? t('admin:topicsManagement.form.createTitle')
                    : t('admin:topicsManagement.form.editTitle')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t('admin:topicsManagement.form.subtitle')}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label={t('common:close')}
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-5">
              {/* Topic Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('admin:topicsManagement.form.topicName')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  placeholder={t('admin:topicsManagement.form.namePlaceholder')}
                  className={formErrors.name ? 'border-red-500 dark:border-red-500' : ''}
                  disabled={isSaving}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('admin:topicsManagement.form.description')} <span className="text-neutral-400 text-xs">({t('common:optional')})</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t('admin:topicsManagement.form.descriptionPlaceholder')}
                  rows={3}
                  disabled={isSaving}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              {/* Parent Module */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('admin:topicsManagement.form.parentModule')}{' '}
                  <span className="text-neutral-400 text-xs">({t('common:optional')})</span>
                </label>
                <Input
                  value={formData.parent_module}
                  onChange={(e) => setFormData((prev) => ({ ...prev, parent_module: e.target.value }))}
                  placeholder={t('admin:topicsManagement.form.parentModulePlaceholder')}
                  disabled={isSaving}
                  list="parent-module-options"
                />
                <datalist id="parent-module-options">
                  {parentModuleOptions.map((mod) => (
                    <option key={mod} value={mod} />
                  ))}
                </datalist>
                <p className="text-xs text-neutral-400 mt-1">
                  {t('admin:topicsManagement.form.parentModuleHelp')}
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                {t('common:cancel')}
              </Button>
              <Button
                leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving
                  ? t('common:loading')
                  : !editingTopic
                  ? t('admin:topicsManagement.form.saveTopic')
                  : t('admin:topicsManagement.form.updateTopic')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
