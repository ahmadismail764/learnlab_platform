import { useState, useMemo, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  ChevronDown,
  BookOpen,
  GraduationCap,
  Layers,
  Crown,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Badge, Input, EmptyState } from '@/components/ui'
import { questionsService, type BackendQuestion, type QuestionMutationPayload } from '@/services/questions'
import { queryKeys, useQuestions } from '@/hooks'


/**
 * QuestionsPage - Admin Question Bank Management (UC-05)
 *
 * Backend-integrated (READ):
 * - List all questions via GET /api/v1/practice/questions/
 * - Filter by topic and tier via query params
 * - View question details
 *
 * Create/Edit/Delete are wired to the upgraded question API and surface
 * clean errors when an older backend still rejects write methods.
 */

type FilterTier = 'all' | 1 | 2 | 3

interface QuestionFormState {
  text: string
  choicesText: string
  correctAnswerIndex: string
  tier: '1' | '2' | '3'
  relationId: string
  explanationVideoUrl: string
}

const emptyQuestionForm: QuestionFormState = {
  text: '',
  choicesText: '',
  correctAnswerIndex: '0',
  tier: '1',
  relationId: '',
  explanationVideoUrl: '',
}

function questionToForm(question: BackendQuestion): QuestionFormState {
  return {
    text: question.text,
    choicesText: question.choices.join('\n'),
    correctAnswerIndex: String(question.correct_answer_index),
    tier: String(question.tier || 1) as QuestionFormState['tier'],
    relationId: String(question.subtopic ?? question.knowledge_point ?? ''),
    explanationVideoUrl: question.explanation_video_url ?? '',
  }
}

