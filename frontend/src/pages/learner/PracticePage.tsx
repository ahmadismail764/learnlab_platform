import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  XCircle,
  TestTube2,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, Button, Badge, ProgressBar, XpBadge } from '@/components/ui'
import { PageStatCard, SectionHeading } from '@/components/common'
import { useToast } from '@/contexts'
import { practiceService, WrittenAnswerInvalidError, type ReviewForecast } from '@/services/practice'
import { cn } from '@/utils/cn'
import { logger } from '@/utils/logger'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/hooks'
import { getTopicDisplayName } from '@/utils/topicLabels'
import { PracticeIntro } from './PracticeIntro'
import { PracticeComplete } from './PracticeComplete'
// Lazy: pulls in MathLive (~800 kB), so only load it when a WRITTEN question
// actually appears — MCQ-only sessions never download it.
const WrittenAnswerPanel = lazy(() =>
  import('./WrittenAnswerPanel').then((m) => ({ default: m.WrittenAnswerPanel })),
)
import {
  getQuestionXp,
  normalizePracticeQuestion,
  type PracticeQuestion,
  type QuestionState,
  type RawPracticeQuestion,
  type SessionState,
} from './practiceSession'

/**
 * PracticePage
 * Drives one adaptive practice session through three states (selecting /
 * practicing / complete). The selecting and complete screens are extracted into
 * PracticeIntro and PracticeComplete; this component owns the live session loop.
 */

