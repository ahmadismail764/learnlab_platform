/**
 * Sample Questions Data
 * 
 * Mock questions for Discrete Mathematics topics.
 * 2 questions per topic for demonstration purposes.
 * 
 * Note: Question content is in English only - translation not required
 * as per requirements (mathematical content is universal).
 */

import type { Question, DifficultyTier } from '@/types'

export interface SampleQuestion extends Omit<Question, 'createdBy' | 'createdAt' | 'updatedAt' | 'status'> {
  topicKey: string // Translation key for topic name display
}

// ============================================
// Logic Questions
// ============================================

const logicQuestions: SampleQuestion[] = [
  {
    id: 'logic-1',
    topicId: 'propositional-logic',
    topicKey: 'topics:logic.propositional',
    tier: 1,
    content: 'If P = "It is raining" and Q = "The ground is wet", write the symbolic form of: "If it is raining, then the ground is wet."',
    answerType: 'multiple-choice',
    correctAnswer: 'P → Q',
    solutionSteps: [
      { order: 1, content: 'Identify the hypothesis: "It is raining" = P' },
      { order: 2, content: 'Identify the conclusion: "The ground is wet" = Q' },
      { order: 3, content: 'The implication "If P then Q" is written as P → Q' },
    ],
    hints: ['An implication has the form "If ... then ..."', 'The arrow symbol → represents implication'],
    xpReward: 10,
    estimatedTime: 60,
  },
  {
    id: 'logic-2',
    topicId: 'propositional-logic',
    topicKey: 'topics:logic.propositional',
    tier: 2,
    content: 'Determine the truth value of (P ∧ Q) → P when P is TRUE and Q is FALSE.',
    answerType: 'multiple-choice',
    correctAnswer: 'TRUE',
    solutionSteps: [
      { order: 1, content: 'First evaluate P ∧ Q: TRUE ∧ FALSE = FALSE' },
      { order: 2, content: 'Then evaluate FALSE → TRUE' },
      { order: 3, content: 'An implication is TRUE when the hypothesis is FALSE' },
      { order: 4, content: 'Therefore (P ∧ Q) → P = TRUE' },
    ],
    hints: ['Evaluate the conjunction first', 'Remember: FALSE → anything is TRUE'],
    xpReward: 20,
    estimatedTime: 90,
  },
]

// ============================================
// Set Theory Questions
// ============================================

const setQuestions: SampleQuestion[] = [
  {
    id: 'sets-1',
    topicId: 'set-operations',
    topicKey: 'topics:sets.operations',
    tier: 1,
    content: 'Given A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, find A ∩ B (intersection).',
    answerType: 'multiple-choice',
    correctAnswer: '{3, 4}',
    solutionSteps: [
      { order: 1, content: 'The intersection A ∩ B contains elements that are in BOTH sets' },
      { order: 2, content: 'Elements in A: 1, 2, 3, 4' },
      { order: 3, content: 'Elements in B: 3, 4, 5, 6' },
      { order: 4, content: 'Common elements: 3 and 4' },
      { order: 5, content: 'Therefore A ∩ B = {3, 4}' },
    ],
    hints: ['Intersection means elements in both sets', 'Look for numbers that appear in both A and B'],
    xpReward: 10,
    estimatedTime: 45,
  },
  {
    id: 'sets-2',
    topicId: 'power-sets',
    topicKey: 'topics:sets.powerSets',
    tier: 2,
    content: 'How many elements are in the power set of A = {a, b, c}?',
    answerType: 'multiple-choice',
    correctAnswer: '8',
    solutionSteps: [
      { order: 1, content: 'The power set P(A) contains all subsets of A' },
      { order: 2, content: 'If |A| = n, then |P(A)| = 2ⁿ' },
      { order: 3, content: 'Here |A| = 3, so |P(A)| = 2³ = 8' },
      { order: 4, content: 'The subsets are: ∅, {a}, {b}, {c}, {a,b}, {a,c}, {b,c}, {a,b,c}' },
    ],
    hints: ['Power set formula: 2ⁿ where n is the number of elements', 'Count the elements in set A first'],
    xpReward: 20,
    estimatedTime: 60,
  },
]

