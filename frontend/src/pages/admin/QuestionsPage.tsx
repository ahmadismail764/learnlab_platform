import { useState, useMemo, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  BookOpen,
  X,
  AlertTriangle,
  RefreshCw,
  Info,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Upload,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Badge, Input, EmptyState, Skeleton } from '@/components/ui'
import type { BackendQuestion } from '@/services/questions'
import { useSuspenseQuestions } from '@/hooks'
import { QuestionPreviewModal } from '@/components/admin/QuestionPreviewModal'
import { QuestionFormModal } from '@/components/admin/QuestionFormModal'
import { DeleteQuestionDialog } from '@/components/admin/DeleteQuestionDialog'
import { BookIngestionModal } from '@/components/admin/BookIngestionModal'
import { getTopicDisplayName } from '@/utils/topicLabels'

type FilterTier = 'all' | 1 | 2 | 3

function QuestionsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Info banner skeleton */}
      <Skeleton className="h-16 w-full rounded-xl" />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filters Skeleton */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="px-4 py-3 text-start">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-60" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-4 flex justify-end gap-2">
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="circular" width={28} height={28} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function QuestionsPage() {
  return (
    <Suspense fallback={<QuestionsPageSkeleton />}>
      <QuestionsContent />
    </Suspense>
  )
}

function QuestionsContent() {
  const { t } = useTranslation(['admin', 'common', 'topics'])

  // Data fetching via React Query
  const { data: rawQuestions, error: queryError, refetch: fetchQuestions } = useSuspenseQuestions()
  const questions = useMemo(
    () => (rawQuestions ?? []) as BackendQuestion[],
    [rawQuestions]
  )
  const loadError = queryError ? (queryError instanceof Error ? queryError.message : t('admin:failedToLoadQuestions')) : ''

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<FilterTier>('all')
  const [filterTopic, setFilterTopic] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Selected question / form states
  const [selectedQuestion, setSelectedQuestion] = useState<BackendQuestion | null>(null)
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false)
  const [isBookIngestionOpen, setIsBookIngestionOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<BackendQuestion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BackendQuestion | null>(null)
  
  // Notification states
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const handleActionSuccess = (message: string) => {
    setActionMessage(message)
    setActionError('')
  }

  const openCreateForm = () => {
    setEditingQuestion(null)
    setIsQuestionFormOpen(true)
    setActionError('')
    setActionMessage('')
  }

  const openBookIngestion = () => {
    setIsBookIngestionOpen(true)
    setActionError('')
    setActionMessage('')
  }

  const openEditForm = (question: BackendQuestion) => {
    setEditingQuestion(question)
    setIsQuestionFormOpen(true)
    setActionError('')
    setActionMessage('')
  }

  // Get unique topic names for filtering
  const topicNames = useMemo(() => {
    const names = [...new Set(questions.map((q) => q.topic_name).filter(Boolean))]
    return names.sort()
  }, [questions])

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchText = q.text.toLowerCase().includes(query)
        const matchTopic = q.topic_name?.toLowerCase().includes(query)
        if (!matchText && !matchTopic) return false
      }

      // Topic filter
      if (filterTopic !== 'all' && q.topic_name !== filterTopic) return false

      // Tier filter
      if (filterTier !== 'all' && q.tier !== filterTier) return false

      return true
    })
  }, [questions, searchQuery, filterTopic, filterTier])

  // Stats
  const stats = useMemo(() => ({
    total: questions.length,
    tier1: questions.filter((q) => q.tier === 1).length,
    tier2: questions.filter((q) => q.tier === 2).length,
    tier3: questions.filter((q) => q.tier === 3).length,
  }), [questions])

  const getTierBadge = (tier: number) => {
    const configs: Record<number, { variant: 'success' | 'secondary' | 'accent'; label: string; icon: typeof SignalLow }> = {
      1: { variant: 'success', label: t('admin:questions.difficulty.basic'), icon: SignalLow },
      2: { variant: 'secondary', label: t('admin:questions.difficulty.intermediate'), icon: SignalMedium },
      3: { variant: 'accent', label: t('admin:questions.difficulty.advanced'), icon: SignalHigh },
    }
    const config = configs[tier] || { variant: 'secondary' as const, label: t('admin:questions.tierValue', { tier }), icon: null }
    const IconComponent = config.icon
    return (
      <Badge variant={config.variant} size="sm" className="inline-flex items-center">
        {IconComponent && <IconComponent className="w-3.5 h-3.5 me-1 shrink-0" />}
        {config.label}
      </Badge>
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterTopic('all')
    setFilterTier('all')
  }

  const hasActiveFilters = filterTopic !== 'all' || filterTier !== 'all' || searchQuery !== ''

  // Loading state (Premium Skeleton Grid & Table Loader)

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{loadError}</p>
        <Button variant="outline" onClick={() => fetchQuestions()} leftIcon={<RefreshCw className="w-4 h-4" />}>
          {t('common:tryAgain')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('admin:questions.title')}</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">{t('admin:questions.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchQuestions()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            {t('common:refresh')}
          </Button>
          <Button variant="outline" className="gap-2" onClick={openBookIngestion}>
            <Upload className="h-4 w-4" />
            {t('admin:questions.ingestion.open')}
          </Button>
          <Button className="gap-2" onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            {t('admin:questions.addQuestion')}
          </Button>
        </div>
      </div>

      {/* Integration notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
        <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-sky-800 dark:text-sky-200">
            {t('admin:questions.connectedBackendApi')}
          </p>
          <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
            {t('admin:questions.connectedBackendDescription', { endpoint: '/practice/questions/' })}
          </p>
        </div>
      </div>

      {(actionError || actionMessage) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            actionError
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300'
              : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300'
          }`}
        >
          {actionError || actionMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:questions.stats.total')}</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <SignalLow className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:questions.stats.basic')}</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{stats.tier1}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400">
              <SignalMedium className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:questions.stats.intermediate')}</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{stats.tier2}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
              <SignalHigh className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin:questions.stats.advanced')}</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{stats.tier3}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <Input
              placeholder={t('admin:questions.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              fullWidth={false}
              className="flex-1"
            />

            {/* Filter Toggle */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              {t('admin:questions.filters')}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                {t('common:clearFilters')}
              </Button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-4 sm:grid-cols-2">
              {/* Topic Filter */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.filterTopic')}
                </label>
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  aria-label={t('admin:questions.filterTopic')}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-neutral-100"
                >
                  <option value="all">{t('admin:questions.allTopics')}</option>
                  {topicNames.map((name) => (
                    <option key={name} value={name}>
                      {getTopicDisplayName(t, name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tier Filter */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.filterDifficulty')}
                </label>
                <select
                  value={filterTier === 'all' ? 'all' : String(filterTier)}
                  onChange={(e) => setFilterTier(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2 | 3))}
                  aria-label={t('admin:questions.filterDifficulty')}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-neutral-100"
                >
                  <option value="all">{t('admin:questions.allDifficulties')}</option>
                  <option value="1">{t('admin:questions.difficulty.basic')} ({t('admin:questions.tierValue', { tier: 1 })})</option>
                  <option value="2">{t('admin:questions.difficulty.intermediate')} ({t('admin:questions.tierValue', { tier: 2 })})</option>
                  <option value="3">{t('admin:questions.difficulty.advanced')} ({t('admin:questions.tierValue', { tier: 3 })})</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('admin:questions.questionBank')}
            <span className="ms-2 text-sm font-normal text-neutral-500 dark:text-neutral-400">
              ({filteredQuestions.length} {t('admin:questions.questionsCount')})
            </span>
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {filteredQuestions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                preset={hasActiveFilters ? 'search' : 'content'}
                title={
                  questions.length === 0
                    ? t('admin:questions.noQuestionsInDatabase')
                    : hasActiveFilters
                    ? t('admin:questions.noMatchingQuestions')
                    : t('admin:questions.noQuestions')
                }
                description={
                  questions.length === 0
                    ? t('admin:questions.writeFallbackDescription')
                    : hasActiveFilters
                    ? t('admin:questions.tryDifferentFilters')
                    : t('admin:questions.addFirstQuestion')
                }
                action={hasActiveFilters ? { label: t('common:clearFilters'), onClick: clearFilters } : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-styled font-sans">
              <table className="w-full">
                <thead className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-4 py-3 text-start text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.question')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.topic')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.difficulty')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.choices')}
                    </th>
                    <th className="px-4 py-3 text-end text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredQuestions.map((question, index) => (
                    <tr
                      key={question.id}
                      className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                      onClick={() => setSelectedQuestion(question)}
                    >
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono text-neutral-400">#{index + 1}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-md truncate text-sm text-neutral-900 dark:text-neutral-100">
                          {question.text}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="secondary"
                          size="sm"
                          className="max-w-[14rem] whitespace-normal rounded-md text-start leading-snug"
                        >
                          {question.topic_name ? getTopicDisplayName(t, question.topic_name) : t('admin:questions.unlinked')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">{getTierBadge(question.tier)}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-500">
                          {t('admin:questions.optionsCount', { count: question.choices?.length || 0 })}
                        </span>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('admin:preview')}
                            onClick={() => setSelectedQuestion(question)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('admin:editQuestion')}
                            onClick={() => openEditForm(question)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('admin:deleteQuestion')}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteTarget(question)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standalone Question Preview Modal */}
      <QuestionPreviewModal
        isOpen={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        question={selectedQuestion}
        onEdit={() => {
          if (selectedQuestion) openEditForm(selectedQuestion)
          setSelectedQuestion(null)
        }}
        onDelete={() => {
          if (selectedQuestion) setDeleteTarget(selectedQuestion)
          setSelectedQuestion(null)
        }}
      />

      {/* Standalone Question Form Modal */}
      <QuestionFormModal
        isOpen={isQuestionFormOpen}
        onClose={() => {
          setIsQuestionFormOpen(false)
          setEditingQuestion(null)
        }}
        onSuccess={handleActionSuccess}
        editingQuestion={editingQuestion}
      />

      <BookIngestionModal
        isOpen={isBookIngestionOpen}
        onClose={() => setIsBookIngestionOpen(false)}
        onSuccess={handleActionSuccess}
      />

      {/* Standalone Question Delete Dialog */}
      <DeleteQuestionDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleActionSuccess}
        question={deleteTarget}
      />
    </div>
  )
}
