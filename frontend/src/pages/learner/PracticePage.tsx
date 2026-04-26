import { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Trophy,
  Zap,
  PlayCircle,
  PartyPopper,
  Clock,
  Dna,
  Atom,
  TestTube2,
  Lightbulb,
  CheckCircle2,
  Activity,
  Binary,
  Target,
  ArrowRight,
  ChevronRight,
  Mic2
} from 'lucide-react'
import { Card, CardContent, Button, Badge, ProgressBar } from '@/components/ui'
import { MathInput } from '@/components/MathInput'
import { practiceService } from '@/services/practice'
import { cn } from '@/utils/cn'

/**
 * PracticePage (Experiment Mode)
 * Re-imagined as a high-stakes focus environment.
 */

type SessionState = 'selecting' | 'practicing' | 'complete'
type AnswerState = 'unanswered' | 'answered'
type FSRSGrade = 1 | 2 | 3 | 4 // Again, Hard, Good, Easy

interface Question {
  id: number
  text: string
  choices: string[]
  correct_answer_index: number
  tier: number
  explanation_video_url?: string
  topic_name: string
  topic_id: number
}

interface QuestionState {
  questionId: number
  userResponse: string | null
  answerState: AnswerState
  isCorrect: boolean | null
  grade: FSRSGrade | null
  startTime: number
}