export function PracticePage() {
  const { t } = useTranslation(['practice', 'learner', 'common', 'topics'])
  const { showError, showWarning } = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const topicId = searchParams.get('topic') || undefined
  const subtopicId = searchParams.get('subtopic') || undefined

  const [sessionState, setSessionState] = useState<SessionState>('selecting')
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionRecord, setSessionRecord] = useState<{ id: string | number; session_type?: string } | null>(null)
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({})
  const [earnedXp, setEarnedXp] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [nextReview, setNextReview] = useState<ReviewForecast | null>(null)

  const currentQuestion = questions[currentIndex]
  const currentStatus = (currentQuestion && questionStates[currentIndex]) ? questionStates[currentIndex] : null

  // --- Fetch Adaptive Session ---
  const startSession = async () => {
    setIsLoading(true)
    try {
      const data = await practiceService.generateAdaptiveSession(topicId, subtopicId)

      // Handle "all caught up" — no questions available
      if (!data.questions || data.questions.length === 0) {
        showWarning(t('practice:noQuestionsAvailable'))
        return
      }

      const normalizedQuestions = data.questions.map((question: RawPracticeQuestion) =>
        normalizePracticeQuestion(question, t('practice:practiceQuestionFallback')),
      ).filter((question: PracticeQuestion) =>
        // Keep written questions (no choices) and well-formed MCQs.
        question.questionType === 'WRITTEN' || question.choices.length > 0,
      )

      if (normalizedQuestions.length === 0) {
        showWarning(t('practice:noQuestionsAvailable'))
        return
      }

      setQuestions(normalizedQuestions)

      setSessionRecord({ id: data.id })

      const initialStates: Record<number, QuestionState> = {}
      normalizedQuestions.forEach((q: PracticeQuestion, idx: number) => {
        initialStates[idx] = {
          questionId: q.id,
          userResponse: null,
          selectedAnswerIndex: null,
          answerState: 'unanswered',
          isCorrect: null,
          startTime: Date.now(),
          feedback: null,
          revealedAnswer: null,
        }
      })
      setQuestionStates(initialStates)
      setSessionState('practicing')
    } catch (err) {
      const message = err instanceof Error ? err.message : t('practice:startSessionFailed')
      logger.warn('Session start error', err)
      showError(t('practice:couldNotStartSession', { message }))
    } finally {
      setIsLoading(false)
    }
  }

  // MCQ: selecting an answer submits it immediately. The learner no longer
  // self-rates difficulty — the backend derives the FSRS outcome from
  // correctness alone (any wrong -> Again, all correct -> Good).
  const handleAnswer = useCallback(async (choice: string, selectedAnswerIndex: number) => {
    if (isCompleting) return
    if (!currentQuestion || !currentStatus || !sessionRecord || currentStatus.answerState !== 'unanswered') return

    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        userResponse: choice,
        selectedAnswerIndex,
        answerState: 'submitting',
        isCorrect: null,
      }
    }))

    try {
      const response = await practiceService.submitInteraction({
        session: sessionRecord.id,
        question: currentQuestion.id,
        selected_answer_index: selectedAnswerIndex,
      })
      const backendIsCorrect = Boolean(response?.is_correct)
      if (typeof response?.correct_answer_index === 'number') {
        setQuestions((prev) => prev.map((question, index) =>
          index === currentIndex
            ? { ...question, correct_answer_index: response.correct_answer_index }
            : question,
        ))
      }
      if (backendIsCorrect) {
        setEarnedXp((prev) => prev + getQuestionXp(currentQuestion))
      }
      setQuestionStates((prev) => ({
        ...prev,
        [currentIndex]: {
          ...prev[currentIndex],
          answerState: 'answered',
          isCorrect: backendIsCorrect,
        }
      }))
    } catch (err) {
      logger.warn('Failed to submit interaction', err)
      setQuestionStates((prev) => ({
        ...prev,
        [currentIndex]: {
          ...prev[currentIndex],
          userResponse: null,
          selectedAnswerIndex: null,
          answerState: 'unanswered',
          isCorrect: null,
        }
      }))
      showError(t('practice:couldNotSubmitAnswer'))
    }
  }, [currentQuestion, currentStatus, currentIndex, isCompleting, sessionRecord, showError, t])

  // Written: submit free-response (plain ASCII math). A 422 means the answer
  // couldn't be parsed/graded and was NOT recorded — keep the question
  // answerable so the learner can revise.
  const handleSubmitWritten = useCallback(async (asciiAnswer: string) => {
    if (isCompleting) return
    if (!currentQuestion || !currentStatus || !sessionRecord || currentStatus.answerState !== 'unanswered') return

    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: { ...prev[currentIndex], userResponse: asciiAnswer, answerState: 'submitting', isCorrect: null }
    }))

    try {
      const response = await practiceService.submitInteraction({
        session: sessionRecord.id,
        question: currentQuestion.id,
        written_answer: asciiAnswer,
      })
      const backendIsCorrect = Boolean(response?.is_correct)
      if (backendIsCorrect) {
        setEarnedXp((prev) => prev + getQuestionXp(currentQuestion))
      }
      setQuestionStates((prev) => ({
        ...prev,
        [currentIndex]: {
          ...prev[currentIndex],
          answerState: 'answered',
          isCorrect: backendIsCorrect,
          revealedAnswer: typeof response?.correct_answer === 'string' ? response.correct_answer : null,
          feedback: typeof response?.feedback === 'string' ? response.feedback : null,
        }
      }))
    } catch (err) {
      // Reset to unanswered either way so the learner can try again.
      setQuestionStates((prev) => ({
        ...prev,
        [currentIndex]: { ...prev[currentIndex], answerState: 'unanswered', isCorrect: null }
      }))
      if (err instanceof WrittenAnswerInvalidError) {
        showWarning(err.message)
        return
      }
      logger.warn('Failed to submit written answer', err)
      showError(t('practice:couldNotSubmitAnswer'))
    }
  }, [currentQuestion, currentStatus, currentIndex, isCompleting, sessionRecord, showError, showWarning, t])

  const completeSession = useCallback(async () => {
    if (isCompleting) return
    setIsCompleting(true)
    if (sessionRecord) {
      try {
        const result = await practiceService.completeSession(sessionRecord.id)
        // Surface the "what's next" agenda the backend returns on completion.
        setNextReview(result?.next_review ?? null)
        // Invalidate all related caches to synchronize XP, leaderboard, and mastery UI instantly
        queryClient.invalidateQueries({ queryKey: queryKeys.learner.profile })
        queryClient.invalidateQueries({ queryKey: queryKeys.learner.mastery })
        queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.all })
        queryClient.invalidateQueries({ queryKey: queryKeys.practice.sessions })
        queryClient.invalidateQueries({ queryKey: queryKeys.practice.reviewForecastAll })
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.aggregated })
        setSessionState('complete')
      } catch (e) {
        logger.warn('Failed to complete session', e)
        showError(t('practice:couldNotCompleteSession'))
      } finally {
        setIsCompleting(false)
      }
    } else {
      setIsCompleting(false)
    }
  }, [isCompleting, queryClient, sessionRecord, showError, t])

  const continueAfterFeedback = useCallback(() => {
    if (isCompleting) return
    if (!currentStatus || currentStatus.answerState !== 'answered') return

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setQuestionStates((prev) => ({
        ...prev,
        [nextIndex]: { ...prev[nextIndex], startTime: Date.now() }
      }))
    } else {
      completeSession()
    }
  }, [completeSession, currentIndex, currentStatus, isCompleting, questions.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return
      }

      if (sessionState !== 'practicing' || !currentQuestion || !currentStatus) return

      const key = e.key
      const isAnswered = currentStatus.answerState === 'answered'

      // Number keys pick (and immediately submit) the matching MCQ choice.
      if (currentQuestion.questionType === 'MCQ' && currentStatus.answerState === 'unanswered') {
        const selectedIndex = Number(key) - 1
        const selectedChoice = currentQuestion.choices[selectedIndex]
        if (selectedChoice) handleAnswer(selectedChoice, selectedIndex)
      }

      if (isAnswered && key === 'Enter') {
        continueAfterFeedback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [continueAfterFeedback, currentQuestion, currentStatus, handleAnswer, sessionState])

  if (sessionState === 'selecting') {
    return <PracticeIntro onStart={startSession} isLoading={isLoading} />
  }

  if (sessionState === 'complete') {
    return (
      <PracticeComplete
        earnedXp={earnedXp}
        questionCount={questions.length}
        nextReview={nextReview}
      />
    )
  }

  if (!currentQuestion || !currentStatus) {
    return (
      <Card className="py-14 text-center">
        <div className="space-y-3">
          <TestTube2 className="mx-auto h-10 w-10 text-primary-500" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {t('practice:loadingCurrentQuestion')}
          </p>
        </div>
      </Card>
    )
  }

  const isAnswered = currentStatus.answerState === 'answered'
  const isMcq = currentQuestion.questionType === 'MCQ'
  const isWritten = currentQuestion.questionType === 'WRITTEN'
  const isInteractionLocked = currentStatus.answerState !== 'unanswered'
  const sessionProgress = ((currentIndex + 1) / questions.length) * 100
  const elapsedSeconds = Math.round((Date.now() - currentStatus.startTime) / 1000)

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                {t('practice:questionOf', { current: currentIndex + 1, total: questions.length })}
              </Badge>
              <Badge variant="outline" size="sm">
                {t('practice:tierLabel', { tier: currentQuestion.tier })}
              </Badge>
              <Badge variant="outline" size="sm">
                {isWritten ? t('practice:writtenBadge') : t('practice:mcqBadge')}
              </Badge>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {t('practice:practiceInProgress')}
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {getTopicDisplayName(t, currentQuestion.topic_name)}
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">{t('practice:progress')}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {Math.round(sessionProgress)}%
              </span>
            </div>
            <ProgressBar value={sessionProgress} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">
                  {t('practice:solveNextPrompt')}
                </p>
                <h2 className="text-2xl font-semibold leading-8 text-neutral-900 dark:text-neutral-100">
                  {currentQuestion.text}
                </h2>
              </div>

              {isMcq && (
                <div className="grid gap-3">
                  {currentQuestion.choices.map((choice: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(choice, index)}
                      disabled={isInteractionLocked}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-start transition-colors',
                        currentStatus.userResponse === choice
                          ? currentStatus.isCorrect
                            ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-200'
                            : currentStatus.isCorrect === false
                              ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-200'
                              : 'border-primary-500 bg-primary-50 text-primary-900 dark:bg-primary-950/20 dark:text-primary-200'
                          : 'border-neutral-200 bg-white hover:border-primary-400 hover:bg-primary-50/40 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-primary-950/20',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {!isInteractionLocked && (
                          <kbd className="inline-flex h-6 w-6 items-center justify-center rounded border border-neutral-300 bg-neutral-100 font-sans text-xs font-semibold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                            {index + 1}
                          </kbd>
                        )}
                        <span className="text-base font-medium">{choice}</span>
                      </div>
                      <span className="shrink-0">
                        {isAnswered && currentQuestion.correct_answer_index !== null && index === currentQuestion.correct_answer_index ? (
                          <CheckCircle className={cn(
                            'h-5 w-5',
                            currentStatus.userResponse === choice ? 'text-green-700 dark:text-green-300' : 'text-green-500',
                          )} />
                        ) : null}
                        {currentStatus.userResponse === choice && currentStatus.isCorrect === false ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {isAnswered && currentStatus.isCorrect !== null && (
                <div
                  className={cn(
                    'space-y-2 rounded-xl border px-4 py-3 text-sm font-medium',
                    currentStatus.isCorrect
                      ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-200'
                      : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200',
                  )}
                >
                  <div className="flex items-start gap-3">
                    {currentStatus.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <p>
                      {currentStatus.isCorrect
                        ? t('practice:correctAnswerFeedback')
                        : t('practice:incorrectAnswerFeedback')}
                    </p>
                  </div>
                  {isWritten && (
                    <div className="ms-8 space-y-1 font-normal">
                      {currentStatus.userResponse && (
                        <p dir="ltr" className="font-mono text-xs opacity-80">
                          {t('practice:yourAnswerLabel', { answer: currentStatus.userResponse })}
                        </p>
                      )}
                      {currentStatus.revealedAnswer && (
                        <p dir="ltr" className="font-mono text-xs">
                          {t('practice:correctAnswerWas', { answer: currentStatus.revealedAnswer })}
                        </p>
                      )}
                      {currentStatus.feedback && <p className="text-xs">{currentStatus.feedback}</p>}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isWritten && !isAnswered && (
            <Suspense fallback={<Card className="py-8 text-center text-sm text-neutral-500">{t('practice:loading')}</Card>}>
              <WrittenAnswerPanel
                onSubmit={handleSubmitWritten}
                isSubmitting={currentStatus.answerState === 'submitting'}
                disabled={isCompleting}
              />
            </Suspense>
          )}

          {isAnswered && (
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {t('practice:answerRecorded')}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {t('practice:answerRecordedDescription')}
                  </p>
                </div>
                <Button
                  onClick={continueAfterFeedback}
                  isLoading={isCompleting}
                  rightIcon={!isCompleting ? <ArrowRight className="h-4 w-4 rtl:rotate-180" /> : undefined}
                >
                  {currentIndex < questions.length - 1
                    ? t('practice:continueSession')
                    : t('practice:finishSession')}
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          <PageStatCard
            icon={<XpBadge size="lg" />}
            label={t('practice:sessionXp')}
            value={`+${earnedXp}`}
            helper={t('practice:updatesDuringSet')}
            tone="secondary"
          />

          <Card>
            <SectionHeading
              title={t('practice:sessionDetails')}
              description={t('practice:sessionDetailsDescription')}
            />
            <div className="mt-4 space-y-4">
              <div className="surface-inset grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                    {t('practice:elapsed')}
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                    {t('practice:secondsShort', { count: elapsedSeconds })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                    {t('practice:difficultyLabel')}
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                    {t('practice:tierLabel', { tier: currentQuestion.tier })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{t('practice:queueProgress')}</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {Math.round(sessionProgress)}%
                  </span>
                </div>
                <ProgressBar value={sessionProgress} variant="secondary" />
              </div>

              <Badge variant="outline" size="sm">
                {t('practice:adaptiveSchedulingEnabled')}
              </Badge>
            </div>
          </Card>

          <Card className="border-dashed">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {t('practice:tip')}
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {t('practice:practiceFlowTip')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
