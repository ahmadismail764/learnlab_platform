import type { TFunction } from 'i18next'

const TOPIC_KEY_BY_NAME: Record<string, string> = {
  logic: 'logic.title',
  'propositions and connectives': 'logic.propositionsConnectives',
  'propositional logic': 'logic.propositional',
  'predicate logic': 'logic.predicates',
  'proof techniques': 'logic.proofTechniques',
  quantifiers: 'logic.quantifiers',
  sets: 'sets.title',
  'set theory': 'sets.title',
  'cartesian product': 'sets.cartesianProduct',
  'set identities': 'sets.identities',
  'set operations': 'sets.operations',
  'power sets': 'sets.powerSets',
  'venn diagrams': 'sets.vennDiagrams',
  relations: 'relations.title',
  functions: 'relations.functions',
  'equivalence relations': 'relations.equivalence',
  'partial orders': 'relations.partialOrders',
  'relation properties': 'relations.properties',
  combinatorics: 'combinatorics.title',
  combinations: 'combinatorics.combinations',
  permutations: 'combinatorics.permutations',
  'counting principles': 'combinatorics.counting',
  'pigeonhole principle': 'combinatorics.pigeonhole',
  'graph theory': 'graphTheory.title',
  'graph basics': 'graphTheory.basics',
  'graphs and degrees': 'graphTheory.graphsDegrees',
  'paths & circuits': 'graphTheory.paths',
  planarity: 'graphTheory.planarity',
  trees: 'graphTheory.trees',
  'number theory': 'numberTheory.title',
  divisibility: 'numberTheory.divisibility',
  'divisibility and gcd': 'numberTheory.divisibilityGcd',
  'modular arithmetic': 'numberTheory.modularArithmetic',
  'gcd & lcm': 'numberTheory.gcd',
  'prime numbers': 'numberTheory.primes',
}

const CATEGORY_BY_TOPIC_KEY_PREFIX: Record<string, string> = {
  logic: 'Logic',
  sets: 'Sets',
  relations: 'Relations',
  combinatorics: 'Combinatorics',
  graphTheory: 'Graph Theory',
  numberTheory: 'Number Theory',
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function getTopicDisplayName(t: TFunction, name?: string | null) {
  if (!name) return ''
  const key = TOPIC_KEY_BY_NAME[normalizeLabel(name)]
  return key ? t(`topics:${key}`) : name
}

export function getTopicCategoryName(name?: string | null) {
  if (!name) return 'Uncategorized'

  const normalizedName = normalizeLabel(name)
  const topicKey = TOPIC_KEY_BY_NAME[normalizedName]
  const prefix = topicKey?.split('.')[0]
  if (prefix && CATEGORY_BY_TOPIC_KEY_PREFIX[prefix]) {
    return CATEGORY_BY_TOPIC_KEY_PREFIX[prefix]
  }

  if (normalizedName.includes('logic') || normalizedName.includes('proof') || normalizedName.includes('quantifier')) {
    return 'Logic'
  }
  if (normalizedName.includes('set') || normalizedName.includes('venn') || normalizedName.includes('cartesian')) {
    return 'Sets'
  }
  if (normalizedName.includes('relation') || normalizedName.includes('function') || normalizedName.includes('order')) {
    return 'Relations'
  }
  if (
    normalizedName.includes('counting') ||
    normalizedName.includes('permut') ||
    normalizedName.includes('combin') ||
    normalizedName.includes('pigeon')
  ) {
    return 'Combinatorics'
  }
  if (
    normalizedName.includes('graph') ||
    normalizedName.includes('path') ||
    normalizedName.includes('cycle') ||
    normalizedName.includes('planar') ||
    normalizedName.includes('tree')
  ) {
    return 'Graph Theory'
  }
  if (
    normalizedName.includes('number') ||
    normalizedName.includes('divis') ||
    normalizedName.includes('modular') ||
    normalizedName.includes('gcd') ||
    normalizedName.includes('prime')
  ) {
    return 'Number Theory'
  }

  return 'Uncategorized'
}

export function getTopicCategoryDisplayName(t: TFunction, name?: string | null) {
  if (!name || normalizeLabel(name) === 'uncategorized') {
    return t('topics:uncategorized')
  }

  return getTopicDisplayName(t, name)
}
