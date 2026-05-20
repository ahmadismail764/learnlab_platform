import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  Trophy,
  Zap,
  PlayCircle,
  Clock,
  TestTube2,
  Lightbulb,
  CheckCircle2,
  Target,
  ArrowRight,
  Mic2,
} from 'lucide-react'
import { Card, CardContent, Button, Badge, ProgressBar } from '@/components/ui'
import { PageIntro, PageStatCard, SectionHeading } from '@/components/common'
import { MathInput } from '@/components/MathInput'
import { practiceService } from '@/services/practice'
import { cn } from '@/utils/cn'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/hooks'

/**
 * PracticePage (Experiment Mode)
 * Re-imagined as a high-stakes focus environment.
 */

type SessionState = 'selecting' | 'practicing' | 'complete'
type AnswerState = 'unanswered' | 'answered'
type FSRSGrade = 1 | 2 | 3 | 4 // Again, Hard, Good, Easy

interface Question {
  id: string | number
  text: string
  choices: string[]
  correct_answer_index: number
  tier: number
  explanation_video_url?: string | null
  topic_name: string
  topic_id?: string | number
}

interface QuestionState {
  questionId: string | number
  userResponse: string | null
  answerState: AnswerState
  isCorrect: boolean | null
  grade: FSRSGrade | null
  startTime: number
}

function normalizePracticeQuestion(raw: Partial<Question> & { subtopic_name?: string | null }): Question {
  return {
    id: raw.id ?? '',
    text: raw.text ?? '',
    choices: Array.isArray(raw.choices) ? raw.choices.map(String) : [],
    correct_answer_index: Number(raw.correct_answer_index ?? 0),
    tier: Number(raw.tier ?? 1),
    explanation_video_url: raw.explanation_video_url ?? null,
    topic_name: raw.topic_name ?? raw.subtopic_name ?? 'Practice question',
    topic_id: raw.topic_id,
  }
}