// ============================================
// Relations Questions
// ============================================

const relationsQuestions: SampleQuestion[] = [
  {
    id: 'relations-1',
    topicId: 'relation-properties',
    topicKey: 'topics:relations.properties',
    tier: 1,
    content: 'Is the relation R = {(1,1), (2,2), (3,3)} on set A = {1,2,3} reflexive?',
    answerType: 'true-false',
    correctAnswer: 'true',
    solutionSteps: [
      { order: 1, content: 'A relation is reflexive if (a,a) ∈ R for all a ∈ A' },
      { order: 2, content: 'Check: Is (1,1) ∈ R? Yes ✓' },
      { order: 3, content: 'Check: Is (2,2) ∈ R? Yes ✓' },
      { order: 4, content: 'Check: Is (3,3) ∈ R? Yes ✓' },
      { order: 5, content: 'All elements are related to themselves, so R is reflexive' },
    ],
    hints: ['Reflexive means every element is related to itself', 'Check if (a,a) exists for each a in A'],
    xpReward: 10,
    estimatedTime: 45,
  },
  {
    id: 'relations-2',
    topicId: 'equivalence-relations',
    topicKey: 'topics:relations.equivalence',
    tier: 2,
    content: 'For the relation "has the same remainder when divided by 3" on integers, what is the equivalence class of 5?',
    answerType: 'multiple-choice',
    correctAnswer: '{..., -4, -1, 2, 5, 8, 11, ...}',
    solutionSteps: [
      { order: 1, content: '5 mod 3 = 2 (remainder when 5 is divided by 3)' },
      { order: 2, content: 'The equivalence class [5] contains all integers with remainder 2' },
      { order: 3, content: 'These are numbers of the form 3k + 2 where k is any integer' },
      { order: 4, content: '[5] = {..., -4, -1, 2, 5, 8, 11, ...}' },
    ],
    hints: ['Find 5 mod 3 first', 'Equivalence class contains all numbers with the same remainder'],
    xpReward: 20,
    estimatedTime: 90,
  },
]

// ============================================
// Combinatorics Questions
// ============================================

const combinatoricsQuestions: SampleQuestion[] = [
  {
    id: 'comb-1',
    topicId: 'permutations',
    topicKey: 'topics:combinatorics.permutations',
    tier: 1,
    content: 'How many ways can 4 students line up in a row?',
    answerType: 'multiple-choice',
    correctAnswer: '24',
    solutionSteps: [
      { order: 1, content: 'This is a permutation of 4 distinct objects' },
      { order: 2, content: 'P(4,4) = 4!' },
      { order: 3, content: '4! = 4 × 3 × 2 × 1 = 24' },
    ],
    hints: ['Order matters in a line', 'Use factorial: n!'],
    xpReward: 10,
    estimatedTime: 30,
  },
  {
    id: 'comb-2',
    topicId: 'combinations',
    topicKey: 'topics:combinatorics.combinations',
    tier: 2,
    content: 'A committee of 3 people must be chosen from 7 candidates. How many different committees are possible?',
    answerType: 'multiple-choice',
    correctAnswer: '35',
    solutionSteps: [
      { order: 1, content: 'Order does not matter (committee {A,B,C} = {B,A,C})' },
      { order: 2, content: 'Use combination formula: C(n,r) = n! / (r!(n-r)!)' },
      { order: 3, content: 'C(7,3) = 7! / (3! × 4!)' },
      { order: 4, content: '= (7 × 6 × 5) / (3 × 2 × 1) = 210 / 6 = 35' },
    ],
    hints: ['Is order important for a committee?', 'C(n,r) = n! / (r!(n-r)!)'],
    xpReward: 20,
    estimatedTime: 60,
  },
]

// ============================================
// Graph Theory Questions
// ============================================

