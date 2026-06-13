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
  Edit2,
  Trash2,
} from 'lucide-react'
import { Card, Button, Badge, Input, EmptyState, Skeleton } from '@/components/ui'
import { useSuspenseTopics } from '@/hooks'
import { TopicFormModal } from '@/components/admin/TopicFormModal'
import { DeleteTopicDialog } from '@/components/admin/DeleteTopicDialog'
import { getTopicCategoryDisplayName, getTopicDisplayName } from '@/utils/topicLabels'

/**
 * TopicsManagementPage - Admin Curriculum Structure (UC-07)
 *
 * Backend-integrated:
 * - List all topics via GET /api/v1/practice/topics/
 * - Create topic via POST /api/v1/practice/topics/
 * - Edit topic via PUT /api/v1/practice/topics/:id/
 * - Delete topic via DELETE /api/v1/practice/topics/:id/
 *
 * Topics are grouped by a frontend-derived category.
 */

interface BackendTopic {
  id: number
  name: string
  description: string
  category?: string
  question_count: number
}

interface CategoryGroup {
  category: string
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

      {/* Category lists */}
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
  const uncategorizedLabel = t('admin:uncategorized')

  // Data fetching via React Query
  const { data: rawTopics, error: queryError, refetch: fetchTopics } = useSuspenseTopics()
  const topics = useMemo(
    () => (rawTopics ?? []) as BackendTopic[],
    [rawTopics]
  )
  const loadError = queryError ? (queryError instanceof Error ? queryError.message : t('admin:failedToLoadTopics')) : ''

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Modal / Form state
  const [showForm, setShowForm] = useState(false)
  const [editingTopic, setEditingTopic] = useState<BackendTopic | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BackendTopic | null>(null)

  // --- Computed data ---

  // Group topics by frontend-derived category
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const grouped: Record<string, BackendTopic[]> = {}
    for (const topic of topics) {
      const key = topic.category || uncategorizedLabel
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(topic)
    }
    return Object.entries(grouped)
      .map(([category, topicList]) => ({ category, topics: topicList }))
      .sort((a, b) => a.category.localeCompare(b.category))
  }, [topics, uncategorizedLabel])

  const totalTopics = topics.length
  const totalQuestions = topics.reduce((sum, t) => sum + t.question_count, 0)

  // Filtered categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoryGroups
    const q = searchQuery.toLowerCase()
    return categoryGroups
      .map(group => ({
        ...group,
        topics: group.topics.filter(
          t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        ),
      }))
      .filter(group => group.topics.length > 0 || group.category.toLowerCase().includes(q))
  }, [searchQuery, categoryGroups])

  // Toggle category expansion
  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey)
      } else {
        newSet.add(categoryKey)
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
          {t('common:tryAgain')}
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
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{categoryGroups.length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:topicsManagement.stats.categories')}</p>
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

      {/* Category hierarchy */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          topics.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title={t('admin:topicsManagement.noTopicsYet')}
              description={t('admin:topicsManagement.noTopicsYetDescription')}
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
          filteredCategories.map((group) => {
            const isExpanded = expandedCategories.has(group.category)
            const categoryQuestions = group.topics.reduce((sum, t) => sum + t.question_count, 0)
            const categoryDisplayName = getTopicCategoryDisplayName(t, group.category)

            return (
              <Card key={group.category} className="overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">
                    {categoryDisplayName.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 text-start">
                    <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                      {categoryDisplayName}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t('admin:topicsManagement.topicCount', { count: group.topics.length })} · {t('admin:topicsManagement.questionCount', { count: categoryQuestions })}
                    </p>
                  </div>
                  <Badge variant="default" size="sm">
                    {group.topics.length} {t('admin:topicsManagement.stats.topics').toLowerCase()}
                  </Badge>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-neutral-400 rtl:rotate-180" />
                  )}
                </button>

                {/* Topic list within category */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 dark:border-neutral-700">
                    {group.topics.map((topic, index) => (
                      <div
                        key={topic.id}
                        className={`p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                          index !== group.topics.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-mono font-bold text-neutral-500 shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                            {getTopicDisplayName(t, topic.name)}
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
                            aria-label={t('admin:topicsManagement.editTopic')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(topic)}
                            title={t('common:delete')}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            aria-label={t('admin:topicsManagement.deleteTopic')}
                          >
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
