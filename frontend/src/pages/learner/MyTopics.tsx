import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Target,
  Clock,
  Play,
  Search,
  Calendar,
  TrendingUp,
  X,
} from 'lucide-react'
import { Card, Button, Badge, Input, ProgressBar, AllCaughtUpIllustration } from '@/components/ui'
import { getTopicCategoryDisplayName, getTopicDisplayName } from '@/utils/topicLabels'
import { TIER_BADGE, groupTopicsByCategory, type TopicItem } from './topicItems'

interface MyTopicsProps {
  /** The learner's enrolled topics. */
  topics: TopicItem[]
  /** Opens the unenroll confirm dialog for a topic. */
  onRequestUnenroll: (topic: TopicItem) => void
  /** Subtopic id currently being unenrolled (pending state). */
  unenrollingId?: string | null
}

/**
 * The enrolled-topics ("My Topics") experience: overview stats, search, the
 * due-today / future-review queues, and the browse-by-category accordion — all
 * scoped to the topics the learner is enrolled in, with an unenroll action.
 */
export function MyTopics({ topics, onRequestUnenroll, unenrollingId }: MyTopicsProps) {
  const { t } = useTranslation(['topics', 'learner', 'common'])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['logic', 'sets']))
  const [searchQuery, setSearchQuery] = useState('')

  const mappedCategories = useMemo(() => groupTopicsByCategory(topics), [topics])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const getStateColor = (state: TopicItem['state']) => {
    switch (state) {
      case 'mastered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'review':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'learning':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      case 'new':
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
    }
  }

  const getStateLabel = (state: TopicItem['state']) => {
    switch (state) {
      case 'mastered':
        return t('learner:stateMastered')
      case 'review':
        return t('learner:stateReview')
      case 'learning':
        return t('learner:stateLearning')
      case 'new':
        return t('learner:stateNew')
    }
  }

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return mappedCategories
    const q = searchQuery.toLowerCase()
    return mappedCategories
      .map((cat) => ({
        ...cat,
        topics: cat.topics.filter(
          (topic) =>
            topic.name.toLowerCase().includes(q) || (topic.description || '').toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.topics.length > 0)
  }, [searchQuery, mappedCategories])

  const allTopics = useMemo(() => mappedCategories.flatMap((cat) => cat.topics), [mappedCategories])
  const dueTodayTopics = useMemo(
    () => allTopics.filter((tp) => tp.nextReview === 'today').sort((a, b) => a.memory - b.memory),
    [allTopics],
  )
  const futureReviewTopics = useMemo(
    () => allTopics.filter((tp) => tp.nextReview && tp.nextReview !== 'today' && tp.state !== 'new'),
    [allTopics],
  )
  const newTopics = useMemo(() => allTopics.filter((tp) => tp.state === 'new'), [allTopics])

  const totalTopics = allTopics.length
  const topicsDue = dueTodayTopics.length
  const avgProgress =
    totalTopics > 0 ? Math.round(allTopics.reduce((sum, tp) => sum + tp.progress, 0) / totalTopics) : 0
  const allCaughtUp = topicsDue === 0

  const unenrollButton = (topic: TopicItem) => (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t('learner:removeTopic', { topic: getTopicDisplayName(t, topic.name) })}
      title={t('learner:removeTopic', { topic: getTopicDisplayName(t, topic.name) })}
      isLoading={unenrollingId === topic.id}
      onClick={() => onRequestUnenroll(topic)}
    >
      {unenrollingId === topic.id ? null : <X className="h-4 w-4" />}
    </Button>
  )

  const practiceButton = (topic: TopicItem) => (
    <Link to={`/learner/practice?subtopic=${topic.id}`}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t('learner:practiceTopic', { topic: getTopicDisplayName(t, topic.name) })}
        title={t('learner:practiceTopic', { topic: getTopicDisplayName(t, topic.name) })}
      >
        <Play className="h-4 w-4" />
      </Button>
    </Link>
  )

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
              <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalTopics}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('learner:totalTopics')}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary-100 p-2 dark:bg-secondary-900/30">
              <Clock className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{topicsDue}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('learner:dueForReview')}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent-100 p-2 dark:bg-accent-900/30">
              <Target className="h-5 w-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{avgProgress}%</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('learner:avgProgress')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('learner:searchTopics')}
        leftIcon={<Search className="h-4 w-4" />}
        size="md"
        className="rounded-xl py-2.5"
      />

      {/* All caught up / start-practice CTA */}
      {allCaughtUp ? (
        <Card className="py-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <AllCaughtUpIllustration className="mx-auto" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
              {t('learner:allCaughtUp')}
            </h2>
            <p className="max-w-md text-neutral-500 dark:text-neutral-400">
              {t('learner:allCaughtUpDescription')}
            </p>
            <div className="mt-2 flex items-center gap-3">
              {futureReviewTopics.length > 0 && (
                <Link to="/learner/practice">
                  <Button variant="outline" leftIcon={<TrendingUp className="h-4 w-4" />}>
                    {t('learner:studyAhead')}
                  </Button>
                </Link>
              )}
              {newTopics.length > 0 && (
                <Link to="/learner/practice">
                  <Button leftIcon={<BookOpen className="h-4 w-4" />}>
                    {t('learner:exploreNewTopics', { count: newTopics.length })}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-0 bg-linear-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{t('learner:topicsProgress', { due: topicsDue })}</p>
              <p className="text-sm text-primary-100">{t('learner:keepKnowledgeFresh')}</p>
            </div>
            <Link to="/learner/practice">
              <Button
                variant="outline"
                className="border-white/50 text-white hover:border-white/70 hover:bg-white/20 dark:border-white/50 dark:hover:border-white/70 dark:hover:bg-white/20"
                leftIcon={<Play className="h-4 w-4" />}
              >
                {t('learner:startSession')}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Due Today */}
      {dueTodayTopics.length > 0 && !searchQuery && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            <Clock className="h-5 w-5 text-primary-500" />
            {t('learner:dueToday')}
            <Badge variant="primary" size="sm">
              {dueTodayTopics.length}
            </Badge>
          </h2>
          <div className="space-y-2">
            {dueTodayTopics.map((topic) => (
              <Card key={topic.id} padding="sm" className="transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 font-mono text-lg dark:bg-neutral-800">
                    {topic.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-medium text-neutral-800 dark:text-neutral-100">
                        {getTopicDisplayName(t, topic.name)}
                      </h4>
                      <span className="text-sm" title={t('learner:tier', { level: topic.tier })}>
                        {TIER_BADGE[topic.tier]}
                      </span>
                      <Badge size="sm" className={getStateColor(topic.state)}>
                        {getStateLabel(topic.state)}
                      </Badge>
                      <Badge
                        size="sm"
                        variant="primary"
                        className="animate-pulse bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      >
                        {t('learner:reviewCue')}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>
                        {topic.questionsTotal} {t('learner:questions')}
                      </span>
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        {topic.questionsDue} {t('learner:due')}
                      </span>
                      <span>
                        {t('learner:memoryLabel')}: {Math.round(topic.memory * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                      <p className="mt-1 text-center text-xs text-neutral-500 dark:text-neutral-400">
                        {topic.progress}%
                      </p>
                    </div>
                    {practiceButton(topic)}
                    {unenrollButton(topic)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Future Reviews */}
      {futureReviewTopics.length > 0 && !searchQuery && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            <Calendar className="h-5 w-5 text-amber-500" />
            {t('learner:futureReviews')}
            <Badge variant="default" size="sm">
              {futureReviewTopics.length}
            </Badge>
          </h2>
          <div className="space-y-2">
            {futureReviewTopics.map((topic) => (
              <Card key={topic.id} padding="sm" className="opacity-80 transition-opacity hover:opacity-100">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 font-mono text-lg dark:bg-neutral-800">
                    {topic.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-medium text-neutral-800 dark:text-neutral-100">
                        {getTopicDisplayName(t, topic.name)}
                      </h4>
                      <span className="text-sm" title={t('learner:tier', { level: topic.tier })}>
                        {TIER_BADGE[topic.tier]}
                      </span>
                      <Badge size="sm" className={getStateColor(topic.state)}>
                        {getStateLabel(topic.state)}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>
                        {topic.questionsTotal} {t('learner:questions')}
                      </span>
                      <span>
                        {t('learner:nextReviewIn')}: {topic.nextReview}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                      <p className="mt-1 text-center text-xs text-neutral-500 dark:text-neutral-400">
                        {topic.progress}%
                      </p>
                    </div>
                    {practiceButton(topic)}
                    {unenrollButton(topic)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Browse by category */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          {t('learner:browseByCategory')}
        </h2>
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <Card className="py-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <p className="text-neutral-500 dark:text-neutral-400">{t('common:noResults')}</p>
              </div>
            </Card>
          ) : (
            filteredCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id)
              const categoryProgress = Math.round(
                category.topics.reduce((sum, tp) => sum + tp.progress, 0) / category.topics.length,
              )
              const categoryDue = category.topics.filter((tp) => tp.questionsDue > 0).length

              return (
                <Card key={category.id} className="overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex w-full items-center gap-4 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <div className="flex-1 text-start">
                      <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                        {getTopicCategoryDisplayName(t, category.nameKey)}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t('learner:categoryInfo', {
                          count: category.topics.length,
                          progress: categoryProgress,
                        })}
                        {categoryDue > 0 && (
                          <span className="ms-2 text-primary-600 dark:text-primary-400">
                            · {t('learner:categoryDue', { count: categoryDue })}
                          </span>
                        )}
                      </p>
                    </div>
                    <ProgressBar value={categoryProgress} size="sm" className="w-24" showLabel={false} />
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-neutral-400 rtl:rotate-180" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-neutral-100 dark:border-neutral-700">
                      {category.topics.map((topic, index) => (
                        <div
                          key={topic.id}
                          className={`flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                            index !== category.topics.length - 1
                              ? 'border-b border-neutral-100 dark:border-neutral-700'
                              : ''
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 font-mono text-lg dark:bg-neutral-800">
                            {topic.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="truncate font-medium text-neutral-800 dark:text-neutral-100">
                                {getTopicDisplayName(t, topic.name)}
                              </h4>
                              <span className="text-sm" title={t('learner:tier', { level: topic.tier })}>
                                {TIER_BADGE[topic.tier]}
                              </span>
                              <Badge size="sm" className={`shrink-0 ${getStateColor(topic.state)}`}>
                                {getStateLabel(topic.state)}
                              </Badge>
                              {topic.nextReview === 'today' && (
                                <Badge
                                  size="sm"
                                  className="bg-red-100 text-[10px] text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                >
                                  {t('learner:reviewCue')}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                              <span>
                                {topic.questionsTotal} {t('learner:questions')}
                              </span>
                              {topic.questionsDue > 0 && (
                                <span className="font-medium text-primary-600 dark:text-primary-400">
                                  {topic.questionsDue} {t('learner:due')}
                                </span>
                              )}
                              {topic.lastReviewed && (
                                <span>
                                  {t('learner:lastReviewed')}: {topic.lastReviewed}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20">
                              <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                              <p className="mt-1 text-center text-xs text-neutral-500 dark:text-neutral-400">
                                {topic.progress}%
                              </p>
                            </div>
                            {practiceButton(topic)}
                            {unenrollButton(topic)}
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
      </div>
    </div>
  )
}
