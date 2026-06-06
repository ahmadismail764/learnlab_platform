import type { EntityId } from '@/services/api'

export type SessionState = 'selecting' | 'practicing' | 'complete'
export type AnswerState = 'unanswered' | 'answered'
export type FSRSGrade = 1 | 2 | 3 | 4

export interface PracticeQuestion {
  id: EntityId
  text: string
  choices: string[]
  correct_answer_index: number
  tier: number
  explanation_video_url?: string | null
  topic_name: string
  topic_id?: EntityId
}

export interface RawPracticeQuestion extends Partial<PracticeQuestion> {
  subtopic_name?: string | null
}

export interface QuestionState {
  questionId: EntityId
  userResponse: string | null
  answerState: AnswerState
  isCorrect: boolean | null
  grade: FSRSGrade | null
  startTime: number
}

export const FSRS_GRADE_OPTIONS: {
  grade: FSRSGrade
  labelKey: string
  subKey: string
  tone: string
}[] = [
  {
    grade: 1,
    labelKey: 'practice:gradeAgain',
    subKey: 'practice:gradeAgainHint',
    tone: 'bg-red-500 hover:bg-red-600',
  },
  {
    grade: 2,
    labelKey: 'practice:gradeHard',
    subKey: 'practice:gradeHardHint',
    tone: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    grade: 3,
    labelKey: 'practice:gradeGood',
    subKey: 'practice:gradeGoodHint',
    tone: 'bg-primary-500 hover:bg-primary-600',
  },
  {
    grade: 4,
    labelKey: 'practice:gradeEasy',
    subKey: 'practice:gradeEasyHint',
    tone: 'bg-green-600 hover:bg-green-700',
  },
]

export function normalizePracticeQuestion(
  raw: RawPracticeQuestion,
  fallbackTopicName = '',
): PracticeQuestion {
  return {
    id: raw.id ?? '',
    text: raw.text ?? '',
    choices: Array.isArray(raw.choices) ? raw.choices.map(String) : [],
    correct_answer_index: Number(raw.correct_answer_index ?? 0),
    tier: Number(raw.tier ?? 1),
    explanation_video_url: raw.explanation_video_url ?? null,
    topic_name: raw.topic_name ?? raw.subtopic_name ?? fallbackTopicName,
    topic_id: raw.topic_id,
  }
}

export function getQuestionXp(question: PracticeQuestion): number {
  return 10 * Math.max(1, question.tier)
}

export function resolveSubmittedCorrectness(
  status: QuestionState,
  grade: FSRSGrade,
): boolean {
  return status.isCorrect ?? grade > 1
}
