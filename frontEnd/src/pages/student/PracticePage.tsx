import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  ChevronLeft,
  Lightbulb,
  BookOpen,
  Trophy,
  Zap,
  Send,
  PlayCircle,
  PartyPopper
} from 'lucide-react'
import { Card, CardContent, Button, Badge, ProgressBar } from '@/components/ui'
import { MathInput } from '@/components/MathInput'
import { sampleQuestions, essayQuestionsPool, type SampleQuestion } from '@/data'

/**
 * PracticePage
 * 
 * Interactive practice session for Discrete Mathematics.
 * Features:
 * - Multiple choice and true/false questions
 * - Progressive hints
 * - Step-by-step solutions
 * - XP rewards and progress tracking
 * 
 * RTL-aware with i18n support.
 */

type SessionState = 'selecting' | 'practicing' | 'complete'
type AnswerState = 'unanswered' | 'correct' | 'incorrect'

interface QuestionState {
  questionId: string
  selectedAnswer: string | null
  essayAnswer: string // For essay type questions
  answerState: AnswerState
  hintsShown: number
  showSolution: boolean
}

export function PracticePage() {
  const { t } = useTranslation(['practice', 'common', 'topics'])
  
  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('selecting')
  const [sessionQuestions, setSessionQuestions] = useState<SampleQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [questionStates, setQuestionStates] = useState<Map<string, QuestionState>>(new Map())
  const [totalXP, setTotalXP] = useState(0)
  
  // Current question
  const currentQuestion = sessionQuestions[currentIndex]
  const currentState = currentQuestion ? questionStates.get(currentQuestion.id) : null

  // Auto-close virtual keyboard when navigating to a non-essay question
  useEffect(() => {
    if (currentQuestion && currentQuestion.answerType !== 'essay') {
      if (window.mathVirtualKeyboard?.visible) {
        window.mathVirtualKeyboard.hide()
      }
    }
  }, [currentQuestion])

  // Start a new practice session
  const startSession = useCallback((questionCount: number = 6, includeEssay: boolean = true) => {
    // Get random MC questions
    const mcShuffled = [...sampleQuestions].sort(() => Math.random() - 0.5)
    let selected: SampleQuestion[] = []
    
    if (includeEssay) {
      // Include 1-2 essay questions in the mix
      const essayShuffled = [...essayQuestionsPool].sort(() => Math.random() - 0.5)
      const essayCount = Math.min(2, essayShuffled.length)
      const mcCount = questionCount - essayCount
      
      selected = [
        ...mcShuffled.slice(0, mcCount),
        ...essayShuffled.slice(0, essayCount),
      ].sort(() => Math.random() - 0.5) // Mix them together
    } else {
      selected = mcShuffled.slice(0, questionCount)
    }
    
    // Initialize question states
    const states = new Map<string, QuestionState>()
    selected.forEach(q => {
      states.set(q.id, {
        questionId: q.id,
        selectedAnswer: null,
        essayAnswer: '',
        answerState: 'unanswered',
        hintsShown: 0,
        showSolution: false,
      })
    })
    
    setSessionQuestions(selected)
    setQuestionStates(states)
    setCurrentIndex(0)
    setTotalXP(0)
    setSessionState('practicing')
  }, [])

  // Handle answer selection
  const selectAnswer = useCallback((answer: string) => {
    if (!currentQuestion || !currentState || currentState.answerState !== 'unanswered') return
    
    const isCorrect = answer === currentQuestion.correctAnswer
    
    setQuestionStates(prev => {
      const newStates = new Map(prev)
      newStates.set(currentQuestion.id, {
        ...currentState,
        selectedAnswer: answer,
        answerState: isCorrect ? 'correct' : 'incorrect',
      })
      return newStates
    })
    
    if (isCorrect) {
      // Calculate XP (reduce for hints used)
      const hintPenalty = currentState.hintsShown * 5
      const earned = Math.max(currentQuestion.xpReward - hintPenalty, 5)
      setTotalXP(prev => prev + earned)
    }
  }, [currentQuestion, currentState])

  // Update essay answer (for MathInput)
  const updateEssayAnswer = useCallback((latex: string) => {
    if (!currentQuestion || !currentState || currentState.answerState !== 'unanswered') return
    
    setQuestionStates(prev => {
      const newStates = new Map(prev)
      newStates.set(currentQuestion.id, {
        ...currentState,
        essayAnswer: latex,
      })
      return newStates
    })
  }, [currentQuestion, currentState])

  // Submit essay answer
  const submitEssayAnswer = useCallback(() => {
    if (!currentQuestion || !currentState || currentState.answerState !== 'unanswered') return
    if (!currentState.essayAnswer.trim()) return

    const userAnswer = currentState.essayAnswer.trim().toLowerCase()
    const correctAnswer = (currentQuestion.correctAnswer as string).toLowerCase()
    
    // Check if answer matches correct answer or any alternative
    const alternatives = (currentQuestion as SampleQuestion & { alternativeAnswers?: string[] }).alternativeAnswers || []
    const allAccepted = [correctAnswer, ...alternatives.map(a => a.toLowerCase())]
    
    // Normalize LaTeX for comparison
    const normalizeLatex = (s: string) => s
      .replace(/\\s+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\\left/g, '')
      .replace(/\\right/g, '')
      .trim()
    
    const normalizedUser = normalizeLatex(userAnswer)
    const isCorrect = allAccepted.some(accepted => {
      const normalizedAccepted = normalizeLatex(accepted)
      return normalizedUser === normalizedAccepted || 
             normalizedUser.includes(normalizedAccepted) ||
             normalizedAccepted.includes(normalizedUser)
    })
    
    setQuestionStates(prev => {
      const newStates = new Map(prev)
      newStates.set(currentQuestion.id, {
        ...currentState,
        answerState: isCorrect ? 'correct' : 'incorrect',
      })
      return newStates
    })
    
    if (isCorrect) {
      const hintPenalty = currentState.hintsShown * 5
      const earned = Math.max(currentQuestion.xpReward - hintPenalty, 5)
      setTotalXP(prev => prev + earned)
    }
  }, [currentQuestion, currentState])

  // Show next hint
  const showHint = useCallback(() => {
    if (!currentQuestion || !currentState) return
    if (!currentQuestion.hints || currentState.hintsShown >= currentQuestion.hints.length) return
    
    setQuestionStates(prev => {
      const newStates = new Map(prev)
      newStates.set(currentQuestion.id, {
        ...currentState,
        hintsShown: currentState.hintsShown + 1,
      })
      return newStates
    })
  }, [currentQuestion, currentState])

  // Toggle solution visibility
  const toggleSolution = useCallback(() => {
    if (!currentQuestion || !currentState) return
    
    setQuestionStates(prev => {
      const newStates = new Map(prev)
      newStates.set(currentQuestion.id, {
        ...currentState,
        showSolution: !currentState.showSolution,
      })
      return newStates
    })
  }, [currentQuestion, currentState])

  // Navigation
  const goToNext = useCallback(() => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setSessionState('complete')
    }
  }, [currentIndex, sessionQuestions.length])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  // Calculate session stats
  const getSessionStats = useCallback(() => {
    let correct = 0
    let answered = 0
    
    questionStates.forEach(state => {
      if (state.answerState !== 'unanswered') {
        answered++
        if (state.answerState === 'correct') correct++
      }
    })
    
    return {
      correct,
      answered,
      total: sessionQuestions.length,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    }
  }, [questionStates, sessionQuestions.length])

  // Generate answer options for multiple choice
  const getAnswerOptions = (question: SampleQuestion): string[] => {
    if (question.answerType === 'true-false') {
      return ['true', 'false']
    }
    
    // For multiple choice, generate plausible wrong answers based on question
    const correct = question.correctAnswer as string
    
    // Question-specific wrong answers
    const wrongAnswers: Record<string, string[]> = {
      'logic-1': ['P ∧ Q', 'Q → P', 'P ↔ Q'],
      'logic-2': ['FALSE', 'UNDEFINED', 'Cannot be determined'],
      'sets-1': ['{1, 2, 5, 6}', '{1, 2, 3, 4, 5, 6}', '{3}'],
      'sets-2': ['6', '3', '9'],
      'relations-1': [], // true-false
      'relations-2': ['{..., -3, 0, 3, 6, 9, ...}', '{..., -5, -2, 1, 4, 7, ...}', '{2, 5}'],
      'comb-1': ['12', '16', '4'],
      'comb-2': ['21', '42', '210'],
      'graph-1': ['7', '10', '12'],
      'graph-2': ['6', '4', '3'],
      'num-1': ['12', '3', '9'],
      'num-2': ['7', '10', '0'],
    }
    
    const options = [correct, ...(wrongAnswers[question.id] || ['Option A', 'Option B', 'Option C'])]
    return options.sort(() => Math.random() - 0.5)
  }

  // Render topic selection screen
  if (sessionState === 'selecting') {
    // UC-03 Alternate Flow 2a: Simulate checking if topics are due
    // In production, this comes from the FSRS scheduler via API
    const topicsDue: number = 3 // Mock: set to 0 to see the "all caught up" state

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
            {t('practice:practiceSession')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('practice:testKnowledge')}
          </p>
        </div>

        {/* UC-03 Alternate Flow 2a: All caught up state */}
        {topicsDue === 0 ? (
          <Card className="max-w-lg mx-auto text-center py-10">
            <CardContent>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                {t('practice:allCaughtUp')}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                {t('practice:allCaughtUpDescription')}
              </p>
              <Button variant="outline" onClick={() => startSession(4)}>
                {t('practice:reviewMastered')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Card hoverable className="cursor-pointer" onClick={() => startSession(4)}>
                <CardContent className="text-center py-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{t('practice:quickPractice')}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('practice:questionsMinutes', { count: 4, minutes: 5 })}</p>
                </CardContent>
              </Card>

              <Card hoverable className="cursor-pointer border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/20" onClick={() => startSession(6)}>
                <CardContent className="text-center py-6">
                  <div className="w-12 h-12 bg-primary-500 dark:bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{t('practice:standardSession')}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('practice:questionsMinutes', { count: 6, minutes: 10 })}</p>
                  <Badge variant="primary" size="sm" className="mt-2">{t('practice:recommended')}</Badge>
                </CardContent>
              </Card>

              <Card hoverable className="cursor-pointer" onClick={() => startSession(10)}>
                <CardContent className="text-center py-6">
                  <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{t('practice:challengeMode')}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('practice:questionsMinutes', { count: 10, minutes: 15 })}</p>
                </CardContent>
              </Card>
            </div>

            {/* Topic preview */}
            <Card className="max-w-3xl mx-auto">
              <CardContent>
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">{t('practice:topicsCovered')}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{t('topics:logic.title')}</Badge>
                  <Badge variant="secondary">{t('topics:sets.title')}</Badge>
                  <Badge variant="secondary">{t('topics:relations.title')}</Badge>
                  <Badge variant="secondary">{t('topics:combinatorics.title')}</Badge>
                  <Badge variant="secondary">{t('topics:graphTheory.title')}</Badge>
                  <Badge variant="secondary">{t('topics:numberTheory.title')}</Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  // Render session complete screen
  if (sessionState === 'complete') {
    const stats = getSessionStats()
    
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card className="text-center py-8">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
            {t('practice:sessionComplete')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">{t('practice:greatWork')}</p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.correct}/{stats.total}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('practice:questionsAnswered')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-3xl font-bold text-secondary-600 dark:text-secondary-400">{stats.accuracy}%</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('practice:accuracy')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-3xl font-bold text-accent-600 dark:text-accent-400">+{totalXP}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('practice:xpEarned')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-3xl font-bold text-neutral-600 dark:text-neutral-300">{new Set(sessionQuestions.map(q => q.topicId)).size}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('practice:topicsReviewed')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            fullWidth
            onClick={() => setSessionState('selecting')}
          >
            {t('common:done')}
          </Button>
          <Button 
            variant="primary" 
            fullWidth
            onClick={() => startSession(6)}
          >
            {t('practice:practiceAgain')}
          </Button>
        </div>
      </div>
    )
  }

  // Render practice question
  if (!currentQuestion || !currentState) {
    return <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">{t('practice:loading')}</div>
  }

  const stats = getSessionStats()
  const answerOptions = getAnswerOptions(currentQuestion)
  const tierLabels: Record<number, string> = {
    1: t('practice:difficulty.tier1'),
    2: t('practice:difficulty.tier2'),
    3: t('practice:difficulty.tier3'),
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{t(currentQuestion.topicKey)}</Badge>
          <Badge 
            variant={currentQuestion.tier === 1 ? 'success' : currentQuestion.tier === 2 ? 'warning' : 'error'}
            size="sm"
          >
            {tierLabels[currentQuestion.tier]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <Zap className="w-4 h-4 text-accent-500" />
          <span>+{totalXP} XP</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
          <span>{t('practice:questionOf', { current: currentIndex + 1, total: sessionQuestions.length })}</span>
          <span>{stats.correct} {t('practice:correct')}</span>
        </div>
        <ProgressBar 
          value={(currentIndex / sessionQuestions.length) * 100} 
          size="sm" 
          showLabel={false}
        />
      </div>

      {/* Question card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {/* Question text */}
          <div className="mb-6">
            <p className="text-lg text-neutral-800 dark:text-neutral-100 leading-relaxed">
              {currentQuestion.content}
            </p>
            {currentQuestion.answerType === 'essay' && (
              <Badge variant="secondary" size="sm" className="mt-2">
                {t('practice:essayQuestion')}
              </Badge>
            )}
          </div>

          {/* Answer section - different for MC vs Essay */}
          {currentQuestion.answerType === 'essay' ? (
            // Essay answer with MathInput
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('practice:yourAnswer')}
              </label>
              <MathInput
                value={currentState.essayAnswer}
                onChange={updateEssayAnswer}
                placeholder={t('practice:enterMathExpression')}
                readOnly={currentState.answerState !== 'unanswered'}
                showKeyboard={true}
                className="mb-3"
              />
              
              {currentState.answerState === 'unanswered' && (
                <Button
                  variant="primary"
                  onClick={submitEssayAnswer}
                  disabled={!currentState.essayAnswer.trim()}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  {t('practice:submitAnswer')}
                </Button>
              )}

              {/* Show correct answer after submission */}
              {currentState.answerState !== 'unanswered' && (
                <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t('practice:correctAnswer')}:</p>
                  <p className="font-mono text-neutral-800 dark:text-neutral-100">{currentQuestion.correctAnswer as string}</p>
                </div>
              )}
            </div>
          ) : (
            // Multiple choice answer options
            <div className="space-y-3 mb-6">
              {answerOptions.map((option, index) => {
                const isSelected = currentState.selectedAnswer === option
                const isCorrectAnswer = option === currentQuestion.correctAnswer
                const showResult = currentState.answerState !== 'unanswered'
                
                let className = 'w-full p-4 text-start rounded-lg border-2 transition-all '
                
                if (showResult) {
                  if (isCorrectAnswer) {
                    className += 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  } else if (isSelected && !isCorrectAnswer) {
                    className += 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                  } else {
                    className += 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                  }
                } else {
                  className += isSelected 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-neutral-800 dark:text-neutral-100'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 text-neutral-800 dark:text-neutral-100'
                }

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && selectAnswer(option)}
                    disabled={showResult}
                    className={className}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 font-medium">{option}</span>
                      {showResult && isCorrectAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {showResult && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>
                )
            })}
            </div>
          )}

          {/* Feedback */}
          {currentState.answerState !== 'unanswered' && (
            <div className={`p-4 rounded-lg mb-4 ${
              currentState.answerState === 'correct' 
                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {currentState.answerState === 'correct' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t('practice:correct')}
                    <span className="ms-auto text-green-600 dark:text-green-400">+{currentQuestion.xpReward} XP</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    {t('practice:incorrect')}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Hints section */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && currentState.answerState === 'unanswered' && (
            <div className="mb-4">
              {currentState.hintsShown > 0 && (
                <div className="space-y-2 mb-3">
                  {currentQuestion.hints.slice(0, currentState.hintsShown).map((hint, i) => (
                    <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{hint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {currentState.hintsShown < currentQuestion.hints.length && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  leftIcon={<Lightbulb className="w-4 h-4" />}
                  onClick={showHint}
                >
                  {t('practice:showHint')} ({currentQuestion.hints.length - currentState.hintsShown} left)
                </Button>
              )}
            </div>
          )}

          {/* Solution steps */}
          {currentState.answerState !== 'unanswered' && (
            <div>
              <Button 
                variant="ghost" 
                size="sm"
                leftIcon={<BookOpen className="w-4 h-4" />}
                onClick={toggleSolution}
              >
                {currentState.showSolution ? t('practice:hideSolution') : t('practice:showSolution')}
              </Button>
              
              {currentState.showSolution && (
                <div className="mt-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <h4 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">{t('practice:solutionSteps')}</h4>
                  <ol className="space-y-2">
                    {currentQuestion.solutionSteps.map((step) => (
                      <li key={step.order} className="flex gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 flex items-center justify-center shrink-0 text-xs font-medium">
                          {step.order}
                        </span>
                        <span className="text-neutral-700 dark:text-neutral-300">{step.content}</span>
                      </li>
                    ))}
                  </ol>

                  {/* UC-03 Alternate Flow 3a: Watch Explanation (placeholder — video URL from backend) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<PlayCircle className="w-4 h-4" />}
                    className="mt-3 text-primary-600 dark:text-primary-400"
                    onClick={() => { /* Will open explanation video when backend provides URL */ }}
                  >
                    {t('practice:watchExplanation')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          leftIcon={<ChevronLeft className="w-4 h-4 rtl:rotate-180" />}
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          {t('practice:previousQuestion')}
        </Button>
        
        <Button
          variant="primary"
          rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
          onClick={goToNext}
          disabled={currentState.answerState === 'unanswered'}
        >
          {currentIndex === sessionQuestions.length - 1 
            ? t('practice:endSession')
            : t('practice:nextQuestion')
          }
        </Button>
      </div>
    </div>
  )
}
