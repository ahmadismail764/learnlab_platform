import { useTranslation } from 'react-i18next'
import { 
  Trophy, 
  Zap, 
  Clock, 
  BookOpen,
  Star,
  Award,
  CheckCircle,
  Lock,
  Binary,
  Target,
  FlaskConical,
  Beaker,
  ShieldAlert,
  Fingerprint
} from 'lucide-react'
import { Card, ProgressBar, Badge, Button } from '@/components/ui'
import { cn } from '@/utils/cn'

/**
 * AchievementsPage (Research Milestones)
 * Re-imagined as clinical breakthroughs in a research environment.
 */

interface Achievement {
  id: string
  nameKey: string
  descriptionKey: string
  icon: any
  emoji: string
  earned: boolean
  earnedDate?: string
  progress?: number
  requirement: string
  xpReward: number
  category: 'learning' | 'mastery' | 'consistency' | 'special'
}

const achievements: Achievement[] = [
  {
    id: 'first-steps',
    nameKey: 'Initial Calibration',
    descriptionKey: 'Successfully completed the first diagnostic simulation.',
    icon: Target,
    emoji: '🎯',
    earned: true,
    earnedDate: 'Jan 15, 2026',
    requirement: 'Complete 1 practice session',
    xpReward: 50,
    category: 'learning',
  },
  {
    id: 'math-whiz',
    nameKey: 'Pattern Recognition',
    descriptionKey: 'Detected 100 discrete mathematical regularities.',
    icon: Zap,
    emoji: '🧮',
    earned: true,
    earnedDate: 'Jan 28, 2026',
    requirement: 'Answer 100 questions correctly',
    xpReward: 200,
    category: 'learning',
  },
  {
    id: 'question-master',
    nameKey: 'Neural Saturation',
    descriptionKey: 'Reached a state of high-density knowledge acquisition.',
    icon: Award,
    emoji: '📚',
    earned: false,
    progress: 72,
    requirement: 'Answer 500 questions correctly (360/500)',
    xpReward: 500,
    category: 'learning',
  },
  {
    id: 'perfect-score',
    nameKey: 'Absolute Precision',
    descriptionKey: 'Zero-entropy state achieved in session metrics.',
    icon: Star,
    emoji: '⭐',
    earned: false,
    progress: 0,
    requirement: 'Complete a session with 100% accuracy',
    xpReward: 150,
    category: 'mastery',
  },
  {
    id: 'topic-master',
    nameKey: 'Sector Authority',
    descriptionKey: 'Established peak stability in a knowledge sector.',
    icon: Trophy,
    emoji: '🏆',
    earned: true,
    earnedDate: 'Feb 1, 2026',
    requirement: 'Reach 90% mastery in a topic',
    xpReward: 300,
    category: 'mastery',
  },
  {
    id: 'logic-expert',
    nameKey: 'Axiomatic Mastery',
    descriptionKey: 'Total integration of logical frameworks.',
    icon: BookOpen,
    emoji: '🔢',
    earned: false,
    progress: 45,
    requirement: 'Master all subtopics in a category',
    xpReward: 400,
    category: 'mastery',
  },
  {
    id: 'consistent-learner',
    nameKey: 'Synaptic Rhythm',
    descriptionKey: 'Maintained cognitive connectivity for 7 cycles.',
    icon: Clock,
    emoji: '📅',
    earned: true,
    earnedDate: 'Jan 22, 2026',
    requirement: 'Practice for 7 consecutive days',
    xpReward: 250,
    category: 'consistency',
  },
  {
    id: 'week-warrior',
    nameKey: 'Temporal Resilience',
    descriptionKey: 'Sustained laboratory presence for a lunar cycle.',
    icon: Award,
    emoji: '🗓️',
    earned: false,
    progress: 75,
    requirement: 'Complete weekly goals for 4 weeks',
    xpReward: 350,
    category: 'consistency',
  }
]

const categoryLabels: Record<string, string> = {
  learning: 'Simulation Data',
  mastery: 'Cognitive Peaks',
  consistency: 'Temporal Logs',
  special: 'Anomalies',
}

const categoryIcons: Record<string, any> = {
  learning: Binary,
  mastery: FlaskConical,
  consistency: Clock,
  special: Star,
}

