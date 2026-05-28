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

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function getTopicDisplayName(t: TFunction, name?: string | null) {
  if (!name) return ''
  const key = TOPIC_KEY_BY_NAME[normalizeLabel(name)]
  return key ? t(`topics:${key}`) : name
}

export function getTopicModuleDisplayName(t: TFunction, name?: string | null) {
  if (!name || normalizeLabel(name) === 'uncategorized') {
    return t('topics:uncategorized')
  }

  return getTopicDisplayName(t, name)
}