export function PracticePage() {
  const [sessionState, setSessionState] = useState<SessionState>('selecting')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionRecord, setSessionRecord] = useState<any>(null)
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
      setQuestions(data.questions)
      
      const session = await practiceService.createSession({ 
        session_type: data.session_type 
      })
      setSessionRecord(session)
      
      const initialStates: Record<number, QuestionState> = {}
      data.questions.forEach((q: Question, idx: number) => {
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
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (choice: string) => {
    if (!currentStatus || currentStatus.answerState === 'answered') return
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
  }

  const handleSubmitMathAnswer = () => {
    if (!mathValue || !currentStatus || currentStatus.answerState === 'answered') return
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
  }

  const handleGrade = async (grade: FSRSGrade) => {
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
  }

  const completeSession = () => {
    setSessionState('complete')
    if (sessionRecord) {
      practiceService.completeSession(sessionRecord.id, earnedXp)
    }
  }

  if (sessionState === 'selecting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-lab relative overflow-hidden">
        {/* Neural Grid Overlay */}
        <div className="absolute inset-0 bg-neural-grid opacity-20" />
        <div className="absolute inset-0 bg-scanline opacity-10 pointer-events-none" />

        <div className="max-w-xl w-full stagger-in relative z-10">
          <Card className="glass p-12 text-center rounded-[3rem] border-neutral-200/50 dark:border-white/5 shadow-2xl space-y-8">
            <div className="relative mx-auto w-32 h-32">
               <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-ping" />
               <div className="relative w-full h-full rounded-full bg-linear-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white shadow-xl">
                  <TestTube2 className="w-16 h-16 opacity-80" />
               </div>
            </div>
            
            <div className="space-y-4">
               <h1 className="text-4xl font-black font-display tracking-tight text-neutral-950 dark:text-white leading-tight">
                 Prepare for <br/>Experiment<span className="text-primary-600">.</span>
               </h1>
               <p className="text-neutral-500 dark:text-neutral-400 font-medium max-w-sm mx-auto leading-relaxed">
                 Calibrating adaptive FSRS matrix. Ensure focus is maintained. High-priority concepts ahead.
               </p>
            </div>

            <Button 
              className="w-full h-20 bg-neutral-950 dark:bg-white text-white dark:text-neutral-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white transition-all group"
              onClick={startSession}
              disabled={isLoading}
            >
              {isLoading ? 'Decrypting Inventory...' : 'Initiate Sequence'}
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
            
            <div className="flex justify-center gap-8">
               <div className="text-center">
                  <p className="text-xl font-black text-neutral-800 dark:text-neutral-200">10</p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tasks</p>
               </div>
               <div className="w-px h-8 bg-neutral-100 dark:bg-neutral-800" />
               <div className="text-center">
                  <p className="text-xl font-black text-neutral-800 dark:text-neutral-200">15m</p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Est. Duration</p>
               </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (sessionState === 'complete') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 stagger-in bg-lab min-h-screen">
        <Card className="glass border-0 overflow-hidden rounded-[3.5rem] bg-lab">
          <div className="bg-neutral-950 p-16 text-center text-white relative">
            <div className="absolute inset-0 bg-scanline opacity-10" />
            <div className="absolute top-8 right-8 text-[12px] font-mono text-white/40 tracking-[0.5em] uppercase">Status: Success</div>
            
            <div className="relative w-24 h-24 mx-auto mb-8">
               <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
               <div className="w-full h-full rounded-full border-4 border-emerald-500 flex items-center justify-center">
                  <PartyPopper className="w-12 h-12 text-emerald-500" />
               </div>
            </div>
            <h2 className="text-5xl font-black font-display tracking-tight mb-4 leading-none">Discovery Report<span className="text-emerald-500">.</span></h2>
            <p className="text-neutral-400 text-lg font-medium max-w-sm mx-auto">Neural pathways have been significantly reinforced and stabilized.</p>
          </div>
          
          <CardContent className="p-12 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 rounded-[2.5rem] bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex flex-col items-center">
                <Trophy className="w-10 h-10 text-amber-500 mb-4" />
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">XP Harvested</p>
                <p className="text-5xl font-black text-neutral-900 dark:text-white leading-none">+{earnedXp}</p>
              </div>
              <div className="p-10 rounded-[2.5rem] bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex flex-col items-center">
                <Activity className="w-10 h-10 text-primary-500 mb-4" />
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Global Stability</p>
                <p className="text-5xl font-black text-neutral-900 dark:text-white leading-none">100<span className="text-xl">%</span></p>
              </div>
            </div>

            <Button className="w-full h-20 bg-neutral-950 dark:bg-white text-white dark:text-neutral-900 rounded-[2.2rem] text-sm font-black uppercase tracking-[0.4em] shadow-2xl group" onClick={() => window.location.href='/learner/dashboard'}>
               Commit Lab Log
               <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion || !currentStatus) return (
      <div className="min-h-screen flex items-center justify-center bg-lab">
          <Dna className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
  )

  const isMCQ = currentQuestion.choices && currentQuestion.choices.length > 0
  const isAnswered = currentStatus.answerState === 'answered'

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 bg-lab min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-neural-grid opacity-10 pointer-events-none" />
      
      {/* Dynamic Telemetry Header */}
      <div className="flex items-center justify-between mb-12 relative z-10 px-4">
        <div className="flex items-center gap-6 flex-1 max-w-md">
           <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                 <span>Transmission Progress</span>
                 <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
              </div>
              <ProgressBar 
                value={((currentIndex + 1) / questions.length) * 100} 
                className="h-1.5 bg-neutral-200 dark:bg-neutral-800"
                indicatorClassName="bg-primary-600"
              />
           </div>
           <Badge className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-mono text-[10px] tracking-widest px-4 py-1.5 rounded-full border-0">
             PKT_{currentIndex + 1}.{questions.length}
           </Badge>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
           <div className="text-end">
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Active Stream</p>
              <p className="text-xs font-mono text-neutral-800 dark:text-neutral-200 font-bold uppercase">{currentQuestion.topic_name}</p>
           </div>
           <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Stable Link</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        <div className="lg:col-span-8 space-y-10">
          {/* Main Focus Card */}
          <Card className="glass border-0 rounded-[3rem] shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
               <Binary className="w-48 h-48 rotate-12" />
            </div>
            
            <CardContent className="p-10 md:p-14 space-y-12">
              <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400 font-black text-[10px] tracking-[0.3em] uppercase">
                <Atom className="w-4 h-4" />
                <span>Sector Identification Protocol</span>
                <ChevronRight className="w-3 h-3 text-neutral-300" />
                <span className="text-neutral-900 dark:text-white">Tier {currentQuestion.tier}</span>
              </div>

              <div className="relative">
                <h3 className="text-3xl md:text-4xl font-black text-neutral-950 dark:text-white leading-[1.2] font-display tracking-tight">
                  {currentQuestion.text}
                </h3>
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary-600 rounded-full opacity-40" />
              </div>

              {isMCQ ? (
                <div className="grid gap-4">
                  {currentQuestion.choices.map((choice: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(choice)}
                      disabled={isAnswered}
                      className={cn(
                        "w-full text-start p-6 md:p-8 rounded-[1.8rem] border-2 transition-all duration-500 flex items-center justify-between group relative overflow-hidden",
                        currentStatus.userResponse === choice 
                          ? (currentStatus.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-red-500 border-red-500 text-white') 
                          : 'bg-white/40 dark:bg-neutral-900/40 border-neutral-100/50 dark:border-neutral-800/50 hover:border-primary-500 hover:bg-white dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      )}
                    >
                      <span className="text-lg font-bold tracking-tight z-10">{choice}</span>
                      <div className="flex items-center gap-4 z-10">
                         {isAnswered && idx === currentQuestion.correct_answer_index && (
                           <CheckCircle className={cn(
                             "w-7 h-7 text-white animate-zoom-in",
                             currentStatus.userResponse !== choice && "text-emerald-500"
                           )} />
                         )}
                         {currentStatus.userResponse === choice && !currentStatus.isCorrect && (
                           <XCircle className="w-7 h-7 text-white animate-zoom-in" />
                         )}
                         <div className="p-2 rounded-xl bg-neutral-100/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4" />
                         </div>
                      </div>
                      
                      {/* Interactive background effect for hovered button */}
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary-500/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                   <div className="p-6 bg-primary-500/5 border border-primary-500/20 rounded-2xl flex items-center gap-4 text-primary-700 dark:text-primary-300">
                      <Mic2 className="w-6 h-6 text-primary-500" />
                      <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                         Conceptual Discovery: Formulate proof/expression in high-precision field.
                      </p>
                   </div>
                   <div className="relative p-1 bg-linear-to-br from-primary-500/20 to-secondary-500/20 rounded-[2rem] shadow-inner">
                      <MathInput 
                        value={mathValue} 
                        onChange={setMathValue} 
                        placeholder="$\text{Formulate your hypothesis here...}$"
                        className="min-h-[160px] bg-white dark:bg-neutral-950 rounded-[1.4rem] border-0"
                        disabled={isAnswered}
                      />
                   </div>
                   {!isAnswered && (
                     <Button 
                       className="w-full h-20 bg-neutral-950 dark:bg-white text-white dark:text-neutral-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl"
                       onClick={handleSubmitMathAnswer}
                       disabled={!mathValue}
                     >
                        Commit Hypothesis
                     </Button>
                   )}
                   {isAnswered && (
                     <Card className="border-emerald-500/30 bg-emerald-500/5 rounded-[2rem] p-8 border animate-slide-in">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-4 flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4" /> Hypothesized Outcome Recorded
                        </p>
                        <div className="text-xl font-mono text-neutral-800 dark:text-neutral-100 p-6 bg-white/40 dark:bg-neutral-900/40 rounded-2xl border border-white/20 shadow-inner">
                           {mathValue}
                        </div>
                     </Card>
                   )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* FSRS Calibration Interface */}
          {isAnswered && (
            <Card className="glass border-0 rounded-[3rem] p-10 md:p-14 stagger-in animate-in fade-in slide-in-from-bottom duration-1000 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              
              <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-primary-600 text-white flex items-center justify-center shadow-xl shrink-0">
                  <Lightbulb className="w-10 h-10 opacity-80" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-neutral-950 dark:text-white uppercase tracking-tighter">Self-Stability Analysis</h4>
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed max-w-sm">
                    Evaluate the neural overhead required for this retrieval session to optimize your FSRS model.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                  { grade: 1, label: 'Collapse', color: 'bg-red-500 shadow-xl shadow-red-500/20', sub: 'Critical Load' },
                  { grade: 2, label: 'High Load', color: 'bg-orange-500', sub: 'Cognitive Strain' },
                  { grade: 3, label: 'Steady', color: 'bg-primary-600 shadow-xl shadow-primary-500/20', sub: 'Fluid Recall' },
                  { grade: 4, label: 'Instant', color: 'bg-emerald-600 shadow-xl shadow-emerald-500/20', sub: 'Zero Overhead' }
                ].map((btn) => (
                  <button
                    key={btn.grade}
                    onClick={() => handleGrade(btn.grade as FSRSGrade)}
                    className="group"
                  >
                    <div className={cn(
                       "flex flex-col items-center justify-center h-28 rounded-[1.8rem] transition-all duration-500 border-2 border-transparent text-white relative overflow-hidden",
                       btn.color,
                       "group-hover:-translate-y-2 group-hover:scale-105"
                    )}>
                       <div className="absolute inset-0 bg-scanline opacity-10" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">{btn.label}</span>
                       <span className="text-[9px] font-bold opacity-70 group-hover:opacity-100 transition-opacity uppercase">{btn.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Global Telemetry Sidebar */}
        <div className="lg:col-span-4 space-y-8 stagger-in">
          <Card className="glass border-0 rounded-[2.5rem] p-10 bg-lab relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <Activity className="w-12 h-12" />
            </div>
            
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
               <Zap className="w-4 h-4 text-primary-500" /> 
               Lab Telemetry
            </h4>

            <div className="space-y-10">
              <div className="space-y-2">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Stability Gain</p>
                    <p className="text-3xl font-black text-secondary-600 leading-none">+{earnedXp}</p>
                 </div>
                 <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary-500 w-2/3 shadow-[0_0_10px_secondary-500]" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Active Clock</p>
                    <div className="flex items-center gap-2 font-mono text-lg font-black text-neutral-800 dark:text-neutral-200">
                       <Clock className="w-4 h-4 text-primary-500" />
                       {Math.round((Date.now() - currentStatus.startTime)/1000)}s
                    </div>
                 </div>
                 <div className="text-end space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Target ID</p>
                    <p className="text-lg font-mono font-black text-neutral-800 dark:text-neutral-200">#TK_{currentQuestion.id}</p>
                 </div>
              </div>

              <div className="pt-8 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                 <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest leading-relaxed">Optimization Status</p>
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[11px] font-black uppercase text-neutral-800 dark:text-neutral-200 tracking-wider">FSRS Core: Optimized</span>
                 </div>
                 <Badge className="w-full bg-neutral-50 dark:bg-neutral-800/80 rounded-xl h-9 flex items-center justify-center border-0 text-neutral-500 text-[10px] font-black uppercase tracking-widest shadow-inner">
                    Adaptive Scaling Enabled
                 </Badge>
              </div>
            </div>
          </Card>

          {currentQuestion.explanation_video_url && (
            <Card className="glass border-0 rounded-[2.5rem] p-10 bg-primary-600 text-white shadow-2xl hover:scale-[1.03] transition-all relative overflow-hidden group">
              <div className="absolute inset-0 bg-scanline opacity-10" />
              <div className="relative z-10 space-y-6">
                <PlayCircle className="w-12 h-12 opacity-80 mb-4 group-hover:scale-110 transition-transform duration-500" />
                <h4 className="text-2xl font-black font-display tracking-tight leading-none uppercase">Visual <br/>Decryption</h4>
                <p className="text-primary-100 text-xs font-medium leading-relaxed opacity-80">
                  Access the neural mapping video to decrypt the conceptual structure of this sector.
                </p>
                <Button 
                  className="w-full h-14 bg-white text-primary-700 hover:bg-neutral-100 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl border-0"
                  onClick={() => window.open(currentQuestion.explanation_video_url, '_blank')}
                >
                  Analyze Stream
                </Button>
              </div>
            </Card>
          )}

          <div className="p-10 rounded-[3rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800/50 flex flex-col items-center opacity-60">
             <Target className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-4 animate-spin-slow" />
             <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.5em] text-center">
               Laboratory <br/>Focus Mode
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