function formToPayload(form: QuestionFormState): QuestionMutationPayload {
  return {
    text: form.text,
    choices: form.choicesText
      .split('\n')
      .map((choice) => choice.trim())
      .filter(Boolean),
    correct_answer_index: Number(form.correctAnswerIndex),
    tier: Number(form.tier),
    subtopic: form.relationId.trim() || null,
    explanation_video_url: form.explanationVideoUrl.trim() || null,
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function QuestionsPage() {
  const { t } = useTranslation(['admin', 'common', 'topics'])
  const queryClient = useQueryClient()


  // Data fetching via React Query
  const { data: rawQuestions, isLoading, error: queryError, refetch: fetchQuestions } = useQuestions()
  const questions = useMemo(
    () => (rawQuestions ?? []) as BackendQuestion[],
    [rawQuestions]
  )
  const loadError = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load questions') : ''

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<FilterTier>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Selected question for preview
  const [selectedQuestion, setSelectedQuestion] = useState<BackendQuestion | null>(null)
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<BackendQuestion | null>(null)
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(emptyQuestionForm)
  const [deleteTarget, setDeleteTarget] = useState<BackendQuestion | null>(null)
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const invalidateQuestions = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.questions.list })
  }

  const createQuestionMutation = useMutation({
    mutationFn: (payload: QuestionMutationPayload) => questionsService.createQuestion(payload),
    onSuccess: async () => {
      await invalidateQuestions()
      setQuestionForm(emptyQuestionForm)
      setEditingQuestion(null)
      setIsQuestionFormOpen(false)
      setActionError('')
      setActionMessage('Question created successfully.')
    },
    onError: (error) => {
      setActionMessage('')
      setActionError(getErrorMessage(error, 'Failed to create question'))
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: QuestionMutationPayload }) =>
      questionsService.updateQuestion(id, payload),
    onSuccess: async () => {
      await invalidateQuestions()
      setQuestionForm(emptyQuestionForm)
      setEditingQuestion(null)
      setIsQuestionFormOpen(false)
      setActionError('')
      setActionMessage('Question updated successfully.')
    },
    onError: (error) => {
      setActionMessage('')
      setActionError(getErrorMessage(error, 'Failed to update question'))
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string | number) => questionsService.deleteQuestion(id),
    onSuccess: async () => {
      await invalidateQuestions()
      setDeleteTarget(null)
      setSelectedQuestion(null)
      setActionError('')
      setActionMessage('Question deleted successfully.')
    },
    onError: (error) => {
      setActionMessage('')
      setActionError(getErrorMessage(error, 'Failed to delete question'))
    },
  })

  const openCreateForm = () => {
    setEditingQuestion(null)
    setQuestionForm(emptyQuestionForm)
    setIsQuestionFormOpen(true)
    setActionError('')
    setActionMessage('')
  }

  const openEditForm = (question: BackendQuestion) => {
    setEditingQuestion(question)
    setQuestionForm(questionToForm(question))
    setIsQuestionFormOpen(true)
    setActionError('')
    setActionMessage('')
  }

  const handleQuestionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = formToPayload(questionForm)

    if (!payload.text || payload.choices.length < 2) {
      setActionError('Add the question text and at least two answer choices.')
      return
    }

    if (payload.correct_answer_index < 0 || payload.correct_answer_index >= payload.choices.length) {
      setActionError('Correct answer index must point to one of the listed choices.')
      return
    }

    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, payload })
    } else {
      createQuestionMutation.mutate(payload)
    }
  }

  const isSavingQuestion = createQuestionMutation.isPending || updateQuestionMutation.isPending


  // --- Computed data ---

  // Get unique topic names
  const topicNames = useMemo(() => {
    const names = [...new Set(questions.map(q => q.topic_name).filter(Boolean))]
    return names.sort()
  }, [questions])

  const [filterTopic, setFilterTopic] = useState<string>('all')

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
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
    tier1: questions.filter(q => q.tier === 1).length,
    tier2: questions.filter(q => q.tier === 2).length,
    tier3: questions.filter(q => q.tier === 3).length,
  }), [questions])

  const getTierBadge = (tier: number) => {
    const configs: Record<number, { variant: 'success' | 'secondary' | 'accent'; label: string }> = {
      1: { variant: 'success', label: t('admin:questions.difficulty.basic') },
      2: { variant: 'secondary', label: t('admin:questions.difficulty.intermediate') },
      3: { variant: 'accent', label: t('admin:questions.difficulty.advanced') },
    }
    const config = configs[tier] || { variant: 'secondary' as const, label: `Tier ${tier}` }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterTopic('all')
    setFilterTier('all')
  }

  const hasActiveFilters = filterTopic !== 'all' || filterTier !== 'all' || searchQuery !== ''
  const formChoices = useMemo(
    () => questionForm.choicesText.split('\n').map((choice) => choice.trim()).filter(Boolean),
    [questionForm.choicesText]
  )

  // --- Loading & Error states ---

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-sm font-medium text-neutral-500">Loading questions from backend...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{loadError}</p>
        <Button variant="outline" onClick={() => fetchQuestions()} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry
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
          <p className="text-sm font-medium text-sky-800 dark:text-sky-200">Question writes are wired to the backend API</p>
          <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
            Create, edit, and delete call <code className="bg-sky-100 dark:bg-sky-900/40 px-1 rounded">/practice/questions/</code>. 
            If the checked-in backend snapshot is still read-only, the action will fail gracefully without changing the table.
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
              <GraduationCap className="h-5 w-5" />
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
              <Layers className="h-5 w-5" />
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
              <Crown className="h-5 w-5" />
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
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder={t('admin:questions.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

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
                  {topicNames.map(name => (
                    <option key={name} value={name}>
                      {name}
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
                  onChange={(e) => setFilterTier(e.target.value === 'all' ? 'all' : Number(e.target.value) as 1 | 2 | 3)}
                  aria-label={t('admin:questions.filterDifficulty')}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-neutral-100"
                >
                  <option value="all">{t('admin:questions.allDifficulties')}</option>
                  <option value="1">{t('admin:questions.difficulty.basic')} (Tier 1)</option>
                  <option value="2">{t('admin:questions.difficulty.intermediate')} (Tier 2)</option>
                  <option value="3">{t('admin:questions.difficulty.advanced')} (Tier 3)</option>
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
            <span className="ml-2 text-sm font-normal text-neutral-500 dark:text-neutral-400">
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
                    ? 'No questions in the database'
                    : hasActiveFilters
                      ? t('admin:questions.noMatchingQuestions')
                      : t('admin:questions.noQuestions')
                }
                description={
                  questions.length === 0
                    ? 'Questions must be added via Django Admin or the management command until the backend supports write operations.'
                    : hasActiveFilters
                      ? t('admin:questions.tryDifferentFilters')
                      : t('admin:questions.addFirstQuestion')
                }
                action={hasActiveFilters ? { label: t('common:clearFilters'), onClick: clearFilters } : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-styled">
              <table className="w-full">
                <thead className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.question')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.topic')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.difficulty')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      Choices
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">
                      {t('admin:questions.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredQuestions.map((question) => (
                    <tr
                      key={question.id}
                      className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                      onClick={() => setSelectedQuestion(question)}
                    >
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono text-neutral-400">#{question.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-md truncate text-sm text-neutral-900 dark:text-neutral-100">
                          {question.text}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary" size="sm">{question.topic_name || 'Unlinked'}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        {getTierBadge(question.tier)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-500">{question.choices?.length || 0} options</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedQuestion(question)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit question"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditForm(question)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete question"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(question)
                              setActionError('')
                              setActionMessage('')
                            }}
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

      {/* Question Preview Modal */}
      {selectedQuestion && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedQuestion(null)}>
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-styled" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('admin:questions.preview.title')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Question #{selectedQuestion.id}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedQuestion(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selectedQuestion.topic_name || 'Unlinked'}</Badge>
                {getTierBadge(selectedQuestion.tier)}
                <Badge variant="primary">{selectedQuestion.choices?.length || 0} choices</Badge>
              </div>

              {/* Question Text */}
              <div>
                <h3 className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.preview.question')}
                </h3>
                <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                  {selectedQuestion.text}
                </p>
              </div>

              {/* Choices */}
              {selectedQuestion.choices && selectedQuestion.choices.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Answer Choices
                  </h3>
                  <div className="space-y-2">
                    {selectedQuestion.choices.map((choice, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          i === selectedQuestion.correct_answer_index
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                          i === selectedQuestion.correct_answer_index
                            ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className={`text-sm ${
                          i === selectedQuestion.correct_answer_index
                            ? 'text-green-800 dark:text-green-200 font-medium'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {choice}
                        </span>
                        {i === selectedQuestion.correct_answer_index && (
                          <Badge variant="success" size="sm" className="ml-auto">✓ Correct</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer Index */}
              <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Correct Answer Index</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {selectedQuestion.correct_answer_index} ({String.fromCharCode(65 + selectedQuestion.correct_answer_index)})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Subtopic / Knowledge Point ID</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {selectedQuestion.subtopic ?? selectedQuestion.knowledge_point ?? 'None'}
                  </p>
                </div>
              </div>

              {selectedQuestion.explanation_video_url && (
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Explanation Video</p>
                  <a
                    href={selectedQuestion.explanation_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all"
                  >
                    {selectedQuestion.explanation_video_url}
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <Button
                  variant="outline"
                  leftIcon={<Edit2 className="h-4 w-4" />}
                  onClick={() => {
                    openEditForm(selectedQuestion)
                    setSelectedQuestion(null)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => {
                    setDeleteTarget(selectedQuestion)
                    setSelectedQuestion(null)
                  }}
                >
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setSelectedQuestion(null)}>
                  {t('common:close')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isQuestionFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!isSavingQuestion) {
              setIsQuestionFormOpen(false)
              setEditingQuestion(null)
              setQuestionForm(emptyQuestionForm)
            }
          }}
        >
          <Card
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-styled"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {editingQuestion ? 'Edit question' : 'Add question'}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Keep choices on separate lines. The correct answer index starts at 0.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSavingQuestion}
                onClick={() => {
                  setIsQuestionFormOpen(false)
                  setEditingQuestion(null)
                  setQuestionForm(emptyQuestionForm)
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>

            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Question text
                </label>
                <textarea
                  value={questionForm.text}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, text: event.target.value }))}
                  className="min-h-28 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Choices
                </label>
                <textarea
                  value={questionForm.choicesText}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, choicesText: event.target.value }))}
                  className="min-h-32 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  placeholder={'Choice A\nChoice B\nChoice C'}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Correct index
                  </label>
                  <select
                    value={questionForm.correctAnswerIndex}
                    onChange={(event) => setQuestionForm((prev) => ({ ...prev, correctAnswerIndex: event.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    {Array.from({ length: Math.max(formChoices.length, 1) }).map((_, index) => (
                      <option key={index} value={index}>
                        {index}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Tier
                  </label>
                  <select
                    value={questionForm.tier}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        tier: event.target.value as QuestionFormState['tier'],
                      }))
                    }
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                  </select>
                </div>

                <Input
                  label="Subtopic ID"
                  value={questionForm.relationId}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, relationId: event.target.value }))}
                  placeholder="UUID or numeric id"
                />
              </div>

              <Input
                label="Explanation video URL"
                value={questionForm.explanationVideoUrl}
                onChange={(event) => setQuestionForm((prev) => ({ ...prev, explanationVideoUrl: event.target.value }))}
                placeholder="https://..."
              />

              {actionError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                  {actionError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSavingQuestion}
                  onClick={() => {
                    setIsQuestionFormOpen(false)
                    setEditingQuestion(null)
                    setQuestionForm(emptyQuestionForm)
                  }}
                >
                  {t('common:cancel')}
                </Button>
                <Button type="submit" isLoading={isSavingQuestion}>
                  {editingQuestion ? 'Save changes' : 'Create question'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleteQuestionMutation.isPending && setDeleteTarget(null)}
        >
          <Card className="w-full max-w-md" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Delete this question?
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  This will call the backend delete endpoint for question #{deleteTarget.id}.
                </p>
              </div>
            </div>

            {actionError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                disabled={deleteQuestionMutation.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                {t('common:cancel')}
              </Button>
              <Button
                variant="danger"
                isLoading={deleteQuestionMutation.isPending}
                onClick={() => deleteQuestionMutation.mutate(deleteTarget.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
