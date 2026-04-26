import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderTree,
  BookOpen,
  Save,
  X,
  AlertTriangle,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card, Button, Badge, Input, EmptyState } from '@/components/ui'
import { topicsService } from '@/services/topics'
import { useToast } from '@/contexts/ToastContext'

/**
 * TopicsManagementPage - Admin Curriculum Structure (UC-07)
 *
 * Backend-integrated:
 * - List all topics via GET /api/v1/practice/topics/
 * - Create topic via POST /api/v1/practice/topics/
 * - Edit topic via PUT /api/v1/practice/topics/:id/
 * - Delete topic via DELETE /api/v1/practice/topics/:id/
 *
 * Topics are grouped by `parent_module` field.
 */

// --- Interfaces matching backend serializer ---

interface BackendTopic {
  id: number
  name: string
  description: string
  parent_module: string
  question_count: number
}

interface ModuleGroup {
  parentModule: string
  topics: BackendTopic[]
}

type FormMode = 'create' | 'edit'

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

export function TopicsManagementPage() {
  const { t } = useTranslation(['admin', 'common', 'topics'])
  const { showSuccess, showError } = useToast()

  // Data state
  const [topics, setTopics] = useState<BackendTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<TopicFormData>({ ...EMPTY_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<BackendTopic | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // --- Data fetching ---

  const fetchTopics = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await topicsService.getTopics()
      // Handle both paginated and unpaginated responses
      const items: BackendTopic[] = Array.isArray(data) ? data : (data.results ?? [])
      setTopics(items)
      // Auto-expand first two modules
      const modules = [...new Set(items.map(t => t.parent_module || 'Uncategorized'))]
      setExpandedModules(new Set(modules.slice(0, 2)))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load topics'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  // --- Computed data ---

  // Group topics by parent_module
  const moduleGroups = useMemo<ModuleGroup[]>(() => {
    const grouped: Record<string, BackendTopic[]> = {}
    for (const topic of topics) {
      const key = topic.parent_module || 'Uncategorized'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(topic)
    }
    return Object.entries(grouped)
      .map(([parentModule, topicList]) => ({ parentModule, topics: topicList }))
      .sort((a, b) => a.parentModule.localeCompare(b.parentModule))
  }, [topics])

  // Get all unique parent modules for the form dropdown
  const parentModuleOptions = useMemo(() => {
    return [...new Set(topics.map(t => t.parent_module).filter(Boolean))].sort()
  }, [topics])

  const totalTopics = topics.length
  const totalQuestions = topics.reduce((sum, t) => sum + t.question_count, 0)

  // Filtered modules by search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return moduleGroups
    const q = searchQuery.toLowerCase()
    return moduleGroups
      .map(mod => ({
        ...mod,
        topics: mod.topics.filter(
          t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        ),
      }))
      .filter(mod => mod.topics.length > 0 || mod.parentModule.toLowerCase().includes(q))
  }, [searchQuery, moduleGroups])

  // Toggle module expansion
  const toggleModule = (moduleKey: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleKey)) {
        newSet.delete(moduleKey)
      } else {
        newSet.add(moduleKey)
      }
      return newSet
    })
  }

  // --- Form handlers ---

  const openCreateForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM })
    setFormErrors({})
    setFormMode('create')
    setEditingTopicId(null)
    setShowForm(true)
  }, [])

  const openEditForm = useCallback((topic: BackendTopic) => {
    setFormData({
      name: topic.name,
      description: topic.description,
      parent_module: topic.parent_module,
    })
    setFormErrors({})
    setFormMode('edit')
    setEditingTopicId(topic.id)
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setFormData({ ...EMPTY_FORM })
    setFormErrors({})
    setEditingTopicId(null)
  }, [])

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = t('admin:topicsManagement.form.errorName')
    }

    // Check duplicate name within same module (client-side, backend also validates)
    if (formData.name.trim()) {
      const duplicate = topics.find(
        t => t.name.toLowerCase() === formData.name.trim().toLowerCase()
          && t.id !== editingTopicId
      )
      if (duplicate) {
        errors.name = t('admin:topicsManagement.form.errorDuplicate')
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, editingTopicId, topics, t])

  const handleSave = useCallback(async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parent_module: formData.parent_module.trim(),
      }

      if (formMode === 'create') {
        await topicsService.createTopic(payload)
        showSuccess(t('admin:topicsManagement.form.createSuccess'))
      } else if (editingTopicId !== null) {
        await topicsService.updateTopic(editingTopicId, payload)
        showSuccess(t('admin:topicsManagement.form.updateSuccess'))
      }

      closeForm()
      await fetchTopics() // Refresh data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed'
      showError(message)
      // Try to extract field errors from the message
      if (message.includes('name')) {
        setFormErrors(prev => ({ ...prev, name: message }))
      }
    } finally {
      setIsSaving(false)
    }
  }, [validateForm, formMode, formData, editingTopicId, closeForm, fetchTopics, showSuccess, showError, t])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      await topicsService.deleteTopic(deleteTarget.id)
      showSuccess(t('admin:topicsManagement.form.deleteSuccess'))
      setDeleteTarget(null)
      await fetchTopics()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed'
      showError(message)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget, fetchTopics, showSuccess, showError, t])

  // --- Loading & Error states ---

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-sm font-medium text-neutral-500">Loading topics from backend...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{loadError}</p>
        <Button variant="outline" onClick={fetchTopics} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            {t('admin:topicsManagement.title')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {t('admin:topicsManagement.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTopics} leftIcon={<RefreshCw className="w-4 h-4" />}>
            {t('common:refresh')}
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateForm}>
            {t('admin:topicsManagement.addTopic')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FolderTree className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{moduleGroups.length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:topicsManagement.stats.modules')}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalTopics}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:topicsManagement.stats.topics')}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalQuestions}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:topicsManagement.stats.questions')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('admin:topicsManagement.searchPlaceholder')}
          className="ps-10"
        />
      </div>

      {/* Module hierarchy */}
      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          topics.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title="No topics yet"
              description="Create your first topic to get started. Topics are the building blocks of the curriculum."
              action={{ label: t('admin:topicsManagement.addTopic'), onClick: openCreateForm }}
            />
          ) : (
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title={t('common:noResults')}
              description={t('admin:tryDifferentFilters')}
            />
          )
        ) : (
          filteredModules.map((mod) => {
            const isExpanded = expandedModules.has(mod.parentModule)
            const moduleQuestions = mod.topics.reduce((sum, t) => sum + t.question_count, 0)

            return (
              <Card key={mod.parentModule} className="overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(mod.parentModule)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">
                    {mod.parentModule.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 text-start">
                    <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                      {mod.parentModule || 'Uncategorized'}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t('admin:topicsManagement.topicCount', { count: mod.topics.length })} · {t('admin:topicsManagement.questionCount', { count: moduleQuestions })}
                    </p>
                  </div>
                  <Badge variant="default" size="sm">
                    {mod.topics.length} {t('admin:topicsManagement.stats.topics').toLowerCase()}
                  </Badge>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-neutral-400 rtl:rotate-180" />
                  )}
                </button>

                {/* Topic list within module */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 dark:border-neutral-700">
                    {mod.topics.map((topic, index) => (
                      <div
                        key={topic.id}
                        className={`p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                          index !== mod.topics.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-mono font-bold text-neutral-500 shrink-0">
                          {topic.id}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                            {topic.name}
                          </h4>
                          {topic.description && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                              {topic.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            <span>{topic.question_count} {t('admin:topicsManagement.questionsLabel')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditForm(topic)} title={t('common:edit')}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(topic)} title={t('common:delete')} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* ═══════ Create / Edit Form Modal ═══════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Form header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                  {formMode === 'create'
                    ? t('admin:topicsManagement.form.createTitle')
                    : t('admin:topicsManagement.form.editTitle')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t('admin:topicsManagement.form.subtitle')}
                </p>
              </div>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Form body */}
            <div className="p-6 space-y-5">
              {/* Topic Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('admin:topicsManagement.form.topicName')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
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
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('admin:topicsManagement.form.descriptionPlaceholder')}
                  rows={3}
                  disabled={isSaving}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              {/* Parent Module — now a combobox: select existing or type new */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('admin:topicsManagement.form.parentModule')} <span className="text-neutral-400 text-xs">({t('common:optional')})</span>
                </label>
                <Input
                  value={formData.parent_module}
                  onChange={e => setFormData(prev => ({ ...prev, parent_module: e.target.value }))}
                  placeholder="e.g. Discrete Math > Logic"
                  disabled={isSaving}
                  list="parent-module-options"
                />
                <datalist id="parent-module-options">
                  {parentModuleOptions.map(mod => (
                    <option key={mod} value={mod} />
                  ))}
                </datalist>
                <p className="text-xs text-neutral-400 mt-1">
                  Select an existing module or type a new one. Leave empty for uncategorized.
                </p>
              </div>
            </div>

            {/* Form footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="outline" onClick={closeForm} disabled={isSaving}>
                {t('common:cancel')}
              </Button>
              <Button
                leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving
                  ? t('common:loading')
                  : formMode === 'create'
                    ? t('admin:topicsManagement.form.saveTopic')
                    : t('admin:topicsManagement.form.updateTopic')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Delete Confirmation Dialog ═══════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                    {t('admin:topicsManagement.delete.title')}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    {t('admin:topicsManagement.delete.description')}
                  </p>
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {t('admin:topicsManagement.delete.cascadeWarning')}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">
                    {t('admin:topicsManagement.delete.topicLabel')}: <strong>{deleteTarget.name}</strong>
                    <br />
                    {t('admin:topicsManagement.delete.questionsAffected', { count: deleteTarget.question_count })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                {t('common:cancel')}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? t('common:loading') : t('common:delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