export function AchievementsPage() {
  const { t: _t } = useTranslation(['gamification', 'learner', 'common'])

  const earnedCount = achievements.filter(a => a.earned).length
  const totalXPEarned = achievements.filter(a => a.earned).reduce((sum, a) => sum + a.xpReward, 0)

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)

  return (
    <div className="stagger-in space-y-12 pb-20 pt-4">
      {/* High-Impact Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-neutral-200 dark:border-neutral-800 pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-primary-600 rounded-full" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Milestone Tracker // Dossier</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight text-neutral-950 dark:text-white leading-none">
            Research <br/>Milestones<span className="text-primary-600">.</span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            Verification of breakthroughs and cognitive expansion cycles. Locked specimens require further neural engagement.
          </p>
        </div>

        <div className="flex gap-4">
           <div className="p-8 bg-neutral-950 rounded-[2rem] text-white flex flex-col justify-between h-48 w-56 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-scanline opacity-10" />
              <Fingerprint className="w-8 h-8 text-primary-500 animate-pulse" />
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Efficiency Index</p>
                 <p className="text-4xl font-black">{Math.round((earnedCount / achievements.length) * 100)}%</p>
              </div>
           </div>
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Milestones Secured', val: `${earnedCount}/${achievements.length}`, icon: Trophy, color: 'text-amber-500' },
          { label: 'Bios XP Accumulated', val: totalXPEarned, icon: Zap, color: 'text-primary-500' },
          { label: 'Specimen Fidelity', val: 'OPTIMAL', icon: Beaker, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <Card key={i} className="glass border-neutral-200/50 dark:border-neutral-800/50 p-6 rounded-[2rem] hover:scale-105 transition-all">
             <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center">
                   <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className="text-end">
                   <p className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{stat.val}</p>
                   <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-2">{stat.label}</p>
                </div>
             </div>
          </Card>
        ))}
      </div>

      {/* Categorical Breakdown */}
      {(Object.keys(groupedAchievements)).map((category) => {
        const Icon = categoryIcons[category]
        const items = groupedAchievements[category] || []
        const earned = items.filter(a => a.earned).length

        return (
          <div key={category} className="space-y-8">
            <div className="flex items-center justify-between px-2 pt-8 border-t border-neutral-100 dark:border-neutral-800/50">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-lg">
                     <Icon className="w-5 h-5 opacity-80" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{categoryLabels[category]}</h2>
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Sequence ID: MT-{category.substring(0,3).toUpperCase()}</p>
                  </div>
               </div>
               <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-black px-4 py-1.5 rounded-full border-0">
                  {earned} / {items.length}
               </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((achievement) => {
                const AchievementIcon = achievement.icon
                return (
                  <Card 
                    key={achievement.id} 
                    className={cn(
                      "glass group relative overflow-hidden transition-all rounded-[2.5rem] p-8 border-neutral-200/50 dark:border-neutral-800/50",
                      !achievement.earned && "grayscale opacity-60"
                    )}
                  >
                    {!achievement.earned && <div className="absolute inset-0 bg-neutral-900/5 backdrop-blur-[1px] z-10" />}
                    
                    <div className="relative z-20 space-y-6">
                       <div className="flex justify-between items-start">
                          <div className={cn(
                             "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-2xl transition-transform group-hover:scale-110 duration-700",
                             achievement.earned ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-400"
                          )}>
                             {achievement.earned ? <AchievementIcon className="w-8 h-8 opacity-90" /> : <Lock className="w-6 h-6" />}
                          </div>
                          {achievement.earned ? (
                             <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                             </div>
                          ) : (
                             <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <ShieldAlert className="w-4 h-4 text-orange-500" />
                             </div>
                          )}
                       </div>

                       <div className="space-y-1">
                          <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight leading-none uppercase">{achievement.nameKey}</h3>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Protocol: #{achievement.id.toUpperCase()}</p>
                       </div>

                       <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                          {achievement.descriptionKey}
                       </p>

                       <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                          {achievement.earned ? (
                             <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                   <p className="text-[8px] font-bold text-neutral-400 uppercase">Verification Date</p>
                                   <p className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">{achievement.earnedDate}</p>
                                </div>
                                <Badge className="bg-primary-500 text-white font-black px-3 py-1 rounded-lg">+{achievement.xpReward} XP</Badge>
                             </div>
                          ) : (
                             <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1 text-neutral-500">
                                   <span>Securing Milestone...</span>
                                   <span>{achievement.progress || 0}%</span>
                                </div>
                                <ProgressBar value={achievement.progress || 0} className="h-1 bg-neutral-100 dark:bg-neutral-800" indicatorClassName="bg-primary-500" />
                                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{achievement.requirement}</p>
                             </div>
                          )}
                       </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Global Progress Footer */}
      <Card className="bg-neutral-950 border-0 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute inset-0 bg-scanline opacity-10" />
         <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary-500/20 rounded-full blur-[100px]" />
         <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary-500/20 rounded-full blur-[100px]" />
         
         <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-2xl mx-auto">
            <div className="w-16 h-1 bg-primary-500" />
            <h3 className="text-3xl md:text-4xl font-black font-display tracking-tight leading-tight uppercase">
               Neural Breakthrough <br/>Archive Locked
            </h3>
            <p className="text-neutral-400 text-lg font-medium leading-relaxed">
               Secure 5 more milestones to unlock the "Neural Architect" verification level and access the Advanced Laboratory suites.
            </p>
            <Button className="h-16 px-12 bg-white text-neutral-900 hover:bg-neutral-200 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl border-0">
               Accelerate Research
            </Button>
         </div>
      </Card>
    </div>
  )
}
