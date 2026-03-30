import { 
<<<<<<< HEAD
  BookOpen, 
  Target, 
  Clock,
  ChevronRight,
  Zap,
  Sparkles
=======
  Target, 
  Sparkles,
  History,
  Zap,
  Activity,
  Binary,
  Dna,
  Microscope,
  TrendingUp
>>>>>>> backend-updates
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, Button, Badge, ProgressBar } from '@/components/ui'
import { useCurrentUser } from '@/contexts'
<<<<<<< HEAD

/**
 * StudentDashboard
 * 
 * Main landing page for students showing:
 * - Welcome message with brand-gradient hero card
 * - Progress overview with branded stat cards
 * - Topics due for review
 * - Recent achievements
 * RTL-aware with full i18n support.
=======
import { cn } from '@/utils/cn'

/**
 * StudentDashboard (Neural Overview)
 * 
 * Re-imagined as a high-tech researcher clinical dashboard.
 * Features:
 * - Scanning grid backgrounds
 * - Pulse indicators
 * - Clinical data labels
>>>>>>> backend-updates
 */

export function StudentDashboard() {
  const { t } = useTranslation(['student', 'common', 'topics', 'gamification'])
  const user = useCurrentUser()

  // Mock data - will come from API
  const stats = {
    questionsToday: 12,
    totalMastered: 156,
    topicsInProgress: 6,
    topicsDue: 3,
    totalXP: 1250,
  }

<<<<<<< HEAD
  // Discrete Mathematics topics - FSRS due for review
  const topicsDueForReview = [
    { id: '1', nameKey: 'topics:logic.propositional', progress: 68, icon: '🔢', questionsLeft: 8 },
    { id: '2', nameKey: 'topics:sets.operations', progress: 45, icon: '∪', questionsLeft: 15 },
    { id: '3', nameKey: 'topics:relations.equivalence', progress: 82, icon: '≡', questionsLeft: 4 },
  ]

  const achievements = [
    { id: '1', nameKey: 'gamification:achievements.firstSteps', icon: '🎯', earned: true },
    { id: '2', nameKey: 'gamification:achievements.mathWhiz', icon: '🧮', earned: true },
    { id: '3', nameKey: 'gamification:achievements.perfectScore', icon: '⭐', earned: false },
  ]

  return (
    <div className="space-y-6">
      {/* Hero — branded gradient with decorative nodes */}
      <Card className="relative overflow-hidden bg-linear-to-br from-primary-600 via-primary-500 to-secondary-600 text-white border-0">
        {/* Decorative graph nodes */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <circle cx="500" cy="30" r="6" fill="white"/>
            <circle cx="540" cy="80" r="4" fill="white"/>
            <circle cx="460" cy="100" r="5" fill="white"/>
            <circle cx="520" cy="150" r="7" fill="white"/>
            <circle cx="400" cy="60" r="3" fill="white"/>
            <line x1="500" y1="30" x2="540" y2="80" stroke="white" strokeWidth="1.5"/>
            <line x1="540" y1="80" x2="520" y2="150" stroke="white" strokeWidth="1.5"/>
            <line x1="460" y1="100" x2="520" y2="150" stroke="white" strokeWidth="1.5"/>
            <line x1="400" y1="60" x2="460" y2="100" stroke="white" strokeWidth="1.5"/>
            <line x1="500" y1="30" x2="400" y2="60" stroke="white" strokeWidth="1.5"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent-300" />
              <p className="text-white/70 text-sm">{t('student:todaysProgress')}</p>
            </div>
            <h1 className="text-2xl font-bold font-display">
              {t('student:welcomeBack', { name: user.firstName })}
            </h1>
            <p className="text-3xl font-bold mt-2 font-display">
              {t('student:questionsAnsweredToday', { count: stats.questionsToday })}
            </p>
            <p className="text-white/70 text-sm mt-1">
              {t('student:topicsProgress', { due: stats.topicsDue })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/student/practice">
              <Button 
                variant="outline" 
                className="border-white/50 dark:border-white/50 text-white hover:bg-white/20 hover:border-white/70 dark:hover:bg-white/20 dark:hover:border-white/70 backdrop-blur-sm"
                rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {t('student:startSession')}
              </Button>
            </Link>
=======
  const topicsDueForReview = [
    { id: '1', nameKey: 'topics:logic.propositional', progress: 68, icon: <Binary className="w-6 h-6" />, count: 8, status: 'Critical' },
    { id: '2', nameKey: 'topics:sets.operations', progress: 45, icon: <Dna className="w-6 h-6" />, count: 15, status: 'Degrading' },
    { id: '3', nameKey: 'topics:relations.equivalence', progress: 82, icon: <Microscope className="w-6 h-6" />, count: 4, status: 'Stable' },
  ]

  return (
    <div className="stagger-in space-y-8 min-h-screen pb-20">
      {/* Header Info Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6 pt-2">
        <div>
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-1">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Link: Active</span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight text-neutral-900 dark:text-white">
            Lab Overview<span className="text-primary-600">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-end">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Verification ID</p>
            <p className="text-sm font-mono text-neutral-800 dark:text-neutral-200">#USER_{user.id?.toString().padStart(4, '0')}</p>
          </div>
          <div className="h-10 w-px bg-neutral-200 dark:bg-neutral-800" />
          <div className="text-end">
             <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Last Sync</p>
             <p className="text-sm font-mono text-neutral-800 dark:text-neutral-200">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* Hero Card - The "Processor" Unit */}
      <Card className="relative overflow-hidden bg-neutral-900 border-0 shadow-2xl rounded-[2rem] group">
        <div className="absolute inset-0 bg-linear-to-br from-primary-900/50 via-neutral-900 to-secondary-900/50 opacity-60" />
        
        {/* Animated Scanline Overlay */}
        <div className="absolute inset-0 bg-scanline opacity-20" />
        
        {/* Decorative Grid SVG */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="innerGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#innerGrid)" />
          </svg>
        </div>

        <div className="relative z-10 p-8 md:p-12 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary-500/20 text-primary-400 border-primary-500/30 font-black tracking-[0.1em] px-3 py-1 text-[10px] uppercase">
                  Biological Researcher
                </Badge>
                <div className="flex gap-1">
                   {[1,2,3].map(idx => <div key={idx} className="w-1 h-3 bg-primary-500/40 rounded-full" />)}
                </div>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight font-display tracking-tighter">
                Identify <br/>Your Limits<span className="text-primary-500">.</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Session Quota</p>
                <p className="text-3xl font-black text-white">{stats.questionsToday}<span className="text-lg text-neutral-500 font-medium ml-1">/20</span></p>
              </div>
              <div className="space-y-1 border-l border-white/10 pl-8">
                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Neural XP</p>
                <p className="text-3xl font-black text-white">{stats.totalXP}</p>
              </div>
              <div className="hidden sm:block space-y-1 border-l border-white/10 pl-8">
                <p className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Mastery Level</p>
                <p className="text-3xl font-black text-white">Lvl. 14</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto p-4 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl relative">
             <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-primary-500/50">
                <Zap className="w-6 h-6 text-white fill-current" />
             </div>
             <div className="p-8 space-y-6 flex flex-col items-center text-center">
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center relative p-4 group-hover:rotate-12 transition-transform duration-1000">
                   <div className="absolute inset-0 rounded-full border-2 border-primary-500/30 animate-spin-slow" />
                   <div className="w-full h-full rounded-full bg-linear-to-br from-primary-500 to-secondary-600 flex items-center justify-center shadow-inner">
                      <Binary className="w-12 h-12 text-white opacity-80" />
                   </div>
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-white">Start Simulation</h3>
                   <p className="text-white/50 text-xs font-bold leading-relaxed max-w-[180px]">
                      Engage adaptive FSRS logic for optimized retrieval.
                   </p>
                </div>
                <Link to="/student/practice" className="w-full">
                  <Button size="lg" className="w-full bg-white text-neutral-900 hover:bg-neutral-200 h-14 rounded-2xl font-black uppercase tracking-wider shadow-lg">
                    Engage Module
                  </Button>
                </Link>
             </div>
>>>>>>> backend-updates
          </div>
        </div>
      </Card>

<<<<<<< HEAD
      {/* Stats Grid — branded icon backgrounds */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.totalMastered}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:questionsMastered')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.topicsInProgress}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:activeTopics')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-100 dark:bg-accent-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{stats.totalXP}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('gamification:totalXP')}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-primary-700 dark:text-primary-300" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">2.5h</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('student:thisWeek')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topics Due for Review */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display text-neutral-800 dark:text-neutral-100">{t('student:todaysQueue')}</h2>
            <Link to="/student/topics" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              {t('common:viewAll')}
            </Link>
          </div>
          
          <div className="space-y-3">
            {topicsDueForReview.map((topic) => (
              <Link key={topic.id} to={`/student/practice?topic=${topic.id}`} className="block group">
                <Card hoverable padding="sm" className="group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-2xl shrink-0">
                      {topic.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-medium text-neutral-800 dark:text-neutral-100">{t(topic.nameKey)}</h3>
                        <Badge variant="primary" size="sm">
                          {t('student:topicsLeft', { count: topic.questionsLeft })}
                        </Badge>
                      </div>
                      <ProgressBar value={topic.progress} size="sm" showLabel={false} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 rtl:rotate-180 transition-colors" />
                  </div>
=======
      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Mastered Topics', val: stats.totalMastered, icon: Target, trend: '+4.2%', color: 'border-b-emerald-500' },
          { label: 'Brain Stability', val: '86%', icon: Activity, trend: '+2.1%', color: 'border-b-primary-500' },
          { label: 'Synaptic Streak', val: '12d', icon: History, trend: '+3', color: 'border-b-orange-500' },
          { label: 'Weekly Growth', val: '+450', icon: TrendingUp, trend: 'Top 10%', color: 'border-b-secondary-500' },
        ].map((stat, idx) => (
          <Card key={idx} className={cn("glass group relative overflow-hidden transition-all hover:-translate-y-1", stat.color, "border-b-2 border-r-0 border-l-0 border-t-0")}>
            <div className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-neutral-900 dark:text-white leading-none">{stat.val}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                   <stat.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <span className="text-[10px] font-black text-emerald-500">{stat.trend}</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary-500/20 shadow-[0_0_10px_primary-500] animate-scanline-fast opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active Specimens (Topics) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Specimen Queue<span className="text-primary-600">.</span></h3>
            <Link to="/student/topics" className="text-xs font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest">Catalog →</Link>
          </div>

          <div className="grid gap-4">
            {topicsDueForReview.map((topic) => (
              <Link key={topic.id} to={`/student/practice?topic=${topic.id}`} className="block group">
                <Card className="glass group-hover:border-primary-500/40 transition-all border-neutral-200/50 dark:border-white/5 relative overflow-hidden">
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:bg-primary-600 transition-colors">
                      {topic.icon}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                           <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Active Specimen</p>
                           <h4 className="text-xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight">{t(topic.nameKey)}</h4>
                        </div>
                        <Badge variant="outline" className={cn(
                          "px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                          topic.status === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                          topic.status === 'Degrading' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        )}>
                          {topic.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                           <div className="flex justify-between text-[9px] font-black text-neutral-500 uppercase tracking-tighter mb-1">
                              <span>Stability Matrix</span>
                              <span>{topic.progress}%</span>
                           </div>
                           <ProgressBar value={topic.progress} size="sm" className="bg-neutral-100 dark:bg-neutral-800 h-1.5" indicatorClassName="bg-primary-500" />
                        </div>
                        <div className="flex items-center justify-end gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                           <div className="text-end">
                              <p className="text-neutral-400">Queue</p>
                              <p className="text-neutral-800 dark:text-neutral-200">#{topic.count}</p>
                           </div>
                           <div className="text-end">
                              <p className="text-neutral-400">Score</p>
                              <p className="text-neutral-800 dark:text-neutral-200">A+</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
>>>>>>> backend-updates
                </Card>
              </Link>
            ))}
          </div>
        </div>

<<<<<<< HEAD
        {/* Achievements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display text-neutral-800 dark:text-neutral-100">{t('student:achievements')}</h2>
            <Link to="/student/achievements" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              {t('common:viewAll')}
            </Link>
          </div>
          
          <Card>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`flex flex-col items-center p-3 rounded-xl transition-transform hover:scale-[1.02] ${
                    achievement.earned 
                      ? 'bg-accent-50 dark:bg-accent-900/20 ring-1 ring-accent-200/50 dark:ring-accent-800/30' 
                      : 'bg-neutral-100 dark:bg-neutral-800 opacity-50'
                  }`}
                >
                  <span className="text-2xl mb-1">{achievement.icon}</span>
                  <span className={`text-xs text-center font-medium ${
                    achievement.earned ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {t(achievement.nameKey)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
=======
        {/* Sidebar Dossier */}
        <div className="space-y-8">
           <Card className="glass p-6 space-y-6 relative overflow-hidden bg-dot-pattern">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Researcher Dossier</h3>
              
              <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                 <div className="w-12 h-12 rounded-full ring-2 ring-primary-500/20 p-0.5">
                    <div className="w-full h-full rounded-full bg-primary-600 flex items-center justify-center text-white font-black">
                       {user.firstName?.charAt(0)}
                    </div>
                 </div>
                 <div>
                    <p className="text-sm font-black text-neutral-800 dark:text-neutral-100">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Lead Investigator</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800 pb-2">Completed Breakthroughs</p>
                 <div className="grid grid-cols-4 gap-2">
                    {[1,2,3,4,5,6].map(idx => (
                       <div key={idx} className={cn(
                          "aspect-square rounded-xl flex items-center justify-center text-lg",
                          idx <= 2 ? "bg-accent-500 text-white shadow-lg" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 opacity-40 shadow-inner"
                       )}>
                          {idx === 1 ? '🥇' : idx === 2 ? '🎓' : '🔒'}
                       </div>
                    ))}
                 </div>
              </div>

              <Link to="/student/achievements" className="block pt-2">
                 <Button fullWidth variant="outline" className="rounded-xl border-neutral-200 dark:border-neutral-800 text-xs font-black uppercase tracking-widest h-11">
                    Full Bio
                 </Button>
              </Link>
           </Card>

           <div className="p-1 rounded-3xl bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
              <div className="bg-white dark:bg-neutral-950 p-6 rounded-[1.4rem] space-y-3 relative overflow-hidden">
                 <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Neural Calibration</span>
                 </div>
                 <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                    Critical degradation detected in <span className="text-neutral-900 dark:text-white font-black underline decoration-primary-500/50">Equivalence Relations</span>. Initiation suggested.
                 </p>
                 <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Binary className="w-12 h-12" />
                 </div>
              </div>
           </div>
>>>>>>> backend-updates
        </div>
      </div>
    </div>
  )
}