const graphQuestions: SampleQuestion[] = [
  {
    id: 'graph-1',
    topicId: 'graph-basics',
    topicKey: 'topics:graphTheory.basics',
    tier: 1,
    content: 'In a simple graph with 5 vertices and 7 edges, what is the sum of all vertex degrees?',
    answerType: 'multiple-choice',
    correctAnswer: '14',
    solutionSteps: [
      { order: 1, content: 'The Handshaking Lemma: Sum of degrees = 2 × (number of edges)' },
      { order: 2, content: 'Each edge contributes 2 to the total degree (one at each endpoint)' },
      { order: 3, content: 'Sum of degrees = 2 × 7 = 14' },
    ],
    hints: ['Each edge connects two vertices', 'Handshaking Lemma: Σdeg(v) = 2|E|'],
    xpReward: 10,
    estimatedTime: 45,
  },
  {
    id: 'graph-2',
    topicId: 'paths-circuits',
    topicKey: 'topics:graphTheory.paths',
    tier: 2,
    content: 'A connected graph has 6 vertices. What is the minimum number of edges it must have?',
    answerType: 'multiple-choice',
    correctAnswer: '5',
    solutionSteps: [
      { order: 1, content: 'A connected graph must have a path between any two vertices' },
      { order: 2, content: 'The minimum connected graph is a tree' },
      { order: 3, content: 'A tree with n vertices has exactly n-1 edges' },
      { order: 4, content: 'For 6 vertices: 6 - 1 = 5 edges minimum' },
    ],
    hints: ['Think about the simplest connected graph structure', 'A tree is a connected graph with no cycles'],
    xpReward: 20,
    estimatedTime: 60,
  },
]

// ============================================
// Number Theory Questions
// ============================================

const numberTheoryQuestions: SampleQuestion[] = [
  {
    id: 'num-1',
    topicId: 'gcd',
    topicKey: 'topics:numberTheory.gcd',
    tier: 1,
    content: 'Find the GCD (Greatest Common Divisor) of 48 and 18.',
    answerType: 'multiple-choice',
    correctAnswer: '6',
    solutionSteps: [
      { order: 1, content: 'Use the Euclidean Algorithm:' },
      { order: 2, content: '48 = 18 × 2 + 12' },
      { order: 3, content: '18 = 12 × 1 + 6' },
      { order: 4, content: '12 = 6 × 2 + 0' },
      { order: 5, content: 'When remainder is 0, the last non-zero remainder is the GCD' },
      { order: 6, content: 'GCD(48, 18) = 6' },
    ],
    hints: ['Use the Euclidean Algorithm', 'Keep dividing until remainder is 0'],
    xpReward: 10,
    estimatedTime: 60,
  },
  {
    id: 'num-2',
    topicId: 'modular-arithmetic',
    topicKey: 'topics:numberTheory.modularArithmetic',
    tier: 2,
    content: 'Find the value of 7^100 mod 11.',
    answerType: 'multiple-choice',
    correctAnswer: '1',
    solutionSteps: [
      { order: 1, content: "By Fermat's Little Theorem: a^(p-1) ≡ 1 (mod p) when gcd(a,p) = 1" },
      { order: 2, content: 'Here a = 7, p = 11, and gcd(7, 11) = 1' },
      { order: 3, content: 'So 7^10 ≡ 1 (mod 11)' },
      { order: 4, content: '100 = 10 × 10, so 7^100 = (7^10)^10' },
      { order: 5, content: '(7^10)^10 ≡ 1^10 ≡ 1 (mod 11)' },
    ],
    hints: ["Fermat's Little Theorem can simplify large exponents", '11 is prime, so the theorem applies'],
    xpReward: 30,
    estimatedTime: 120,
  },
]

// ============================================
// Essay Questions (One per topic category)
// Using MathLive virtual keyboard for input
// ============================================

