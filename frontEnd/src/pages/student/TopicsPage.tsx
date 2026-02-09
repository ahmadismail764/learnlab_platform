import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  ChevronRight, 
  ChevronDown,
  BookOpen,
  Target,
  Clock,
  Play
} from 'lucide-react'
import { Card, Button, Badge, ProgressBar } from '@/components/ui'

/**
 * TopicsPage
 * 
 * Browse Discrete Mathematics topics organized by category.
 * Shows FSRS-based progress and review status for each topic.
 */

interface TopicItem {
  id: string
  nameKey: string
  icon: string
  progress: number
  questionsTotal: number
  questionsDue: number
  lastReviewed?: string
  state: 'new' | 'learning' | 'review' | 'mastered'
}

interface TopicCategory {
  id: string
  nameKey: string
  icon: string
  topics: TopicItem[]
}

// Mock topic data - will come from API with FSRS data
const topicCategories: TopicCategory[] = [
  {
    id: 'logic',
    nameKey: 'topics:logic.title',
    icon: '🔢',
    topics: [
      { id: 'propositional', nameKey: 'topics:logic.propositional', icon: '→', progress: 75, questionsTotal: 20, questionsDue: 3, lastReviewed: '2 days ago', state: 'review' },
      { id: 'predicates', nameKey: 'topics:logic.predicates', icon: '∀', progress: 45, questionsTotal: 15, questionsDue: 5, lastReviewed: '1 week ago', state: 'learning' },
      { id: 'quantifiers', nameKey: 'topics:logic.quantifiers', icon: '∃', progress: 20, questionsTotal: 12, questionsDue: 8, state: 'learning' },
      { id: 'proofs', nameKey: 'topics:logic.proofTechniques', icon: '⊢', progress: 0, questionsTotal: 18, questionsDue: 0, state: 'new' },
    ],
  },
  {
    id: 'sets',
    nameKey: 'topics:sets.title',
    icon: '∪',
    topics: [
      { id: 'operations', nameKey: 'topics:sets.operations', icon: '∩', progress: 90, questionsTotal: 16, questionsDue: 1, lastReviewed: '1 day ago', state: 'mastered' },
      { id: 'venn', nameKey: 'topics:sets.vennDiagrams', icon: '◯', progress: 60, questionsTotal: 10, questionsDue: 2, lastReviewed: '3 days ago', state: 'review' },
      { id: 'power', nameKey: 'topics:sets.powerSets', icon: 'P', progress: 30, questionsTotal: 12, questionsDue: 6, state: 'learning' },
      { id: 'cartesian', nameKey: 'topics:sets.cartesianProduct', icon: '×', progress: 0, questionsTotal: 14, questionsDue: 0, state: 'new' },
    ],
  },
  {
    id: 'relations',
    nameKey: 'topics:relations.title',
    icon: '≡',
    topics: [
      { id: 'properties', nameKey: 'topics:relations.properties', icon: 'R', progress: 55, questionsTotal: 18, questionsDue: 4, lastReviewed: '4 days ago', state: 'review' },
      { id: 'equivalence', nameKey: 'topics:relations.equivalence', icon: '~', progress: 25, questionsTotal: 14, questionsDue: 7, state: 'learning' },
      { id: 'partial', nameKey: 'topics:relations.partialOrders', icon: '≤', progress: 0, questionsTotal: 16, questionsDue: 0, state: 'new' },
      { id: 'functions', nameKey: 'topics:relations.functions', icon: 'f', progress: 10, questionsTotal: 20, questionsDue: 10, state: 'learning' },
    ],
  },
  {
    id: 'combinatorics',
    nameKey: 'topics:combinatorics.title',
    icon: '📊',
    topics: [
      { id: 'counting', nameKey: 'topics:combinatorics.counting', icon: '#', progress: 80, questionsTotal: 14, questionsDue: 2, lastReviewed: '2 days ago', state: 'review' },
      { id: 'permutations', nameKey: 'topics:combinatorics.permutations', icon: 'P', progress: 65, questionsTotal: 12, questionsDue: 3, lastReviewed: '5 days ago', state: 'review' },
      { id: 'combinations', nameKey: 'topics:combinatorics.combinations', icon: 'C', progress: 40, questionsTotal: 12, questionsDue: 5, state: 'learning' },
      { id: 'pigeonhole', nameKey: 'topics:combinatorics.pigeonhole', icon: '🕊', progress: 0, questionsTotal: 8, questionsDue: 0, state: 'new' },
    ],
  },
  {
    id: 'graphTheory',
    nameKey: 'topics:graphTheory.title',
    icon: '🔗',
    topics: [
      { id: 'basics', nameKey: 'topics:graphTheory.basics', icon: 'G', progress: 50, questionsTotal: 16, questionsDue: 4, lastReviewed: '3 days ago', state: 'review' },
      { id: 'paths', nameKey: 'topics:graphTheory.paths', icon: '→', progress: 35, questionsTotal: 14, questionsDue: 6, state: 'learning' },
      { id: 'trees', nameKey: 'topics:graphTheory.trees', icon: '🌳', progress: 15, questionsTotal: 12, questionsDue: 8, state: 'learning' },
      { id: 'planarity', nameKey: 'topics:graphTheory.planarity', icon: '◇', progress: 0, questionsTotal: 10, questionsDue: 0, state: 'new' },
    ],
  },
  {
    id: 'numberTheory',
    nameKey: 'topics:numberTheory.title',
    icon: '🔢',
    topics: [
      { id: 'divisibility', nameKey: 'topics:numberTheory.divisibility', icon: '|', progress: 70, questionsTotal: 14, questionsDue: 2, lastReviewed: '1 day ago', state: 'review' },
      { id: 'modular', nameKey: 'topics:numberTheory.modularArithmetic', icon: '%', progress: 45, questionsTotal: 16, questionsDue: 5, state: 'learning' },
      { id: 'gcd', nameKey: 'topics:numberTheory.gcd', icon: '÷', progress: 85, questionsTotal: 10, questionsDue: 1, lastReviewed: '2 days ago', state: 'mastered' },
      { id: 'primes', nameKey: 'topics:numberTheory.primes', icon: 'p', progress: 20, questionsTotal: 12, questionsDue: 7, state: 'learning' },
    ],
  },
]

