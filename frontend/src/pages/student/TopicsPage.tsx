<<<<<<< HEAD
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  ChevronRight, 
  ChevronDown,
  BookOpen,
  Target,
  Clock,
  Play,
  Search,
  Sparkles,
  PartyPopper,
} from 'lucide-react'
import { Card, Button, Badge, ProgressBar } from '@/components/ui'

/**
 * TopicsPage (UC-08 — View Topics: Student Dashboard & Progress)
 * 
 * Browse Discrete Mathematics topics organized by category.
 * Shows FSRS-based progress and review status for each topic.
 * 
 * UC-08 Features:
 * - "Due Today" vs "Future Reviews" categorization (Step 3)
 * - FSRS retrievability-based sorting — lowest = highest priority (Step 4)
 * - Tier badges: 🥉 Tier 1 / 🥈 Tier 2 / 🥇 Tier 3 (Step 5)
 * - "Review!" visual cue for due topics (Step 5)
 * - Search / filter bar (Alt Flow 5a)
 * - "All caught up!" state with Study Ahead / New Topics (Alt Flow 3a)
 */

interface TopicItem {
  id: string
  nameKey: string
=======
import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  Clock,
  Search,
  Filter,
  Database,
  Binary,
  Layers,
  Activity,
  Target
} from 'lucide-react'
import { Card, Button, Badge, ProgressBar } from '@/components/ui'
import { topicsService } from '@/services/topics'
import { cn } from '@/utils/cn'

/**
 * TopicsPage (Knowledge Inventory)
 * Re-imagined as a categorical specimen catalog.
 */

interface TopicItem {
  id: number
  name: string
>>>>>>> backend-updates
  icon: string
  progress: number
  questionsTotal: number
  questionsDue: number
  lastReviewed?: string
  state: 'new' | 'learning' | 'review' | 'mastered'
<<<<<<< HEAD
  /** FSRS retrievability 0–1 — lower = more urgent (UC-08 Step 4) */
  retrievability: number
  /** Scaffolding tier 1–3 (UC-08 Step 5) */
  tier: 1 | 2 | 3
  /** Next scheduled review date label */
  nextReview?: string
}

interface TopicCategory {
  id: string
  nameKey: string
  icon: string
  topics: TopicItem[]
}

