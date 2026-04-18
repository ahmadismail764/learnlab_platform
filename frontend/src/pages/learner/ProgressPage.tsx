// import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { 
  Target,
  Clock,
  Brain,
  Zap,
  Activity,
  History,
  Binary,
  Dna
} from 'lucide-react'
import { Card, CardHeader, CardContent, Badge, Button } from '@/components/ui'
import { ProgressBar } from '@/components/ui/Progress'

/**
 * ProgressPage (Synaptic Analysis)
 * Re-imagined as a categorical session report.
 */

interface TopicProgress {
  id: string
  nameKey: string
  icon: string
  mastery: number
  questionsAnswered: number
  questionsTotal: number
  stability: number // FSRS stability score (days)
  nextReview: string
  state: 'new' | 'learning' | 'review' | 'mastered'
}

const weeklyStats = {
  questionsAnswered: 87,
  questionsCorrect: 72,
  timeSpent: '4h 32m',
  xpEarned: 1850,
  topicsReviewed: 12,
  averageAccuracy: 83,
}

const monthlyProgress = [
  { week: 'Week 1', questions: 45, accuracy: 78 },
  { week: 'Week 2', questions: 62, accuracy: 81 },
  { week: 'Week 3', questions: 58, accuracy: 85 },
  { week: 'Week 4', questions: 87, accuracy: 83 },
]

const topicProgressList: TopicProgress[] = [
  {
    id: '1',
    nameKey: 'Propositional Logic',
    icon: '→',
    mastery: 85,
    questionsAnswered: 45,
    questionsTotal: 50,
    stability: 14.5,
    nextReview: 'In 3 days',
    state: 'mastered'
  },
  {
    id: '2',
    nameKey: 'Set Operations',
    icon: '∩',
    mastery: 72,
    questionsAnswered: 32,
    questionsTotal: 45,
    stability: 7.2,
    nextReview: 'Tomorrow',
    state: 'review'
  },
  {
    id: '3',
    nameKey: 'Equivalence Relations',
    icon: '~',
    mastery: 45,
    questionsAnswered: 18,
    questionsTotal: 40,
    stability: 2.1,
    nextReview: 'Today',
    state: 'learning'
  }
]

