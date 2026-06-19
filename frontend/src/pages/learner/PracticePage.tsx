import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  XCircle,
  Clock,
  TestTube2,
  Lightbulb,
  CheckCircle2,
  Target,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, Button, Badge, ProgressBar, XpBadge } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { useToast } from '@/contexts'
import { practiceService } from '@/services/practice'
import { cn } from '@/utils/cn'
import { logger } from '@/utils/logger'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/hooks'
import { getTopicDisplayName } from '@/utils/topicLabels'
import { PracticeGradePanel } from './PracticeGradePanel'
import {
  getQuestionXp,
  normalizePracticeQuestion,
  type FSRSGrade,
  type PracticeQuestion,
  type QuestionState,
  type RawPracticeQuestion,
  type SessionState,
} from './practiceSession'

/**
 * PracticePage (Experiment Mode)
 * Re-imagined as a high-stakes focus environment.
 */

export function PracticePage() {
  const { t } = useTranslation(['practice', 'learner', 'common', 'topics'])
  const { showError, showWarning } = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const topicId = searchParams.get('topic') || undefined

  const [sessionState, setSessionState] = useState<SessionState>('selecting')
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionRecord, setSessionRecord] = useState<{ id: string | number; session_type?: string } | null>(null)
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({})
  const [earnedXp, setEarnedXp] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const currentQuestion = questions[currentIndex]
  const currentStatus = (currentQuestion && questionStates[currentIndex]) ? questionStates[currentIndex] : null

  // --- Fetch Adaptive Session ---
  const startSession = async () => {
    setIsLoading(true)
    try {
      const data = await practiceService.generateAdaptiveSession(topicId)

      // Handle "all caught up" — no questions available
      if (!data.questions || data.questions.length === 0) {
        showWarning(t('practice:noQuestionsAvailable'))
        return
      }

      const normalizedQuestions = data.questions.map((question: RawPracticeQuestion) =>
        normalizePracticeQuestion(question, t('practice:practiceQuestionFallback')),
      ).filter((question: PracticeQuestion) => question.choices.length > 0)

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
          grade: null,
          startTime: Date.now()
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

  const handleAnswer = useCallback(async (choice: string, selectedAnswerIndex: number) => {
    if (!currentQuestion || !currentStatus || !sessionRecord || currentStatus.answerState !== 'unanswered') return

    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        userResponse: choice,
        selectedAnswerIndex,
        answerState: 'submitting',
        isCorrect: null
      }
    }))

    try {
      const response = await practiceService.submitInteraction({
        session: sessionRecord.id,
        question: currentQuestion.id,
        selected_answer_index: selectedAnswerIndex,
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
        }
      }))
    } catch (err) {
      console.error('Failed to submit interaction', err)
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
  }, [currentQuestion, currentStatus, currentIndex, sessionRecord, showError, t])

  const completeSession = useCallback(async () => {
    if (isCompleting) return
    setIsCompleting(true)
    if (sessionRecord) {
      try {
        await practiceService.completeSession(sessionRecord.id)
        // Invalidate all related caches to synchronize XP, leaderboard, and mastery UI instantly
        queryClient.invalidateQueries({ queryKey: queryKeys.learner.profile })
        queryClient.invalidateQueries({ queryKey: queryKeys.learner.mastery })
        queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.global })
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
        queryClient.invalidateQueries({ queryKey: queryKeys.practice.sessions })
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.aggregated })
        setSessionState('complete')
      } catch (e) {
        console.error('Failed to complete session', e)
        showError(t('practice:couldNotCompleteSession'))
      } finally {
        setIsCompleting(false)
      }
    } else {
      setIsCompleting(false)
    }
  }, [isCompleting, queryClient, sessionRecord, showError, t])

  const handleGrade = useCallback((grade: FSRSGrade) => {
    if (isCompleting) return
    if (!currentStatus || currentStatus.answerState !== 'answered') return
    if (currentStatus.selectedAnswerIndex === null) {
      showError(t('practice:couldNotSubmitAnswer'))
      return
    }

    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: { ...prev[currentIndex], grade: grade }
    }))

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
  }, [completeSession, currentIndex, currentStatus, isCompleting, questions.length, showError, t])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return
      }

      if (sessionState !== 'practicing' || !currentQuestion || !currentStatus) return

      const key = e.key
      const isAnswered = currentStatus.answerState === 'answered'

      if (currentStatus.answerState === 'unanswered') {
        const selectedIndex = Number(key) - 1
        const selectedChoice = currentQuestion.choices[selectedIndex]
        if (selectedChoice) handleAnswer(selectedChoice, selectedIndex)
      }

      if (isAnswered) {
        if (key === '1') handleGrade(1)
        if (key === '2') handleGrade(2)
        if (key === '3') handleGrade(3)
        if (key === '4') handleGrade(4)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentQuestion, currentStatus, handleAnswer, handleGrade, sessionState])

  if (sessionState === 'selecting') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageIntro
          eyebrow={t('practice:practiceSessionEyebrow')}
          title={t('practice:readyForFocusedReview')}
          description={t('practice:practiceIntroDescription')}
          icon={<TestTube2 className="h-6 w-6" />}
          tone="primary"
          actions={(
            <Button
              onClick={startSession}
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight className="h-4 w-4 rtl:rotate-180" /> : undefined}
            >
              {t('practice:startSession')}
            </Button>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PageStatCard
            icon={<Target className="h-5 w-5" />}
            label={t('practice:questionSet')}
            value={t('practice:upToTen')}
            helper={t('practice:adaptiveReviewMix')}
            tone="primary"
          />
          <PageStatCard
            icon={<Clock className="h-5 w-5" />}
            label={t('practice:estimatedTime')}
            value={t('practice:tenToFifteenMinutes')}
            helper={t('practice:choiceBasedReview')}
            tone="secondary"
          />
          <PageStatCard
            icon={<XpBadge size="lg" variant="amber" />}
            label={t('practice:reward')}
            value={t('practice:tierXp')}
            helper={t('practice:harderItemsReward')}
            tone="accent"
          />
        </div>

        <Card>
          <SectionHeading
            title={t('practice:howSessionWorks')}
            description={t('practice:howSessionWorksDescription')}
          />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="surface-inset">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('practice:solveStep')}
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {t('practice:solveDescription')}
              </p>
            </div>
            <div className="surface-inset">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('practice:reflectStep')}
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {t('practice:reflectDescription')}
              </p>
            </div>
            <div className="surface-inset">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('practice:keepMomentumStep')}
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {t('practice:keepMomentumDescription')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (sessionState === 'complete') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageIntro
          eyebrow={t('practice:sessionCompleteEyebrow')}
          title={t('practice:niceWork')}
          description={t('practice:sessionCompleteDescription')}
          icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
          tone="success"
          actions={(
            <Link to="/learner/progress">
              <Button rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>
                {t('practice:viewProgress')}
              </Button>
            </Link>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PageStatCard
            icon={<XpBadge size="lg" variant="amber" />}
            label={t('practice:xpEarned')}
            value={`+${earnedXp}`}
            tone="accent"
          />
          <PageStatCard
            icon={<Target className="h-5 w-5" />}
            label={t('practice:questionsCompleted')}
            value={questions.length}
            tone="primary"
          />
          <PageStatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label={t('practice:sessionStatus')}
            value={t('common:saved')}
            helper={t('practice:reviewDataSynced')}
            tone="success"
          />
        </div>

        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t('practice:keepMomentumGoing')}
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t('practice:completionNextSteps')}
              </p>
            </div>
            <Link to="/learner">
              <Button variant="outline">{t('practice:backToDashboard')}</Button>
            </Link>
          </div>
        </Card>
      </div>
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

              {isAnswered && currentStatus.isCorrect !== null && (
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
                    currentStatus.isCorrect
                      ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-200'
                      : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200',
                  )}
                >
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
              )}
            </CardContent>
          </Card>

          {isAnswered && <PracticeGradePanel onGrade={handleGrade} isDisabled={isCompleting} />}
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
                  {t('practice:ratingTip')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