// Mock topic data — includes retrievability & tier for UC-08
const topicCategories: TopicCategory[] = [
  {
    id: 'logic',
    nameKey: 'topics:logic.title',
    icon: '🔢',
    topics: [
      { id: 'propositional', nameKey: 'topics:logic.propositional', icon: '→', progress: 75, questionsTotal: 20, questionsDue: 3, lastReviewed: '2 days ago', state: 'review', retrievability: 0.62, tier: 2, nextReview: 'today' },
      { id: 'predicates', nameKey: 'topics:logic.predicates', icon: '∀', progress: 45, questionsTotal: 15, questionsDue: 5, lastReviewed: '1 week ago', state: 'learning', retrievability: 0.38, tier: 1, nextReview: 'today' },
      { id: 'quantifiers', nameKey: 'topics:logic.quantifiers', icon: '∃', progress: 20, questionsTotal: 12, questionsDue: 8, state: 'learning', retrievability: 0.25, tier: 1, nextReview: 'today' },
      { id: 'proofs', nameKey: 'topics:logic.proofTechniques', icon: '⊢', progress: 0, questionsTotal: 18, questionsDue: 0, state: 'new', retrievability: 1.0, tier: 3 },
    ],
  },
  {
    id: 'sets',
    nameKey: 'topics:sets.title',
    icon: '∪',
    topics: [
      { id: 'operations', nameKey: 'topics:sets.operations', icon: '∩', progress: 90, questionsTotal: 16, questionsDue: 1, lastReviewed: '1 day ago', state: 'mastered', retrievability: 0.92, tier: 2, nextReview: 'in 5 days' },
      { id: 'venn', nameKey: 'topics:sets.vennDiagrams', icon: '◯', progress: 60, questionsTotal: 10, questionsDue: 2, lastReviewed: '3 days ago', state: 'review', retrievability: 0.55, tier: 1, nextReview: 'today' },
      { id: 'power', nameKey: 'topics:sets.powerSets', icon: 'P', progress: 30, questionsTotal: 12, questionsDue: 6, state: 'learning', retrievability: 0.30, tier: 2, nextReview: 'today' },
      { id: 'cartesian', nameKey: 'topics:sets.cartesianProduct', icon: '×', progress: 0, questionsTotal: 14, questionsDue: 0, state: 'new', retrievability: 1.0, tier: 1 },
    ],
  },
  {
    id: 'relations',
    nameKey: 'topics:relations.title',
    icon: '≡',
    topics: [
      { id: 'properties', nameKey: 'topics:relations.properties', icon: 'R', progress: 55, questionsTotal: 18, questionsDue: 4, lastReviewed: '4 days ago', state: 'review', retrievability: 0.48, tier: 2, nextReview: 'today' },
      { id: 'equivalence', nameKey: 'topics:relations.equivalence', icon: '~', progress: 25, questionsTotal: 14, questionsDue: 7, state: 'learning', retrievability: 0.22, tier: 2, nextReview: 'today' },
      { id: 'partial', nameKey: 'topics:relations.partialOrders', icon: '≤', progress: 0, questionsTotal: 16, questionsDue: 0, state: 'new', retrievability: 1.0, tier: 3 },
      { id: 'functions', nameKey: 'topics:relations.functions', icon: 'f', progress: 10, questionsTotal: 20, questionsDue: 10, state: 'learning', retrievability: 0.15, tier: 1, nextReview: 'today' },
    ],
  },
  {
    id: 'combinatorics',
    nameKey: 'topics:combinatorics.title',
    icon: '📊',
    topics: [
      { id: 'counting', nameKey: 'topics:combinatorics.counting', icon: '#', progress: 80, questionsTotal: 14, questionsDue: 2, lastReviewed: '2 days ago', state: 'review', retrievability: 0.70, tier: 1, nextReview: 'tomorrow' },
      { id: 'permutations', nameKey: 'topics:combinatorics.permutations', icon: 'P', progress: 65, questionsTotal: 12, questionsDue: 3, lastReviewed: '5 days ago', state: 'review', retrievability: 0.50, tier: 2, nextReview: 'tomorrow' },
      { id: 'combinations', nameKey: 'topics:combinatorics.combinations', icon: 'C', progress: 40, questionsTotal: 12, questionsDue: 5, state: 'learning', retrievability: 0.35, tier: 2, nextReview: 'in 2 days' },
      { id: 'pigeonhole', nameKey: 'topics:combinatorics.pigeonhole', icon: '🕊', progress: 0, questionsTotal: 8, questionsDue: 0, state: 'new', retrievability: 1.0, tier: 3 },
    ],
  },
  {
    id: 'graphTheory',
    nameKey: 'topics:graphTheory.title',
    icon: '🔗',
    topics: [
      { id: 'basics', nameKey: 'topics:graphTheory.basics', icon: 'G', progress: 50, questionsTotal: 16, questionsDue: 4, lastReviewed: '3 days ago', state: 'review', retrievability: 0.52, tier: 1, nextReview: 'today' },
      { id: 'paths', nameKey: 'topics:graphTheory.paths', icon: '→', progress: 35, questionsTotal: 14, questionsDue: 6, state: 'learning', retrievability: 0.28, tier: 2, nextReview: 'today' },
      { id: 'trees', nameKey: 'topics:graphTheory.trees', icon: '🌳', progress: 15, questionsTotal: 12, questionsDue: 8, state: 'learning', retrievability: 0.18, tier: 2, nextReview: 'today' },
      { id: 'planarity', nameKey: 'topics:graphTheory.planarity', icon: '◇', progress: 0, questionsTotal: 10, questionsDue: 0, state: 'new', retrievability: 1.0, tier: 3 },
    ],
  },
  {
    id: 'numberTheory',
    nameKey: 'topics:numberTheory.title',
    icon: '🔢',
    topics: [
      { id: 'divisibility', nameKey: 'topics:numberTheory.divisibility', icon: '|', progress: 70, questionsTotal: 14, questionsDue: 2, lastReviewed: '1 day ago', state: 'review', retrievability: 0.78, tier: 1, nextReview: 'in 3 days' },
      { id: 'modular', nameKey: 'topics:numberTheory.modularArithmetic', icon: '%', progress: 45, questionsTotal: 16, questionsDue: 5, state: 'learning', retrievability: 0.33, tier: 2, nextReview: 'today' },
      { id: 'gcd', nameKey: 'topics:numberTheory.gcd', icon: '÷', progress: 85, questionsTotal: 10, questionsDue: 1, lastReviewed: '2 days ago', state: 'mastered', retrievability: 0.88, tier: 1, nextReview: 'in 7 days' },
      { id: 'primes', nameKey: 'topics:numberTheory.primes', icon: 'p', progress: 20, questionsTotal: 12, questionsDue: 7, state: 'learning', retrievability: 0.20, tier: 1, nextReview: 'today' },
    ],
  },
]

