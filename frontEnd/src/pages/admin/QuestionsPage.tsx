import { useState, useMemo, useCallback } from 'react'
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
  GraduationCap,
  Layers,
  Crown,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Badge, Input, EmptyState } from '@/components/ui'
import { sampleQuestions, essayQuestionsPool, type SampleQuestion } from '@/data/sampleQuestions'
import type { DifficultyTier } from '@/types'

/**
 * QuestionsPage - Admin Question Bank Management (UC-05)
 * 
 * Features:
 * - View all questions with filtering
 * - Filter by topic, difficulty tier, answer type
 * - Search questions
 * - Preview question details
 * - Create / Edit question form with validation (UC-05 Steps 2-8)
 * - Soft delete with confirmation (UC-05 Alt Flow 7a)
 * - Validation error highlighting (UC-05 Alt Flow 6a)
 */

type FilterDifficulty = 'all' | DifficultyTier
type FilterType = 'all' | SampleQuestion['answerType']
type FormMode = 'create' | 'edit'

interface QuestionFormData {
  content: string
  topicId: string
  tier: DifficultyTier | null
  answerType: SampleQuestion['answerType']
  correctAnswer: string
  solutionSteps: string[] // Simple array of step strings for the form
  hints: string[]
}

const EMPTY_FORM: QuestionFormData = {
  content: '',
  topicId: '',
  tier: null,
  answerType: 'multiple-choice',
  correctAnswer: '',
  solutionSteps: [''],
  hints: [''],
}

// All available topic IDs (would come from backend/API)
const AVAILABLE_TOPICS = [
  'logic', 'sets', 'relations', 'functions',
  'combinatorics', 'graphs', 'numtheory',
  'proofs', 'algorithms', 'boolean-algebra',
]

