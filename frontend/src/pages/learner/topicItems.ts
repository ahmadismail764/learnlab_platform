import type { BackendSubtopic, TopicMastery } from '@/services/topics'

/**
 * Shared topic-card model for the learner Topics page.
 *
 * A "topic" in the UI is a backend subtopic; a "category" is the parent backend
 * topic. `buildTopicItems` turns raw subtopics + FSRS mastery rows into the
 * display model used by both the enrolled (My Topics) view and any grouped list.
 */

export const TIER_BADGE: Record<number, string> = {
  1: '🥉',
  2: '🥈',
  3: '🥇',
}

export interface TopicItem {
  id: string
  name: string
  nameKey: string
  description: string
  category: string
  icon: string
  progress: number
  questionsTotal: number
  questionsDue: number
  lastReviewed?: string
  state: 'new' | 'learning' | 'review' | 'mastered'
  memory: number
  tier: 1 | 2 | 3
  nextReview?: string
}

export interface TopicCategoryGroup {
  id: string
  nameKey: string
  icon: string
  topics: TopicItem[]
}

const CATEGORY_ICONS: Record<string, string> = {
  Logic: '🧠',
  Sets: '∪',
  Relations: '≡',
  Combinatorics: '🎲',
  'Graph Theory': '🔗',
  'Number Theory': '🧮',
  Uncategorized: '📝',
}

function iconForCategory(categoryName: string): string {
  const category = categoryName.toLowerCase()
  if (category.includes('logic')) return '🔢'
  if (category.includes('set')) return '∪'
  if (category.includes('relation')) return '≡'
  if (category.includes('combinatorics')) return '📊'
  if (category.includes('graph')) return '🔗'
  if (category.includes('number')) return '🔢'
  return '📝'
}

function tierForName(nameLower: string): 1 | 2 | 3 {
  if (
    nameLower.includes('proof') ||
    nameLower.includes('partial') ||
    nameLower.includes('pigeon') ||
    nameLower.includes('planar')
  ) {
    return 3
  }
  if (
    nameLower.includes('propositional') ||
    nameLower.includes('operation') ||
    nameLower.includes('power') ||
    nameLower.includes('equivalence') ||
    nameLower.includes('permut') ||
    nameLower.includes('combin') ||
    nameLower.includes('path') ||
    nameLower.includes('tree') ||
    nameLower.includes('modular')
  ) {
    return 2
  }
  return 1
}

function nameKeyForName(nameLower: string, fallback: string): string {
  if (nameLower.includes('propositional')) return 'logic.propositional'
  if (nameLower.includes('predicate')) return 'logic.predicates'
  if (nameLower.includes('proof')) return 'logic.proofTechniques'
  if (nameLower.includes('quantifier')) return 'logic.quantifiers'
  if (nameLower.includes('cartesian')) return 'sets.cartesianProduct'
  if (nameLower.includes('operation')) return 'sets.operations'
  if (nameLower.includes('power')) return 'sets.powerSets'
  if (nameLower.includes('venn')) return 'sets.vennDiagrams'
  if (nameLower.includes('equivalence')) return 'relations.equivalence'
  if (nameLower.includes('function')) return 'relations.functions'
  if (nameLower.includes('partial')) return 'relations.partialOrders'
  if (nameLower.includes('properties')) return 'relations.properties'
  if (nameLower.includes('counting')) return 'combinatorics.counting'
  if (nameLower.includes('permut')) return 'combinatorics.permutations'
  if (nameLower.includes('combin')) return 'combinatorics.combinations'
  if (nameLower.includes('pigeon')) return 'combinatorics.pigeonhole'
  if (nameLower.includes('basic') || nameLower.includes('definition')) return 'graphTheory.basics'
  if (nameLower.includes('path') || nameLower.includes('cycle')) return 'graphTheory.paths'
  if (nameLower.includes('planar')) return 'graphTheory.planarity'
  if (nameLower.includes('tree')) return 'graphTheory.trees'
  if (nameLower.includes('divis')) return 'numberTheory.divisibility'
  if (nameLower.includes('modular')) return 'numberTheory.modularArithmetic'
  if (nameLower.includes('gcd')) return 'numberTheory.gcd'
  if (nameLower.includes('prime')) return 'numberTheory.primes'
  return fallback
}

/** Map raw subtopics + FSRS mastery rows into display topic items. */
export function buildTopicItems(
  subtopics: BackendSubtopic[],
  masteries: TopicMastery[],
): TopicItem[] {
  return subtopics.map((s): TopicItem => {
    const m = masteries.find((mastery) => mastery.subtopic === s.id)
    const categoryName = s.topic_name || 'Uncategorized'
    const nameLower = s.name.toLowerCase()

    let progress = 0
    let questionsDue = 0
    let lastReviewed: string | undefined
    let state: TopicItem['state'] = 'new'
    let memory = 1.0
    let nextReview: string | undefined

    if (m) {
      const isDue = Boolean(m.next_due && new Date(m.next_due) <= new Date())
      lastReviewed = m.last_reviewed ? new Date(m.last_reviewed).toLocaleDateString() : undefined

      if (m.status === 'learned') state = isDue ? 'review' : 'mastered'
      else if (m.status === 'struggling') state = 'review'
      else if (m.status === 'learning') state = 'learning'
      else if (m.status === 'new') state = 'new'

      progress = Math.round((m.memory || 0) * 100)
      questionsDue = isDue ? 5 : 0
      memory = m.memory || 0
      nextReview = isDue ? 'today' : m.next_due ? new Date(m.next_due).toLocaleDateString() : undefined
    }

    return {
      id: s.id.toString(),
      name: s.name,
      nameKey: nameKeyForName(nameLower, s.name),
      description: s.description,
      category: categoryName,
      icon: iconForCategory(categoryName),
      progress,
      questionsTotal: s.question_count ?? 10,
      questionsDue,
      lastReviewed,
      state,
      memory,
      tier: tierForName(nameLower),
      nextReview,
    }
  })
}

/** Group topic items by their category (parent backend topic). */
export function groupTopicsByCategory(topics: TopicItem[]): TopicCategoryGroup[] {
  const groups: Record<string, TopicItem[]> = {}
  for (const topic of topics) {
    ;(groups[topic.category] ??= []).push(topic)
  }

  return Object.entries(groups).map(([name, groupTopics]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    nameKey: name,
    icon: CATEGORY_ICONS[name] ?? '📝',
    topics: groupTopics,
  }))
}