const essayQuestions: SampleQuestion[] = [
  {
    id: 'essay-logic',
    topicId: 'propositional-logic',
    topicKey: 'topics:logic.propositional',
    tier: 2,
    content: 'Write the contrapositive of the statement: "If x² is even, then x is even." Express your answer using symbolic notation where P represents "x² is even" and Q represents "x is even".',
    answerType: 'essay',
    correctAnswer: '\\neg Q \\to \\neg P',
    alternativeAnswers: ['¬Q → ¬P', '~Q -> ~P', 'not Q implies not P', '\\lnot Q \\rightarrow \\lnot P'],
    solutionSteps: [
      { order: 1, content: 'The original statement is: P → Q (If x² is even, then x is even)' },
      { order: 2, content: 'The contrapositive swaps and negates both parts' },
      { order: 3, content: 'Contrapositive: ¬Q → ¬P (If x is not even, then x² is not even)' },
    ],
    hints: ['The contrapositive of P → Q has the form ¬Q → ¬P', 'Negate both parts and swap their positions'],
    xpReward: 25,
    estimatedTime: 120,
  },
  {
    id: 'essay-sets',
    topicId: 'set-operations',
    topicKey: 'topics:sets.operations',
    tier: 2,
    content: 'Given sets A = {1, 2, 3} and B = {2, 3, 4}, write the symmetric difference A △ B using set notation.',
    answerType: 'essay',
    correctAnswer: '\\{1, 4\\}',
    alternativeAnswers: ['{1, 4}', '{4, 1}', '\\{4, 1\\}'],
    solutionSteps: [
      { order: 1, content: 'Symmetric difference A △ B = (A - B) ∪ (B - A)' },
      { order: 2, content: 'A - B = {1} (elements in A but not in B)' },
      { order: 3, content: 'B - A = {4} (elements in B but not in A)' },
      { order: 4, content: 'A △ B = {1} ∪ {4} = {1, 4}' },
    ],
    hints: ['Symmetric difference contains elements in either set but not both', 'Find elements unique to each set'],
    xpReward: 25,
    estimatedTime: 120,
  },
  {
    id: 'essay-relations',
    topicId: 'equivalence-relations',
    topicKey: 'topics:relations.equivalence',
    tier: 2,
    content: 'Write the equivalence class [2] for the relation "congruent modulo 3" on integers. Use set-builder notation.',
    answerType: 'essay',
    correctAnswer: '\\{x \\in \\mathbb{Z} : x \\equiv 2 \\pmod{3}\\}',
    alternativeAnswers: ['{..., -4, -1, 2, 5, 8, ...}', '{x ∈ Z : x ≡ 2 (mod 3)}', '\\{\\ldots, -4, -1, 2, 5, 8, \\ldots\\}'],
    solutionSteps: [
      { order: 1, content: '[2] contains all integers x where x ≡ 2 (mod 3)' },
      { order: 2, content: 'This means x - 2 is divisible by 3' },
      { order: 3, content: '[2] = {..., -4, -1, 2, 5, 8, 11, ...}' },
      { order: 4, content: 'In set-builder notation: {x ∈ ℤ : x ≡ 2 (mod 3)}' },
    ],
    hints: ['An equivalence class contains all elements related to the representative', 'Find numbers that leave remainder 2 when divided by 3'],
    xpReward: 25,
    estimatedTime: 120,
  },
  {
    id: 'essay-comb',
    topicId: 'combinatorics',
    topicKey: 'topics:combinatorics.combinations',
    tier: 2,
    content: 'Express the number of ways to choose a committee of 3 people from 7 people using combination notation, then calculate the value.',
    answerType: 'essay',
    correctAnswer: '\\binom{7}{3} = 35',
    alternativeAnswers: ['C(7,3) = 35', '7C3 = 35', '35', '\\binom{7}{3}=35'],
    solutionSteps: [
      { order: 1, content: 'This is a combination problem: order does not matter' },
      { order: 2, content: 'We write this as C(7,3) or (7 choose 3)' },
      { order: 3, content: 'C(7,3) = 7! / (3! × 4!) = (7 × 6 × 5) / (3 × 2 × 1)' },
      { order: 4, content: '= 210 / 6 = 35' },
    ],
    hints: ['Use the combination formula C(n,r) = n! / (r! × (n-r)!)', 'We are choosing 3 from 7'],
    xpReward: 25,
    estimatedTime: 120,
  },
  {
    id: 'essay-graph',
    topicId: 'graph-theory',
    topicKey: 'topics:graphTheory.basics',
    tier: 2,
    content: 'A complete graph K_n has n(n-1)/2 edges. Write the formula for the number of edges in K_5 and calculate it.',
    answerType: 'essay',
    correctAnswer: '\\frac{5(5-1)}{2} = 10',
    alternativeAnswers: ['5(5-1)/2 = 10', '10', '5×4/2 = 10', '\\frac{5 \\cdot 4}{2} = 10'],
    solutionSteps: [
      { order: 1, content: 'For complete graph K_n, edges = n(n-1)/2' },
      { order: 2, content: 'Substitute n = 5' },
      { order: 3, content: 'Edges = 5(5-1)/2 = 5×4/2 = 20/2 = 10' },
    ],
    hints: ['Substitute n = 5 into the formula', 'A complete graph connects every pair of vertices'],
    xpReward: 25,
    estimatedTime: 90,
  },
  {
    id: 'essay-numtheory',
    topicId: 'number-theory',
    topicKey: 'topics:numberTheory.gcd',
    tier: 2,
    content: 'Use the Euclidean algorithm to find gcd(48, 18). Show your work using the division steps.',
    answerType: 'essay',
    correctAnswer: 'gcd(48, 18) = 6',
    alternativeAnswers: ['6', 'gcd = 6', '\\gcd(48, 18) = 6'],
    solutionSteps: [
      { order: 1, content: '48 = 18 × 2 + 12' },
      { order: 2, content: '18 = 12 × 1 + 6' },
      { order: 3, content: '12 = 6 × 2 + 0' },
      { order: 4, content: 'When remainder is 0, the divisor (6) is the gcd' },
      { order: 5, content: 'Therefore gcd(48, 18) = 6' },
    ],
    hints: ['Divide the larger by smaller, then repeat with divisor and remainder', 'Stop when remainder is 0'],
    xpReward: 25,
    estimatedTime: 120,
  },
]