export function QuestionsPage() {
  const { t } = useTranslation(['admin', 'common', 'topics'])
  
  // Combine all questions
  const allQuestions = useMemo(() => [...sampleQuestions, ...essayQuestionsPool], [])
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTopicId, setFilterTopicId] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Selected question for preview
  const [selectedQuestion, setSelectedQuestion] = useState<SampleQuestion | null>(null)

  // UC-05: CRUD form state
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<QuestionFormData>({ ...EMPTY_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [topicSearchQuery, setTopicSearchQuery] = useState('')

  // UC-05 Alt Flow 7a: Soft delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SampleQuestion | null>(null)

  // UC-05 Step 8: Success confirmation
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Get unique topics from questions
  const topicIds = useMemo(() => {
    const uniqueTopics = [...new Set(allQuestions.map(q => q.topicId))]
    return uniqueTopics.sort()
  }, [allQuestions])

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchContent = q.content.toLowerCase().includes(query)
        const matchId = q.id.toLowerCase().includes(query)
        if (!matchContent && !matchId) return false
      }
      
      // Topic filter
      if (filterTopicId !== 'all' && q.topicId !== filterTopicId) return false
      
      // Difficulty filter
      if (filterDifficulty !== 'all' && q.tier !== filterDifficulty) return false
      
      // Type filter
      if (filterType !== 'all' && q.answerType !== filterType) return false
      
      return true
    })
  }, [allQuestions, searchQuery, filterTopicId, filterDifficulty, filterType])

  // Stats
  const stats = useMemo(() => ({
    total: allQuestions.length,
    byTopic: topicIds.reduce((acc, topicId) => {
      acc[topicId] = allQuestions.filter(q => q.topicId === topicId).length
      return acc
    }, {} as Record<string, number>),
    byDifficulty: {
      1: allQuestions.filter(q => q.tier === 1).length,
      2: allQuestions.filter(q => q.tier === 2).length,
      3: allQuestions.filter(q => q.tier === 3).length,
    },
    byType: {
      'multiple-choice': allQuestions.filter(q => q.answerType === 'multiple-choice').length,
      'true-false': allQuestions.filter(q => q.answerType === 'true-false').length,
      'essay': allQuestions.filter(q => q.answerType === 'essay').length,
      'symbolic': allQuestions.filter(q => q.answerType === 'symbolic').length,
      'text': allQuestions.filter(q => q.answerType === 'text').length,
    }
  }), [allQuestions, topicIds])

  const getDifficultyBadge = (tier: DifficultyTier) => {
    const configs = {
      1: { variant: 'success' as const, label: t('admin:questions.difficulty.basic') },
      2: { variant: 'secondary' as const, label: t('admin:questions.difficulty.intermediate') },
      3: { variant: 'accent' as const, label: t('admin:questions.difficulty.advanced') },
    }
    const { variant, label } = configs[tier]
    return <Badge variant={variant}>{label}</Badge>
  }

  const getTypeBadge = (type: SampleQuestion['answerType']) => {
    const types: Record<SampleQuestion['answerType'], { variant: 'primary' | 'secondary' | 'accent'; label: string }> = {
      'multiple-choice': { variant: 'secondary', label: t('admin:questions.types.multipleChoice') },
      'true-false': { variant: 'primary', label: t('admin:questions.types.trueFalse') },
      'essay': { variant: 'accent', label: t('admin:questions.types.essay') },
      'symbolic': { variant: 'secondary', label: t('admin:questions.types.symbolic') },
      'text': { variant: 'primary', label: t('admin:questions.types.text') },
    }
    const { variant, label } = types[type]
    return <Badge variant={variant}>{label}</Badge>
  }

  // Searchable topics for the form dropdown
  const filteredFormTopics = useMemo(() => {
    if (!topicSearchQuery) return AVAILABLE_TOPICS
    return AVAILABLE_TOPICS.filter(id =>
      id.toLowerCase().includes(topicSearchQuery.toLowerCase()) ||
      t(`topics:${id}`).toLowerCase().includes(topicSearchQuery.toLowerCase())
    )
  }, [topicSearchQuery, t])

  // UC-05 Step 7: Validate form (Alt Flow 6a)
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.content.trim()) errors.content = t('admin:questions.form.errorContent')
    if (!formData.topicId) errors.topicId = t('admin:questions.form.errorTopic')
    if (!formData.tier) errors.tier = t('admin:questions.form.errorTier')
    if (!formData.correctAnswer.trim()) errors.correctAnswer = t('admin:questions.form.errorAnswer')
    const nonEmptySteps = formData.solutionSteps.filter(s => s.trim())
    if (nonEmptySteps.length === 0) errors.solutionSteps = t('admin:questions.form.errorSolution')
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, t])

  // Open create form
  const openCreateForm = useCallback(() => {
    setFormMode('create')
    setFormData({ ...EMPTY_FORM })
    setFormErrors({})
    setTopicSearchQuery('')
    setShowForm(true)
  }, [])

  // UC-05 Alt Flow 3a: Open edit form with existing data
  const openEditForm = useCallback((question: SampleQuestion) => {
    setFormMode('edit')
    setFormData({
      content: question.content,
      topicId: question.topicId,
      tier: question.tier,
      answerType: question.answerType,
      correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : String(question.correctAnswer),
      solutionSteps: question.solutionSteps.map(s => s.content),
      hints: question.hints?.length ? question.hints : [''],
    })
    setFormErrors({})
    setTopicSearchQuery('')
    setShowForm(true)
    setSelectedQuestion(null) // Close preview if open
  }, [])

  // UC-05 Step 6-8: Save question
  const handleSave = useCallback(() => {
    if (!validateForm()) return
    // Mock: In production, this would call the API
    setShowForm(false)
    setSuccessMessage(
      formMode === 'create'
        ? t('admin:questions.form.createSuccess')
        : t('admin:questions.form.updateSuccess')
    )
    setTimeout(() => setSuccessMessage(null), 4000)
  }, [validateForm, formMode, t])

  // UC-05 Alt Flow 7a: Soft delete
  const handleSoftDelete = useCallback((question: SampleQuestion) => {
    setDeleteTarget(question)
  }, [])

  const confirmDelete = useCallback(() => {
    // Mock: In production, sets is_active=false / deleted_at timestamp
    setDeleteTarget(null)
    setSuccessMessage(t('admin:questions.form.deleteSuccess'))
    setTimeout(() => setSuccessMessage(null), 4000)
  }, [t])

  // Update a form field
  const updateField = useCallback(<K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // Clear error for this field when user edits it
    setFormErrors(prev => {
      if (prev[key]) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return prev
    })
  }, [])

  // Solution steps helpers
  const addSolutionStep = useCallback(() => {
    setFormData(prev => ({ ...prev, solutionSteps: [...prev.solutionSteps, ''] }))
  }, [])

  const updateSolutionStep = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const steps = [...prev.solutionSteps]
      steps[index] = value
      return { ...prev, solutionSteps: steps }
    })
    setFormErrors(prev => {
      if (prev.solutionSteps) {
        const next = { ...prev }
        delete next.solutionSteps
        return next
      }
      return prev
    })
  }, [])

  const removeSolutionStep = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      solutionSteps: prev.solutionSteps.filter((_, i) => i !== index),
    }))
  }, [])

  // Hint helpers
  const addHint = useCallback(() => {
    setFormData(prev => ({ ...prev, hints: [...prev.hints, ''] }))
  }, [])

  const updateHint = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const hints = [...prev.hints]
      hints[index] = value
      return { ...prev, hints }
    })
  }, [])

  const removeHint = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index),
    }))
  }, [])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterTopicId('all')
    setFilterDifficulty('all')
    setFilterType('all')
  }

  const hasActiveFilters = filterTopicId !== 'all' || filterDifficulty !== 'all' || filterType !== 'all' || searchQuery !== ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('admin:questions.title')}</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">{t('admin:questions.subtitle')}</p>
        </div>
        <Button className="gap-2" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          {t('admin:questions.addQuestion')}
        </Button>
      </div>

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
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{stats.byDifficulty[1]}</p>
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
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{stats.byDifficulty[2]}</p>
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
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{stats.byDifficulty[3]}</p>
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
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-4 sm:grid-cols-3">
              {/* Topic Filter */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.filterTopic')}
                </label>
                <select
                  value={filterTopicId}
                  onChange={(e) => setFilterTopicId(e.target.value)}
                  aria-label={t('admin:questions.filterTopic')}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-neutral-100"
                >
                  <option value="all">{t('admin:questions.allTopics')}</option>
                  {topicIds.map(topicId => (
                    <option key={topicId} value={topicId}>
                      {topicId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.filterDifficulty')}
                </label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value === 'all' ? 'all' : Number(e.target.value) as DifficultyTier)}
                  aria-label={t('admin:questions.filterDifficulty')}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-neutral-100"
                >
                  <option value="all">{t('admin:questions.allDifficulties')}</option>
                  <option value="1">{t('admin:questions.difficulty.basic')}</option>
                  <option value="2">{t('admin:questions.difficulty.intermediate')}</option>
                  <option value="3">{t('admin:questions.difficulty.advanced')}</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.filterType')}
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  aria-label={t('admin:questions.filterType')}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-neutral-100"
                >
                  <option value="all">{t('admin:questions.allTypes')}</option>
                  <option value="multiple-choice">{t('admin:questions.types.multipleChoice')}</option>
                  <option value="true-false">{t('admin:questions.types.trueFalse')}</option>
                  <option value="essay">{t('admin:questions.types.essay')}</option>
                  <option value="symbolic">{t('admin:questions.types.symbolic')}</option>
                  <option value="text">{t('admin:questions.types.text')}</option>
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
                title={hasActiveFilters ? t('admin:questions.noMatchingQuestions') : t('admin:questions.noQuestions')}
                description={hasActiveFilters ? t('admin:questions.tryDifferentFilters') : t('admin:questions.addFirstQuestion')}
                action={hasActiveFilters ? { label: t('common:clearFilters'), onClick: clearFilters } : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-styled">
              <table className="w-full">
                <thead className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <tr>
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
                      {t('admin:questions.table.type')}
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
                        <p className="max-w-md truncate text-sm text-neutral-900 dark:text-neutral-100">
                          {question.content}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{question.id}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{question.topicId}</span>
                      </td>
                      <td className="px-4 py-4">
                        {getDifficultyBadge(question.tier)}
                      </td>
                      <td className="px-4 py-4">
                        {getTypeBadge(question.answerType)}
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
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSoftDelete(question)
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
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('admin:questions.preview.title')}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{selectedQuestion.id}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedQuestion(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selectedQuestion.topicId}</Badge>
                {getDifficultyBadge(selectedQuestion.tier)}
                {getTypeBadge(selectedQuestion.answerType)}
              </div>

              {/* Question Content */}
              <div>
                <h3 className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('admin:questions.preview.question')}</h3>
                <p className="text-neutral-900 dark:text-neutral-100">{selectedQuestion.content}</p>
              </div>

              {/* Correct Answer */}
              <div>
                <h3 className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('admin:questions.preview.correctAnswer')}</h3>
                <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3 text-green-800 dark:text-green-200">
                  {Array.isArray(selectedQuestion.correctAnswer) 
                    ? selectedQuestion.correctAnswer.join(', ')
                    : selectedQuestion.correctAnswer
                  }
                </div>
              </div>

              {/* Solution Steps */}
              {selectedQuestion.solutionSteps.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('admin:questions.preview.solutionSteps')}</h3>
                  <ol className="space-y-2">
                    {selectedQuestion.solutionSteps.map((step) => (
                      <li key={step.order} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-sm font-medium text-primary-600 dark:text-primary-400">
                          {step.order}
                        </span>
                        <div>
                          <p className="text-neutral-700 dark:text-neutral-300">{step.content}</p>
                          {step.explanation && (
                            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{step.explanation}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Hints */}
              {selectedQuestion.hints && selectedQuestion.hints.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('admin:questions.preview.hints')}</h3>
                  <ul className="space-y-1">
                    {selectedQuestion.hints.map((hint, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="text-accent-500">💡</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:questions.preview.xpReward')}</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{selectedQuestion.xpReward} XP</p>
                </div>
                {selectedQuestion.estimatedTime && (
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin:questions.preview.estimatedTime')}</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{selectedQuestion.estimatedTime}s</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <Button variant="outline" onClick={() => setSelectedQuestion(null)}>
                  {t('common:close')}
                </Button>
                <Button className="gap-2" onClick={() => openEditForm(selectedQuestion)}>
                  <Edit2 className="h-4 w-4" />
                  {t('common:edit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* UC-05 Steps 2-8: Create/Edit Question Form Modal */}
      {showForm && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-styled" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {formMode === 'create' ? t('admin:questions.form.createTitle') : t('admin:questions.form.editTitle')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('admin:questions.form.subtitle')}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Question Text — UC-05 Step 3 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.form.questionText')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  rows={3}
                  placeholder={t('admin:questions.form.questionPlaceholder')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500/20 ${
                    formErrors.content 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'
                  }`}
                />
                {formErrors.content && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {formErrors.content}
                  </p>
                )}
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t('admin:questions.form.latexHint')}
                </p>
              </div>

              {/* Topic — UC-05 Step 4: Searchable dropdown */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.form.topic')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={topicSearchQuery}
                    onChange={(e) => setTopicSearchQuery(e.target.value)}
                    placeholder={t('admin:questions.form.searchTopics')}
                    className="w-full rounded-t-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 ps-10 pe-3 py-2 text-sm dark:text-neutral-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <div className={`max-h-36 overflow-y-auto scrollbar-styled rounded-b-lg border border-t-0 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 ${
                    formErrors.topicId ? 'border-red-500' : ''
                  }`}>
                    {filteredFormTopics.map(topicId => (
                      <button
                        key={topicId}
                        type="button"
                        onClick={() => { updateField('topicId', topicId); setTopicSearchQuery('') }}
                        className={`w-full text-start px-3 py-2 text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors ${
                          formData.topicId === topicId 
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' 
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {t(`topics:${topicId}`, topicId)}
                      </button>
                    ))}
                    {filteredFormTopics.length === 0 && (
                      <p className="px-3 py-2 text-sm text-neutral-500">{t('common:noResults')}</p>
                    )}
                  </div>
                </div>
                {formData.topicId && (
                  <Badge variant="primary" size="sm" className="mt-1.5">
                    {t(`topics:${formData.topicId}`, formData.topicId)}
                  </Badge>
                )}
                {formErrors.topicId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {formErrors.topicId}
                  </p>
                )}
              </div>

              {/* Scaffolding Tier — UC-05 Step 5 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.form.scaffoldingTier')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {([1, 2, 3] as DifficultyTier[]).map((tier) => {
                    const isSelected = formData.tier === tier
                    const tierConfig = {
                      1: { icon: GraduationCap, label: t('admin:questions.form.tier1Label'), desc: t('admin:questions.form.tier1Desc'), color: 'green' },
                      2: { icon: Layers, label: t('admin:questions.form.tier2Label'), desc: t('admin:questions.form.tier2Desc'), color: 'secondary' },
                      3: { icon: Crown, label: t('admin:questions.form.tier3Label'), desc: t('admin:questions.form.tier3Desc'), color: 'accent' },
                    }[tier]
                    const Icon = tierConfig.icon
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => updateField('tier', tier)}
                        className={`p-3 rounded-lg border-2 text-start transition-all ${
                          isSelected 
                            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' 
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                        } ${formErrors.tier ? 'border-red-300' : ''}`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400'}`} />
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{tierConfig.label}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{tierConfig.desc}</p>
                      </button>
                    )
                  })}
                </div>
                {formErrors.tier && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {formErrors.tier}
                  </p>
                )}
              </div>

              {/* Answer Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.form.answerType')}
                </label>
                <select
                  value={formData.answerType}
                  onChange={(e) => updateField('answerType', e.target.value as SampleQuestion['answerType'])}
                  aria-label={t('admin:questions.form.answerType')}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="multiple-choice">{t('admin:questions.types.multipleChoice')}</option>
                  <option value="true-false">{t('admin:questions.types.trueFalse')}</option>
                  <option value="essay">{t('admin:questions.types.essay')}</option>
                  <option value="symbolic">{t('admin:questions.types.symbolic')}</option>
                  <option value="text">{t('admin:questions.types.text')}</option>
                </select>
              </div>

              {/* Correct Answer */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.form.correctAnswer')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.correctAnswer}
                  onChange={(e) => updateField('correctAnswer', e.target.value)}
                  placeholder={t('admin:questions.form.correctAnswerPlaceholder')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500/20 ${
                    formErrors.correctAnswer
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'
                  }`}
                />
                {formErrors.correctAnswer && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {formErrors.correctAnswer}
                  </p>
                )}
              </div>

              {/* Solution Steps — UC-05 Step 3 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.form.solutionSteps')} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {formData.solutionSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-2 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-medium text-primary-600 dark:text-primary-400 shrink-0">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => updateSolutionStep(i, e.target.value)}
                        placeholder={t('admin:questions.form.stepPlaceholder', { number: i + 1 })}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500/20 ${
                          formErrors.solutionSteps
                            ? 'border-red-500'
                            : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'
                        }`}
                      />
                      {formData.solutionSteps.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeSolutionStep(i)} className="mt-1">
                          <X className="h-4 w-4 text-neutral-400" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={addSolutionStep} className="mt-2">
                  <Plus className="h-4 w-4 me-1" /> {t('admin:questions.form.addStep')}
                </Button>
                {formErrors.solutionSteps && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {formErrors.solutionSteps}
                  </p>
                )}
              </div>

              {/* Hints (optional) */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('admin:questions.form.hints')} <span className="text-neutral-400">({t('common:optional')})</span>
                </label>
                <div className="space-y-2">
                  {formData.hints.map((hint, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-2 text-accent-500">💡</span>
                      <input
                        type="text"
                        value={hint}
                        onChange={(e) => updateHint(i, e.target.value)}
                        placeholder={t('admin:questions.form.hintPlaceholder', { number: i + 1 })}
                        className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      />
                      {formData.hints.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeHint(i)} className="mt-1">
                          <X className="h-4 w-4 text-neutral-400" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={addHint} className="mt-2">
                  <Plus className="h-4 w-4 me-1" /> {t('admin:questions.form.addHint')}
                </Button>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  {t('common:cancel')}
                </Button>
                <Button className="gap-2" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  {formMode === 'create' ? t('admin:questions.form.saveQuestion') : t('admin:questions.form.updateQuestion')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* UC-05 Alt Flow 7a: Soft Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="py-6 text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {t('admin:questions.form.deleteTitle')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                {t('admin:questions.form.deleteDescription')}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
                {t('admin:questions.form.softDeleteNote')}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                  {t('common:cancel')}
                </Button>
                <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                  <Trash2 className="h-4 w-4 me-2" />
                  {t('common:delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* UC-05 Step 8: Success Toast */}
      {successMessage && (
        <div className="fixed bottom-6 end-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
    </div>
  )
}