export function PracticePage() {
  const queryClient = useQueryClient()
  const [sessionState, setSessionState] = useState<SessionState>('selecting')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionRecord, setSessionRecord] = useState<{ id: string | number; session_type?: string } | null>(null)
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({})
  const [earnedXp, setEarnedXp] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [mathValue, setMathValue] = useState('')

  const currentQuestion = questions[currentIndex]
  const currentStatus = (currentQuestion && questionStates[currentIndex]) ? questionStates[currentIndex] : null

  // --- Fetch Adaptive Session ---
  const startSession = async () => {
    setIsLoading(true)
    try {
      const data = await practiceService.generateAdaptiveSession()

      // Handle "all caught up" — no questions available
      if (!data.questions || data.questions.length === 0) {
        alert(data.message || 'No questions available right now. Try again later!')
        return
      }

      const normalizedQuestions = data.questions.map(normalizePracticeQuestion)
      setQuestions(normalizedQuestions)

      // Create session record — backend PracticeSessionCreateSerializer
      // requires responses (can be empty array)
      const session = await practiceService.createSession({
        responses: []
      })
      setSessionRecord(session)

      const initialStates: Record<number, QuestionState> = {}
      normalizedQuestions.forEach((q: Question, idx: number) => {
        initialStates[idx] = {
          questionId: q.id,
          userResponse: null,
          answerState: 'unanswered',
          isCorrect: null,
          grade: null,
          startTime: Date.now()
        }
      })
      setQuestionStates(initialStates)
      setSessionState('practicing')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start session'
      console.error('Session start error:', message, err)
      alert(`Could not start session: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = useCallback((choice: string) => {
    if (!currentQuestion || !currentStatus || currentStatus.answerState === 'answered') return
    const isCorrect = currentQuestion.choices.indexOf(choice) === currentQuestion.correct_answer_index
    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        userResponse: choice,
        answerState: 'answered',
        isCorrect: isCorrect
      }
    }))
    if (isCorrect) setEarnedXp(prev => prev + 10 * currentQuestion.tier)
  }, [currentQuestion, currentStatus, currentIndex])

  const handleSubmitMathAnswer = useCallback(() => {
    if (!currentQuestion || !mathValue || !currentStatus || currentStatus.answerState === 'answered') return
    setQuestionStates(prev => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        userResponse: mathValue,
        answerState: 'answered',
        isCorrect: true 
      }
    }))
    setEarnedXp(prev => prev + 15 * currentQuestion.tier)
  }, [currentQuestion, currentStatus, currentIndex, mathValue])

  const completeSession = useCallback(async () => {
    setSessionState('complete')
    if (sessionRecord) {
      try {
        await practiceService.completeSession(sessionRecord.id, earnedXp)
        // Invalidate all related caches to synchronize XP, leaderboard, and mastery UI instantly
        queryClient.invalidateQueries({ queryKey: queryKeys.learner.profile })
        queryClient.invalidateQueries({ queryKey: queryKeys.learner.mastery })
        queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard.global })
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
        queryClient.invalidateQueries({ queryKey: queryKeys.practice.sessions })
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.aggregated })
      } catch (e) {
        console.error('Failed to complete session', e)
      }
    }
  }, [earnedXp, queryClient, sessionRecord])

  const handleGrade = useCallback(async (grade: FSRSGrade) => {
    if (!currentStatus || !sessionRecord || !currentQuestion) return
    const timeTaken = Math.round((Date.now() - currentStatus.startTime) / 1000)
    setQuestionStates((prev) => ({
      ...prev,
      [currentIndex]: { ...prev[currentIndex], grade: grade }
    }))
    try {
      await practiceService.submitInteraction({
        session: sessionRecord.id,
        question: currentQuestion.id,
        user_response: currentStatus.userResponse || mathValue || 'N/A',
        is_correct: grade > 1,
        time_taken_seconds: timeTaken,
        confidence_rating: grade
      })
    } catch (err) {
      console.error("Failed to submit interaction", err)
    }
    setMathValue('')
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
  }, [completeSession, currentIndex, currentQuestion, currentStatus, mathValue, questions.length, sessionRecord])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
        // Only intercept Enter for MathInput if we are not answered
        if (e.key === 'Enter' && (!currentStatus || currentStatus.answerState !== 'answered')) {
          e.preventDefault();
          handleSubmitMathAnswer();
        }
        return;
      }

      if (sessionState !== 'practicing' || !currentQuestion || !currentStatus) return;

      const key = e.key;
      const isMCQ = currentQuestion.choices && currentQuestion.choices.length > 0;
      const isAnswered = currentStatus.answerState === 'answered';

      if (!isAnswered && isMCQ) {
        if (key === '1' && currentQuestion.choices[0]) handleAnswer(currentQuestion.choices[0]);
        if (key === '2' && currentQuestion.choices[1]) handleAnswer(currentQuestion.choices[1]);
        if (key === '3' && currentQuestion.choices[2]) handleAnswer(currentQuestion.choices[2]);
        if (key === '4' && currentQuestion.choices[3]) handleAnswer(currentQuestion.choices[3]);
      }

      if (isAnswered) {
        if (key === '1') handleGrade(1);
        if (key === '2') handleGrade(2);
        if (key === '3') handleGrade(3);
        if (key === '4') handleGrade(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, currentStatus, handleAnswer, handleGrade, handleSubmitMathAnswer, sessionState])

  if (sessionState === 'selecting') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageIntro
          eyebrow="Practice session"
          title="Ready for a focused review?"
          description="Start an adaptive FSRS session and we will pull the next questions from your learner queue without changing the rest of the site structure."
          icon={<TestTube2 className="h-6 w-6" />}
          tone="primary"
          actions={(
            <Button
              onClick={startSession}
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight className="h-4 w-4 rtl:rotate-180" /> : undefined}
            >
              Start session
            </Button>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PageStatCard
            icon={<Target className="h-5 w-5" />}
            label="Question set"
            value="Up to 10"
            helper="Adaptive review mix"
            tone="primary"
          />
          <PageStatCard
            icon={<Clock className="h-5 w-5" />}
            label="Estimated time"
            value="10-15 min"
            helper="Depends on question type"
            tone="secondary"
          />
          <PageStatCard
            icon={<Zap className="h-5 w-5" />}
            label="Reward"
            value="Tier XP"
            helper="More for harder items"
            tone="accent"
          />
        </div>

        <Card>
          <SectionHeading
            title="How this session works"
            description="Answer each question, then rate how easy recall felt so the scheduler can adapt future reviews."
          />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="surface-inset">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                1. Solve
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Complete each question in order with either a multiple-choice answer or a math entry.
              </p>
            </div>
            <div className="surface-inset">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                2. Reflect
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                After each answer, rate how hard recall felt so FSRS can tune the next interval.
              </p>
            </div>
            <div className="surface-inset">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                3. Keep momentum
              </p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                XP is awarded as you move through the set, so even short sessions still push progress forward.
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
          eyebrow="Session complete"
          title="Nice work"
          description="Your practice session is finished. The results have been sent back into the review schedule so the next queue can stay aligned."
          icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
          tone="success"
          actions={(
            <Link to="/learner/progress">
              <Button rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>
                View progress
              </Button>
            </Link>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PageStatCard
            icon={<Trophy className="h-5 w-5" />}
            label="XP earned"
            value={`+${earnedXp}`}
            tone="accent"
          />
          <PageStatCard
            icon={<Target className="h-5 w-5" />}
            label="Questions completed"
            value={questions.length}
            tone="primary"
          />
          <PageStatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Session status"
            value="Saved"
            helper="Review data synced"
            tone="success"
          />
        </div>

        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Keep the momentum going
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                You can jump back to the dashboard or review your updated progress before starting another session.
              </p>
            </div>
            <Link to="/learner">
              <Button variant="outline">Back to dashboard</Button>
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
            Loading your current practice question...
          </p>
        </div>
      </Card>
    )
  }

  const isMCQ = currentQuestion.choices && currentQuestion.choices.length > 0
  const isAnswered = currentStatus.answerState === 'answered'
  const sessionProgress = ((currentIndex + 1) / questions.length) * 100
  const elapsedSeconds = Math.round((Date.now() - currentStatus.startTime) / 1000)

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                Question {currentIndex + 1} of {questions.length}
              </Badge>
              <Badge variant="outline" size="sm">
                Tier {currentQuestion.tier}
              </Badge>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Practice in progress
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {currentQuestion.topic_name}
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Progress</span>
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
                  Solve the next prompt
                </p>
                <h2 className="text-2xl font-semibold leading-8 text-neutral-900 dark:text-neutral-100">
                  {currentQuestion.text}
                </h2>
              </div>

              {isMCQ ? (
                <div className="grid gap-3">
                  {currentQuestion.choices.map((choice: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(choice)}
                      disabled={isAnswered}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-start transition-colors',
                        currentStatus.userResponse === choice
                          ? currentStatus.isCorrect
                            ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-200'
                            : 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-200'
                          : 'border-neutral-200 bg-white hover:border-primary-400 hover:bg-primary-50/40 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-primary-950/20',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {!isAnswered && (
                          <kbd className="inline-flex h-6 w-6 items-center justify-center rounded border border-neutral-300 bg-neutral-100 font-sans text-xs font-semibold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                            {index + 1}
                          </kbd>
                        )}
                        <span className="text-base font-medium">{choice}</span>
                      </div>
                      <span className="shrink-0">
                        {isAnswered && index === currentQuestion.correct_answer_index ? (
                          <CheckCircle className={cn(
                            'h-5 w-5',
                            currentStatus.userResponse === choice ? 'text-green-700 dark:text-green-300' : 'text-green-500',
                          )} />
                        ) : null}
                        {currentStatus.userResponse === choice && !currentStatus.isCorrect ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl bg-primary-50 p-4 text-sm text-primary-800 dark:bg-primary-950/20 dark:text-primary-200">
                    <Mic2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
                    <p>Write your proof, expression, or math answer below and submit it when you are ready.</p>
                  </div>

                  <MathInput
                    value={mathValue}
                    onChange={setMathValue}
                    placeholder="$\text{Write your answer here...}$"
                    className="min-h-[160px] rounded-2xl bg-white dark:bg-neutral-950"
                    disabled={isAnswered}
                  />

                  {!isAnswered ? (
                    <Button onClick={handleSubmitMathAnswer} disabled={!mathValue} className="gap-2">
                      Submit answer
                      <kbd className="hidden sm:inline-flex h-5 items-center justify-center rounded border border-primary-400/30 bg-primary-600 px-1.5 font-sans text-[10px] font-medium text-white shadow-sm">
                        Enter
                      </kbd>
                    </Button>
                  ) : (
                    <Card className="border-green-200 bg-green-50/70 dark:border-green-900/40 dark:bg-green-950/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-300" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">
                            Answer recorded
                          </p>
                          <p className="mt-1 text-sm text-green-800/80 dark:text-green-200/80">
                            {mathValue}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isAnswered && (
            <Card>
              <SectionHeading
                title="How difficult was that recall?"
                description="Your rating feeds the next interval for this item."
              />
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { grade: 1, label: 'Again', tone: 'bg-red-500 hover:bg-red-600', sub: 'Very hard' },
                  { grade: 2, label: 'Hard', tone: 'bg-orange-500 hover:bg-orange-600', sub: 'Needed effort' },
                  { grade: 3, label: 'Good', tone: 'bg-primary-500 hover:bg-primary-600', sub: 'Solid recall' },
                  { grade: 4, label: 'Easy', tone: 'bg-green-600 hover:bg-green-700', sub: 'Instant recall' },
                ].map((button) => (
                  <button
                    key={button.grade}
                    onClick={() => handleGrade(button.grade as FSRSGrade)}
                    className={cn(
                      'rounded-2xl px-4 py-4 text-center text-white transition-transform hover:-translate-y-0.5',
                      button.tone,
                    )}
                  >
                    <p className="text-sm font-semibold flex items-center justify-center gap-2">
                      <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border border-white/30 bg-white/10 font-sans text-[10px] font-bold text-white">
                        {button.grade}
                      </kbd>
                      {button.label}
                    </p>
                    <p className="mt-1 text-xs text-white/80">{button.sub}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-4">
          <PageStatCard
            icon={<Zap className="h-5 w-5" />}
            label="Session XP"
            value={`+${earnedXp}`}
            helper="Updates during the set"
            tone="secondary"
          />

          <Card>
            <SectionHeading
              title="Session details"
              description="Small, useful telemetry instead of a second oversized panel."
            />
            <div className="mt-4 space-y-4">
              <div className="surface-inset grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                    Elapsed
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                    {elapsedSeconds}s
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                    Difficulty
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">
                    Tier {currentQuestion.tier}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Queue progress</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {Math.round(sessionProgress)}%
                  </span>
                </div>
                <ProgressBar value={sessionProgress} variant="secondary" />
              </div>

              <Badge variant="outline" size="sm">
                Adaptive FSRS scheduling enabled
              </Badge>
            </div>
          </Card>

          {currentQuestion.explanation_video_url && (
            <Card className="border-primary-200 bg-primary-50/70 dark:border-primary-900/40 dark:bg-primary-950/20">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Explanation video
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Open the supporting explanation for this question in a new tab.
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open(currentQuestion.explanation_video_url ?? undefined, '_blank')}
                >
                  Watch explanation
                </Button>
              </div>
            </Card>
          )}

          <Card className="border-dashed">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  Tip
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Use the rating buttons after each answer honestly. That is what keeps the next session size and spacing reasonable.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