/** Tier badge emoji (UC-08 Step 5) */
=======
  retrievability: number
  tier: number
  nextReview?: string
  category?: string
}

>>>>>>> backend-updates
const TIER_BADGE: Record<number, string> = {
  1: '🥉',
  2: '🥈',
  3: '🥇',
}

export function TopicsPage() {
  const { t } = useTranslation(['topics', 'student', 'common'])
<<<<<<< HEAD
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['logic', 'sets']))
  const [searchQuery, setSearchQuery] = useState('')

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const getStateColor = (state: TopicItem['state']) => {
    switch (state) {
      case 'mastered': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'review': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'learning': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      case 'new': return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
    }
  }

  const getStateLabel = (state: TopicItem['state']) => {
    switch (state) {
      case 'mastered': return t('student:stateMastered')
      case 'review': return t('student:stateReview')
      case 'learning': return t('student:stateLearning')
      case 'new': return t('student:stateNew')
    }
  }

  // --- Search / filter (UC-08 Alt Flow 5a) ---
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return topicCategories
    const q = searchQuery.toLowerCase()
    return topicCategories
      .map(cat => ({
        ...cat,
        topics: cat.topics.filter(topic =>
          t(topic.nameKey).toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.topics.length > 0)
  }, [searchQuery, t])

  // --- Due Today vs Future Reviews (UC-08 Step 3) ---
  const allTopics = useMemo(() => topicCategories.flatMap(cat => cat.topics), [])

  const dueTodayTopics = useMemo(() =>
    allTopics
      .filter(t => t.nextReview === 'today')
      .sort((a, b) => a.retrievability - b.retrievability), // UC-08 Step 4: lowest retrievability first
    [allTopics]
  )

  const futureReviewTopics = useMemo(() =>
    allTopics.filter(t => t.nextReview && t.nextReview !== 'today' && t.state !== 'new'),
    [allTopics]
  )

  const newTopics = useMemo(() =>
    allTopics.filter(t => t.state === 'new'),
    [allTopics]
  )

  // Calculate overall stats
  const totalTopics = allTopics.length
  const topicsDue = dueTodayTopics.length
  const avgProgress = Math.round(
    allTopics.reduce((sum, t) => sum + t.progress, 0) / totalTopics
  )

  // UC-08 Alt Flow 3a: All caught up?
  const allCaughtUp = topicsDue === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
          {t('topics:discreteMath')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          {t('student:browseTopics')}
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{totalTopics}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:totalTopics')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{topicsDue}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:dueForReview')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
              <Target className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{avgProgress}%</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:avgProgress')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search bar (UC-08 Alt Flow 5a) */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('student:searchTopics')}
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
        />
      </div>

      {/* ═══ All Caught Up state (UC-08 Alt Flow 3a) ═══ */}
      {allCaughtUp ? (
        <Card className="text-center py-8">
          <div className="flex flex-col items-center gap-3">
            <PartyPopper className="w-12 h-12 text-primary-500" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
              {t('student:allCaughtUp')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
              {t('student:allCaughtUpDescription')}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {futureReviewTopics.length > 0 && (
                <Link to="/student/practice">
                  <Button variant="outline" leftIcon={<Sparkles className="w-4 h-4" />}>
                    {t('student:studyAhead')}
                  </Button>
                </Link>
              )}
              {newTopics.length > 0 && (
                <Link to="/student/practice">
                  <Button leftIcon={<BookOpen className="w-4 h-4" />}>
                    {t('student:exploreNewTopics', { count: newTopics.length })}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      ) : (
        /* Start practice CTA — only when topics are due */
        <Card className="bg-linear-to-r from-primary-500 to-primary-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{t('student:topicsProgress', { due: topicsDue })}</p>
              <p className="text-sm text-primary-100">{t('student:keepKnowledgeFresh')}</p>
            </div>
            <Link to="/student/practice">
              <Button 
                variant="outline" 
                className="border-white/50 dark:border-white/50 text-white hover:bg-white/20 hover:border-white/70 dark:hover:bg-white/20 dark:hover:border-white/70"
                leftIcon={<Play className="w-4 h-4" />}
              >
                {t('student:startSession')}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ═══ Due Today section (UC-08 Step 3) — sorted by retrievability ═══ */}
      {dueTodayTopics.length > 0 && !searchQuery && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
            {t('student:dueToday')}
            <Badge variant="primary" size="sm">{dueTodayTopics.length}</Badge>
          </h2>
          <div className="space-y-2">
            {dueTodayTopics.map(topic => (
              <Card key={topic.id} padding="sm" className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-mono shrink-0">
                    {topic.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                        {t(topic.nameKey)}
                      </h4>
                      {/* Tier badge (UC-08 Step 5) */}
                      <span className="text-sm" title={t('student:tier', { level: topic.tier })}>
                        {TIER_BADGE[topic.tier]}
                      </span>
                      <Badge size="sm" className={getStateColor(topic.state)}>
                        {getStateLabel(topic.state)}
                      </Badge>
                      {/* "Review!" cue (UC-08 Step 5) */}
                      <Badge size="sm" variant="primary" className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse">
                        {t('student:reviewCue')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      <span>{topic.questionsTotal} {t('student:questions')}</span>
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        {topic.questionsDue} {t('student:due')}
                      </span>
                      <span>{t('student:retrievabilityLabel')}: {Math.round(topic.retrievability * 100)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1">{topic.progress}%</p>
                    </div>
                    <Link to={`/student/practice?topic=${topic.id}`}>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Future Reviews section (UC-08 Step 3) ═══ */}
      {futureReviewTopics.length > 0 && !searchQuery && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t('student:futureReviews')}
            <Badge variant="default" size="sm">{futureReviewTopics.length}</Badge>
          </h2>
          <div className="space-y-2">
            {futureReviewTopics.map(topic => (
              <Card key={topic.id} padding="sm" className="opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-mono shrink-0">
                    {topic.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                        {t(topic.nameKey)}
                      </h4>
                      <span className="text-sm" title={t('student:tier', { level: topic.tier })}>
                        {TIER_BADGE[topic.tier]}
                      </span>
                      <Badge size="sm" className={getStateColor(topic.state)}>
                        {getStateLabel(topic.state)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      <span>{topic.questionsTotal} {t('student:questions')}</span>
                      <span>{t('student:nextReviewIn')}: {topic.nextReview}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1">{topic.progress}%</p>
                    </div>
                    <Link to={`/student/practice?topic=${topic.id}`}>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Browse by category (with search filtering) ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
          {t('student:browseByCategory')}
        </h2>
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <Card className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                <p className="text-neutral-500 dark:text-neutral-400">{t('common:noResults')}</p>
              </div>
            </Card>
          ) : (
            filteredCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id)
              const categoryProgress = Math.round(
                category.topics.reduce((sum, t) => sum + t.progress, 0) / category.topics.length
              )
              const categoryDue = category.topics.filter(t => t.questionsDue > 0).length

              return (
                <Card key={category.id} className="overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <div className="flex-1 text-start">
                      <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{t(category.nameKey)}</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t('student:categoryInfo', { count: category.topics.length, progress: categoryProgress })}
                        {categoryDue > 0 && (
                          <span className="text-primary-600 dark:text-primary-400 ms-2">
                            · {t('student:categoryDue', { count: categoryDue })}
                          </span>
                        )}
                      </p>
                    </div>
                    <ProgressBar value={categoryProgress} size="sm" className="w-24" showLabel={false} />
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-neutral-400 rtl:rotate-180" />
                    )}
                  </button>

                  {/* Topic list */}
                  {isExpanded && (
                    <div className="border-t border-neutral-100 dark:border-neutral-700">
                      {category.topics.map((topic, index) => (
                        <div
                          key={topic.id}
                          className={`p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                            index !== category.topics.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
                          }`}
                        >
                          <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-mono shrink-0">
                            {topic.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">{t(topic.nameKey)}</h4>
                              {/* Tier badge (UC-08 Step 5) */}
                              <span className="text-sm" title={t('student:tier', { level: topic.tier })}>
                                {TIER_BADGE[topic.tier]}
                              </span>
                              <Badge size="sm" className={`shrink-0 ${getStateColor(topic.state)}`}>
                                {getStateLabel(topic.state)}
                              </Badge>
                              {/* "Review!" cue for due topics */}
                              {topic.nextReview === 'today' && (
                                <Badge size="sm" className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px]">
                                  {t('student:reviewCue')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              <span>{topic.questionsTotal} {t('student:questions')}</span>
                              {topic.questionsDue > 0 && (
                                <span className="text-primary-600 dark:text-primary-400 font-medium">
                                  {topic.questionsDue} {t('student:due')}
                                </span>
                              )}
                              {topic.lastReviewed && (
                                <span>{t('student:lastReviewed')}: {topic.lastReviewed}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20">
                              <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1">{topic.progress}%</p>
                            </div>
                            <Link to={`/student/practice?topic=${topic.id}`}>
                              <Button variant="ghost" size="sm">
                                <Play className="w-4 h-4" />
                              </Button>
                            </Link>
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
=======
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsData, masteryData] = await Promise.all([
          topicsService.getTopics(),
          topicsService.getTopicMastery()
        ])

        const merged: TopicItem[] = topicsData.map((topic: any) => {
          const m: any = masteryData.find((item: any) => item.topic === topic.id) || {}
          return {
            id: topic.id,
            name: topic.name,
            icon: topic.icon || '📚',
            category: topic.category || 'General',
            tier: topic.tier || 1,
            progress: m.mastery_score ? Math.round(m.mastery_score * 100) : 0,
            questionsTotal: topic.questions_count || 0,
            questionsDue: m.items_due || 0,
            retrievability: m.retrievability || 1.0,
            state: (m.mastery_score > 0.9) ? 'mastered' : (m.mastery_score > 0.4 ? 'review' : (m.mastery_score > 0 ? 'learning' : 'new')),
            nextReview: m.next_review ? new Date(m.next_review).toLocaleDateString() : undefined
          }
        })
        setTopics(merged)
      } catch (err) {
        console.error("Failed to fetch topics", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const categories = useMemo(() => {
    const grouped: Record<string, TopicItem[]> = {}
    topics.forEach(topic => {
      const cat = topic.category || 'Fundamental Core'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(topic)
    })
    return Object.entries(grouped).map(([name, topicList]) => ({
      name,
      topics: topicList
    }))
  }, [topics])

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return categories
      .map(cat => ({
        ...cat,
        topics: cat.topics.filter(topic => topic.name.toLowerCase().includes(q))
      }))
      .filter(cat => cat.topics.length > 0)
  }, [searchQuery, categories])

  const totals = useMemo(() => {
    const due = topics.filter(t => t.questionsDue > 0).length
    const avg = topics.length ? Math.round(topics.reduce((s, t) => s + t.progress, 0) / topics.length) : 0
    return { due, avg, total: topics.length }
  }, [topics])

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
         <div className="w-16 h-16 border-4 border-primary-500/20 rounded-full" />
         <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px]">Accessing Knowledge Inventory</p>
    </div>
  )

  return (
    <div className="stagger-in space-y-12 pb-20 pt-4">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-neutral-200 dark:border-neutral-800 pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-primary-600 rounded-full" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Library 04 // Concepts</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight text-neutral-950 dark:text-white leading-none">
            Knowledge <br/>Inventory<span className="text-primary-600">.</span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            A comprehensive matrix of your subject mastery. Review specimens categorized by retrievability and scheduled priority.
          </p>
        </div>

        <div className="flex gap-4">
           <div className="p-8 bg-neutral-900 rounded-[2rem] text-white flex flex-col justify-between h-48 w-48 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-scanline opacity-10" />
              <Activity className="w-8 h-8 text-primary-500 animate-pulse" />
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Active Queue</p>
                 <p className="text-4xl font-black">{totals.due}</p>
              </div>
           </div>
           <div className="p-8 bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between h-48 w-48 shadow-sm">
              <Target className="w-8 h-8 text-secondary-500" />
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Global Mastery</p>
                 <p className="text-4xl font-black text-neutral-900 dark:text-white">{totals.avg}%</p>
              </div>
           </div>
        </div>
      </div>

      {/* Action Controller */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search specimen index..." 
            className="w-full h-20 pl-16 pr-8 bg-neutral-100 dark:bg-neutral-900 rounded-[1.5rem] border-0 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-primary-500/50 transition-all outline-hidden text-xl font-bold tracking-tight shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="h-20 px-8 rounded-[1.5rem] bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 border-0 flex gap-4 shadow-xl">
           <Filter className="w-6 h-6" />
           <span className="font-black uppercase tracking-widest text-xs">Filter Matrix</span>
        </Button>
      </div>

      {/* Categorized Specimens */}
      <div className="space-y-20">
        {filteredCategories.map(category => (
          <div key={category.name} className="space-y-8">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                  <Database className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                    {category.name}
                  </h3>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{category.topics.length} Specimen in Sector</p>
               </div>
               <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.topics.map(topic => (
                <Link key={topic.id} to={`/student/practice?topic=${topic.id}`} className="block group">
                  <Card className="glass group-hover:border-primary-500/50 transition-all border-neutral-200/50 dark:border-neutral-800/50 rounded-[2.5rem] overflow-hidden flex flex-col h-full bg-lab">
                    {/* Header Area */}
                    <div className="p-8 pb-4 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-16 rounded-3xl bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center text-4xl shadow-2xl group-hover:bg-primary-600 group-hover:scale-110 transition-all duration-500">
                           <Layers className="w-8 h-8 text-white opacity-80" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <Badge className={cn(
                              "font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest",
                              topic.state === 'mastered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              topic.state === 'new' ? 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20' :
                              'bg-primary-500/10 text-primary-500 border-primary-500/20'
                           )}>
                              {topic.state}
                           </Badge>
                           <span className="text-lg opacity-80">{TIER_BADGE[topic.tier]}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-black text-primary-500 uppercase tracking-widest">
                           <Binary className="w-3 h-3" />
                           <span>Item ID: TK-{topic.id.toString().padStart(3, '0')}</span>
                        </div>
                        <h4 className="text-2xl font-black font-display tracking-tight text-neutral-900 dark:text-white leading-tight">
                          {topic.name}
                        </h4>
                      </div>
                    </div>

                    {/* Meta Data */}
                    <div className="flex-1 p-8 pt-4 space-y-6">
                       <div className="grid grid-cols-2 gap-4 border-y border-neutral-100 dark:border-neutral-800 py-6">
                          <div>
                             <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Stability</p>
                             <p className="text-xl font-black text-neutral-800 dark:text-neutral-100">{topic.progress}%</p>
                          </div>
                          <div className="text-end">
                             <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Retrievability</p>
                             <p className={cn(
                                "text-xl font-black",
                                topic.retrievability < 0.7 ? "text-amber-500" : "text-primary-600"
                             )}>{Math.round(topic.retrievability * 100)}%</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <ProgressBar 
                            value={topic.retrievability * 100} 
                            className="h-1.5 bg-neutral-100 dark:bg-neutral-800" 
                            indicatorClassName={topic.retrievability < 0.7 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"}
                          />
                          
                          <div className="flex items-center justify-between gap-4">
                             <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {topic.nextReview ? <span>{topic.nextReview}</span> : 'Standby'}
                             </div>
                             <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                {topic.questionsTotal} Items
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-2 pt-0 px-8 pb-8">
                       <Button fullWidth className="h-14 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg group-hover:bg-primary-600 group-hover:text-white transition-all">
                          Initiate Sequence
                       </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-32 rounded-[3.5rem] bg-neutral-100 dark:bg-neutral-900/50 border-2 border-dashed border-neutral-200 dark:border-neutral-800">
           <Search className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-6" />
           <h3 className="text-3xl font-black text-neutral-800 dark:text-white uppercase tracking-tight">Zero Matches</h3>
           <p className="text-neutral-500 font-medium mt-2">The requested concept is not in our current inventory.</p>
           <Button variant="outline" className="mt-10 h-14 px-10 rounded-2xl border-neutral-300 font-black uppercase tracking-widest text-xs" onClick={() => setSearchQuery('')}>
              Reset Inventory Filter
           </Button>
        </div>
      )}
>>>>>>> backend-updates
    </div>
  )
}