// ============================================
// Export All Questions
// ============================================

export const sampleQuestions: SampleQuestion[] = [
  ...logicQuestions,
  ...setQuestions,
  ...relationsQuestions,
  ...combinatoricsQuestions,
  ...graphQuestions,
  ...numberTheoryQuestions,
]

// Essay questions separately for mixed sessions
export const essayQuestionsPool: SampleQuestion[] = essayQuestions

// All questions including essays
export const allQuestions: SampleQuestion[] = [
  ...sampleQuestions,
  ...essayQuestions,
]

// Group questions by topic category for easy access
export const questionsByCategory = {
  logic: logicQuestions,
  sets: setQuestions,
  relations: relationsQuestions,
  combinatorics: combinatoricsQuestions,
  graphTheory: graphQuestions,
  numberTheory: numberTheoryQuestions,
}

// Get questions by difficulty tier
export function getQuestionsByTier(tier: DifficultyTier): SampleQuestion[] {
  return sampleQuestions.filter(q => q.tier === tier)
}

// Get random questions for a practice session
export function getRandomQuestions(count: number, topicId?: string): SampleQuestion[] {
  const pool = topicId 
    ? sampleQuestions.filter(q => q.topicId === topicId || q.topicKey.includes(topicId))
    : sampleQuestions
  
  // Shuffle and take count
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// Get a mixed session with MC and essay questions
export function getMixedQuestions(mcCount: number, essayCount: number): SampleQuestion[] {
  const mcQuestions = [...sampleQuestions].sort(() => Math.random() - 0.5).slice(0, mcCount)
  const essays = [...essayQuestions].sort(() => Math.random() - 0.5).slice(0, essayCount)
  
  // Mix them together
  return [...mcQuestions, ...essays].sort(() => Math.random() - 0.5)
}