export function ProgressPage() {
  // const { t } = useTranslation(['learner', 'topics', 'common', 'gamification'])

  return (
    <div className="stagger-in space-y-12 pb-20 pt-4">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-neutral-200 dark:border-neutral-800 pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-secondary-600 rounded-full" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Analysis Unit 07 // Feedback</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight text-neutral-950 dark:text-white leading-none">
            Synaptic <br/>Analysis<span className="text-secondary-600">.</span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            Detailed telemetry of your cognitive expansion. Monitor stability trends and recalibrate your learning trajectory.
          </p>
        </div>

        <div className="flex gap-4">
           <div className="p-8 bg-neutral-950 rounded-[2rem] text-white flex flex-col justify-between h-48 w-56 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-scanline opacity-10" />
              <Activity className="w-8 h-8 text-secondary-500 animate-pulse" />
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Accuracy Vector</p>
                 <p className="text-4xl font-black">{weeklyStats.averageAccuracy}%</p>
              </div>
           </div>
        </div>
      </div>

      {/* Overview Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Atomic Steps', val: weeklyStats.questionsAnswered, icon: Target, color: 'text-primary-600' },
          { label: 'Time Allocated', val: weeklyStats.timeSpent, icon: Clock, color: 'text-amber-500' },
          { label: 'Stability Gain', val: weeklyStats.xpEarned, icon: Zap, color: 'text-emerald-500' },
          { label: 'Active Topics', val: weeklyStats.topicsReviewed, icon: Activity, color: 'text-secondary-600' },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="glass border-neutral-200/50 dark:border-neutral-800/50 p-6 rounded-[2rem] hover:scale-105 transition-all">
               <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center">
                     {Icon && <Icon className={cn("w-6 h-6", stat.color)} />}
                  </div>
                  <div className="text-end">
                     <p className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{stat.val}</p>
                     <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-2">{stat.label}</p>
                  </div>
               </div>
            </Card>
          )
        })}
      </div>

      {/* Chronological Stability Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <Card className="lg:col-span-8 glass border-0 rounded-[3rem] shadow-xl overflow-hidden">
          <CardHeader className="p-10 pb-0 border-0">
             <div className="flex items-center gap-3 text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">
                <Activity className="w-4 h-4" />
                <span>Stability Distribution</span>
             </div>
             <h3 className="text-3xl font-black text-neutral-900 dark:text-white mt-2">Monthly Horizon</h3>
          </CardHeader>
          <CardContent className="p-10 pt-8">
            <div className="space-y-8">
              {monthlyProgress.map((week, index) => {
                const maxQuestions = Math.max(...monthlyProgress.map(w => w.questions))
                const barWidth = (week.questions / maxQuestions) * 100

                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                        WAVE {index + 1}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {week.questions} PKT / {week.accuracy}% ACC
                        </span>
                      </div>
                    </div>
                    <div className="h-12 bg-neutral-100 dark:bg-neutral-900 rounded-2xl overflow-hidden relative group">
                      <div className="absolute inset-0 bg-scanline opacity-[0.05]" />
                      <div 
                        className="h-full bg-linear-to-r from-secondary-600 to-secondary-500 rounded-2xl shadow-xl transition-all duration-1000 origin-left"
                        style={{ width: `${barWidth}%` }}
                      >
                         <div className="h-full w-full opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)]" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-8">
           <Card className="glass border-0 rounded-[3rem] p-10 bg-neutral-900 text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-scanline opacity-10" />
              <div className="relative z-10 space-y-6">
                 <Brain className="w-12 h-12 text-primary-500 opacity-80" />
                 <h4 className="text-2xl font-black font-display tracking-tight leading-none uppercase">FSRS v4.0 <br/>Calibration</h4>
                 <p className="text-neutral-400 text-xs font-medium leading-relaxed">
                    Your stability scores are calculated using the 4th generation Free Spaced Repetition Scheduler.
                 </p>
                 <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Model Fidelity</span>
                       <span className="text-xs font-mono font-bold text-emerald-500">OPTIMAL</span>
                    </div>
                    <ProgressBar value={96} className="h-1 bg-white/5" indicatorClassName="bg-emerald-500" />
                 </div>
              </div>
           </Card>

           <div className="p-10 rounded-[3rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800/50 flex flex-col items-center">
              <History className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-4 animate-spin-slow" />
              <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.5em] text-center leading-relaxed">
                Neural History <br/>Archive Locked
              </p>
           </div>
        </div>
      </div>

      {/* Sector Breakdown */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
           <div className="space-y-1">
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Sector Stability</h2>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Individual Specimen Performance</p>
           </div>
           <Link to="/learner/topics">
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-neutral-200 dark:border-neutral-800 font-black uppercase tracking-widest text-[10px]">
                 Access Inventory
              </Button>
           </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topicProgressList.map((topic) => (
            <Card key={topic.id} className="glass rounded-[2.5rem] p-8 border-neutral-200/50 dark:border-neutral-800/50 hover:-translate-y-2 transition-transform shadow-sm group">
              <div className="flex justify-between items-start mb-8">
                 <div className="w-14 h-14 rounded-2xl bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center text-white text-2xl shadow-xl group-hover:bg-secondary-600 transition-colors">
                    <Binary className="w-6 h-6 opacity-80" />
                 </div>
                 <Badge className={cn(
                    "font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest border-0",
                    topic.state === 'mastered' ? 'bg-emerald-500/10 text-emerald-500' :
                    topic.state === 'review' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-primary-500/10 text-primary-500'
                 )}>
                    {topic.state}
                 </Badge>
              </div>

              <div className="space-y-1 mb-8">
                 <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">{topic.nameKey}</h3>
                 <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Sector ID: SC-{topic.id.padStart(3, '0')}</p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-neutral-400">Stability Meter</span>
                       <span className="text-secondary-600">{topic.mastery}%</span>
                    </div>
                    <ProgressBar value={topic.mastery} className="h-1.5 bg-neutral-100 dark:bg-neutral-800" indicatorClassName="bg-secondary-600" />
                 </div>

                 <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <div>
                       <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Stability</p>
                       <p className="text-lg font-black text-neutral-800 dark:text-neutral-200">{topic.stability}d</p>
                    </div>
                    <div className="text-end">
                       <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Next Wave</p>
                       <p className="text-lg font-black text-neutral-800 dark:text-neutral-200">{topic.nextReview}</p>
                    </div>
                 </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Accuracy Vector Card */}
      <Card className="bg-linear-to-br from-secondary-600 to-secondary-800 border-0 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-scanline opacity-10" />
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Dna className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="max-w-xl relative z-10 space-y-6">
           <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Activity className="w-8 h-8" />
           </div>
           <h3 className="text-3xl font-black font-display tracking-tight leading-tight uppercase">Cognitive Precision <br/>Calibration</h3>
           <p className="text-secondary-100 text-lg font-medium leading-relaxed">
              Your current accuracy vector is 83%. The system recommends targeting high-entropy sectors to maximize neural growth.
           </p>
           <Button className="h-16 px-10 bg-white text-secondary-700 hover:bg-neutral-100 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl border-0">
              Increase Intensity
           </Button>
        </div>
      </Card>
    </div>
  )
}
