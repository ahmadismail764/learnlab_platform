import { useState, useMemo, useCallback, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  FolderTree,
  BookOpen,
  AlertTriangle,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { Card, Button, Badge, Input, EmptyState, Skeleton } from '@/components/ui'
import { useSuspenseTopics } from '@/hooks'
import { TopicFormModal } from '@/components/admin/TopicFormModal'
import { DeleteTopicDialog } from '@/components/admin/DeleteTopicDialog'

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

function TopicsManagementPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Module lists */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-grow">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-2 flex-grow max-w-sm">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TopicsManagementPage() {
  return (
    <Suspense fallback={<TopicsManagementPageSkeleton />}>
      <TopicsManagementContent />
    </Suspense>
  )
}

function TopicsManagementContent() {
  const { t } = useTranslation(['admin', 'common', 'topics'])

  // Data fetching via React Query
  const { data: rawTopics, error: queryError, refetch: fetchTopics } = useSuspenseTopics()
  const topics = useMemo(
    () => (rawTopics ?? []) as BackendTopic[],
    [rawTopics]
  )
  const loadError = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load topics') : ''

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Modal / Form state
  const [showForm, setShowForm] = useState(false)
  const [editingTopic, setEditingTopic] = useState<BackendTopic | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BackendTopic | null>(null)

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
    setEditingTopic(null)
    setShowForm(true)
  }, [])

  const openEditForm = useCallback((topic: BackendTopic) => {
    setEditingTopic(topic)
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditingTopic(null)
  }, [])

  // --- Loading & Error states ---

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{loadError}</p>
        <Button variant="outline" onClick={() => fetchTopics()} leftIcon={<RefreshCw className="w-4 h-4" />}>
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
          <Button variant="outline" onClick={() => fetchTopics()} leftIcon={<RefreshCw className="w-4 h-4" />}>
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
                          {index + 1}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(topic)}
                            title={t('common:edit')}
                            aria-label="Edit topic"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(topic)}
                            title={t('common:delete')}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            aria-label="Delete topic"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
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

      {/* Extracted Form Modal */}
      <TopicFormModal
        isOpen={showForm}
        onClose={closeForm}
        onSuccess={fetchTopics}
        editingTopic={editingTopic}
        topics={topics}
      />

      {/* Extracted Delete confirmation Dialog */}
      <DeleteTopicDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onSuccess={fetchTopics}
        topic={deleteTarget}
      />
    </div>
  )
}
