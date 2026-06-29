import type { EntityId } from '@/services/api'
import type { QuestionType } from '@/services/questions'

export type SessionState = 'selecting' | 'practicing' | 'complete'
export type AnswerState = 'unanswered' | 'submitting' | 'answered'

export interface PracticeQuestion {
  id: EntityId
  text: string
  questionType: QuestionType
  choices: string[]
  correct_answer_index: number | null
  tier: number
  topic_name: string
  topic_id?: EntityId
}

export interface RawPracticeQuestion extends Partial<Omit<PracticeQuestion, 'questionType'>> {
  subtopic_name?: string | null
  question_type?: string | null
}

export interface QuestionState {
  questionId: EntityId
  userResponse: string | null
  selectedAnswerIndex: number | null
  answerState: AnswerState
  isCorrect: boolean | null
  startTime: number
  /** Grader note revealed after a written answer is submitted. */
  feedback: string | null
  /** Canonical correct answer revealed after a written answer is submitted. */
  revealedAnswer: string | null
}

export function normalizePracticeQuestion(
  raw: RawPracticeQuestion,
  fallbackTopicName = '',
): PracticeQuestion {
  return {
    id: raw.id ?? '',
    text: raw.text ?? '',
    questionType: raw.question_type === 'WRITTEN' ? 'WRITTEN' : 'MCQ',
    choices: Array.isArray(raw.choices) ? raw.choices.map(String) : [],
    correct_answer_index: typeof raw.correct_answer_index === 'number' ? raw.correct_answer_index : null,
    tier: Number(raw.tier ?? 1),
    topic_name: raw.topic_name ?? raw.subtopic_name ?? fallbackTopicName,
    topic_id: raw.topic_id,
  }
}

export function getQuestionXp(question: PracticeQuestion): number {
  return 10 * Math.max(1, question.tier)
}