export function TopicsPage() {
  const { t } = useTranslation(['topics', 'student', 'common'])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['logic', 'sets']))

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
      case 'mastered': return 'Mastered'
      case 'review': return 'Review'
      case 'learning': return 'Learning'
      case 'new': return 'New'
    }
  }

  // Calculate overall stats
  const totalTopics = topicCategories.reduce((sum, cat) => sum + cat.topics.length, 0)
  const topicsDue = topicCategories.reduce((sum, cat) => 
    sum + cat.topics.filter(t => t.questionsDue > 0).length, 0
  )
  const avgProgress = Math.round(
    topicCategories.reduce((sum, cat) => 
      sum + cat.topics.reduce((s, t) => s + t.progress, 0), 0
    ) / totalTopics
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
          {t('topics:discreteMath')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Browse and practice topics
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Topics</p>
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Due for Review</p>
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Avg Progress</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Start practice CTA */}
      {topicsDue > 0 && (
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{topicsDue} topics due for review</p>
              <p className="text-sm text-primary-100">Keep your knowledge fresh with spaced repetition</p>
            </div>
            <Link to="/student/practice">
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                leftIcon={<Play className="w-4 h-4" />}
              >
                Start Practice
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Topic categories */}
      <div className="space-y-6">
        {topicCategories.map((category) => {
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
                    {category.topics.length} topics • {categoryProgress}% complete
                    {categoryDue > 0 && (
                      <span className="text-primary-600 dark:text-primary-400 ms-2">• {categoryDue} due</span>
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
                      <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-mono">
                        {topic.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-neutral-800 dark:text-neutral-100">{t(topic.nameKey)}</h4>
                          <Badge size="sm" className={getStateColor(topic.state)}>
                            {getStateLabel(topic.state)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>{topic.questionsTotal} questions</span>
                          {topic.questionsDue > 0 && (
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                              {topic.questionsDue} due
                            </span>
                          )}
                          {topic.lastReviewed && (
                            <span>Last: {topic.lastReviewed}</span>
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
        })}
      </div>
    </div>
  )
}
