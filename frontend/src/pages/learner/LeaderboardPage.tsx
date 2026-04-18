import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Medal,
  Flame,
  Crown,
  ChevronUp,
  ChevronDown,
  WifiOff,
  Sparkles,
  Search,
  LayoutGrid,
  Activity,
  Binary,
  Dna
} from 'lucide-react'
import { Card, Badge, Avatar, Button, ProgressBar } from '@/components/ui'
import { learnersService } from '@/services/learners'
import { topicsService } from '@/services/topics'
import { cn } from '@/utils/cn'

/**
 * LeaderboardPage (Hall of Fame)
 * Re-imagined as a global ranking metrics display with clinical laboratory visuals.
 */

interface LeaderboardEntry {
  id: number | string
  name: string
  avatar?: string
  xp: number
  streak: number
  accuracy: number
  rank: number
  rank_change: number
  is_current_user?: boolean
}

export function LeaderboardPage() {
  const { t: _t } = useTranslation(['gamification', 'common'])
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'allTime'>('week')
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'topic'>('global')
  const [topics, setTopics] = useState<any[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchTopics = async () => {
      try {
        const data = await topicsService.getTopics()
        const results = Array.isArray(data) ? data : (data.results || [])
        if (isMounted) {
            setTopics(results)
            if (results.length > 0) setSelectedTopicId(results[0].id.toString())
        }
      } catch (err) {
        console.error("Failed to fetch topics", err)
      }
    }
    fetchTopics()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setIsLoading(true)
      try {
        let data;
        if (leaderboardType === 'global') {
            data = await learnersService.getLeaderboard()
        } else {
            if (!selectedTopicId) {
                setIsLoading(false);
                return;
            }
            data = await learnersService.getTopicLeaderboard(selectedTopicId)
        }
        const results = Array.isArray(data) ? data : (data.results || [])
        
        const mappedResults: LeaderboardEntry[] = results.map((e: any, index: number) => ({
          id: e.id,
          name: e.user ? `${e.user.first_name} ${e.user.last_name}`.trim() || e.user.username : 'Unknown Researcher',
          xp: e.total_xp || 0,
          streak: e.streak_count || 0,
          accuracy: e.accuracy || 100,
          rank: index + 1,
          rank_change: e.rank_change || 0,
          is_current_user: e.is_current_user
        }))

        if (isMounted) {
          setLeaderboard(mappedResults)
          const current = mappedResults.find((e: any) => e.is_current_user) || null
          setCurrentUser(current)
        }
      } catch (err) {
        if (isMounted) console.error("Failed to fetch leaderboard", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [timeFilter, leaderboardType, selectedTopicId])

  const displayEntries = useMemo(() => {
    return leaderboard.slice(0, 10).sort((a, b) => a.rank - b.rank)
  }, [leaderboard])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-8 h-8 text-amber-500 animate-bounce" />
    if (rank === 2) return <Medal className="w-8 h-8 text-neutral-400" />
    if (rank === 3) return <Medal className="w-8 h-8 text-orange-600" />
    return null
  }

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="relative">
         <Dna className="w-16 h-16 text-primary-600 animate-spin" />
         <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Verifying Rankings...</p>
    </div>
  )

  return (
    <div className="stagger-in space-y-12 pb-20 pt-4">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-neutral-200 dark:border-neutral-800 pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-amber-500 rounded-full" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Global Standings // HALL OF FAME</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight text-neutral-950 dark:text-white leading-none">
            Hall of <br/>Fame<span className="text-amber-500">.</span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            Synthesized list of paramount researchers. Rankings are recalibrated every 24 hours based on synaptic XP gains.
          </p>
        </div>

          <div className="flex flex-col gap-4 items-end">
              <div className="flex gap-4 p-2 bg-neutral-100 dark:bg-neutral-900 rounded-3xl border border-neutral-200/50 dark:border-neutral-800">
                 {(['global', 'topic'] as const).map(type => (
                    <button
                       key={type}
                       onClick={() => setLeaderboardType(type)}
                       className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          leaderboardType === type 
                             ? 'bg-neutral-950 text-white shadow-xl scale-105' 
                             : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                       }`}
                    >
                       {type}
                    </button>
                 ))}
              </div>
              
              {leaderboardType === 'topic' && (
                  <select 
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-sm font-bold text-neutral-700 dark:text-neutral-300 outline-hidden"
                  >
                      {topics.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* User Standing - Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="flex items-center gap-3 px-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Your Position</h2>
           </div>

           <Card className="glass border-0 rounded-[3rem] p-10 bg-neutral-900 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-scanline opacity-10" />
              {currentUser ? (
                <div className="relative z-10 space-y-10">
                  <div className="flex flex-col items-center gap-4 text-center">
                     <div className="w-24 h-24 rounded-[2rem] border-2 border-primary-500/30 flex items-center justify-center p-2 relative">
                        <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-10" />
                        <Avatar name={currentUser.name} size="xl" className="shadow-2xl" />
                     </div>
                     <div>
                        <p className="text-2xl font-black tracking-tight">{currentUser.name}</p>
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Operator State: ACTIVE</p>
                     </div>
                  </div>

                  <div className="flex flex-col items-center py-6 bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                     <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Rank index</p>
                     <p className="text-6xl font-black tracking-tighter text-amber-500">#{currentUser.rank}</p>
                     <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-neutral-950 rounded-full shadow-lg border border-white/5">
                        {currentUser.rank_change >= 0 ? <ChevronUp className="w-4 h-4 text-emerald-500" /> : <ChevronDown className="w-4 h-4 text-rose-500" />}
                        <span className={cn(
                           "text-[9px] font-black uppercase tracking-widest",
                           currentUser.rank_change >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                           {Math.abs(currentUser.rank_change)} Pos Change
                        </span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Synaptic XP</p>
                        <p className="text-xl font-black">{currentUser.xp.toLocaleString()}</p>
                     </div>
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Streak</p>
                        <p className="text-xl font-black text-orange-500 flex items-center gap-2">
                           <Flame className="w-5 h-5 fill-current" /> {currentUser.streak}
                        </p>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest mb-1">
                        <span className="text-neutral-500">Accuracy Vector</span>
                        <span className="text-emerald-500">{currentUser.accuracy}%</span>
                     </div>
                     <ProgressBar value={currentUser.accuracy} className="h-1 bg-white/5" indicatorClassName="bg-emerald-500" />
                  </div>
                </div>
              ) : (
                <div className="relative z-10 h-96 flex flex-col items-center justify-center text-center p-6 space-y-6">
                   <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-neutral-500">
                      <WifiOff className="w-10 h-10" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase tracking-tight">Index Null</h3>
                      <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                         Complete simulations to establish your position in the hall of fame.
                      </p>
                   </div>
                </div>
              )}
           </Card>
        </div>

        {/* Global Standings Table */}
        <div className="lg:col-span-8 space-y-8">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <LayoutGrid className="w-5 h-5 text-primary-500" />
                 <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Global Operators</h2>
              </div>
              <div className="relative group max-w-[240px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
                 <input 
                    type="text" 
                    placeholder="Search by ID or name..." 
                    className="h-12 w-full pl-12 pr-4 bg-neutral-100 dark:bg-neutral-900 rounded-[1.2rem] text-xs font-bold border-0 ring-1 ring-neutral-200/50 dark:ring-neutral-800 transition-all outline-hidden focus:ring-2 focus:ring-primary-500/30" 
                 />
              </div>
           </div>

           <Card className="glass border-0 rounded-[3rem] shadow-xl overflow-hidden min-h-[600px]">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-neutral-50/50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Idx</th>
                          <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Specimen Name</th>
                          <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">XP Metrics</th>
                          <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Streak</th>
                          <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                       {displayEntries.map((entry) => (
                          <tr 
                             key={entry.id} 
                             className={cn(
                                "group transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/20",
                                entry.is_current_user && "bg-primary-500/5"
                             )}
                          >
                             <td className="px-10 py-8">
                                <div className="flex items-center justify-center w-12 h-12">
                                   {getRankIcon(entry.rank) || (
                                      <span className="text-2xl font-black text-neutral-300 dark:text-neutral-700 tracking-tighter">#{entry.rank.toString().padStart(2, '0')}</span>
                                   )}
                                </div>
                             </td>
                             <td className="px-6 py-8">
                                <div className="flex items-center gap-5">
                                   <div className="relative shrink-0">
                                      <Avatar name={entry.name} size="lg" className="rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500" />
                                      {entry.is_current_user && (
                                         <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900" />
                                      )}
                                   </div>
                                   <div>
                                      <p className="font-black text-neutral-900 dark:text-white text-lg tracking-tight uppercase leading-none">
                                         {entry.name}
                                      </p>
                                      <p className="text-[9px] font-bold text-neutral-400 uppercase mt-2 tracking-widest">Operator-ID: {String(entry.id).padStart(5, '0')}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-8">
                                <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">{(entry.xp || 0).toLocaleString()}</p>
                             </td>
                             <td className="px-6 py-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-lg">
                                   <Flame className="w-4 h-4 text-orange-500 fill-current" />
                                   <span className="font-black text-orange-600 dark:text-orange-400 text-sm font-mono">{entry.streak}</span>
                                </div>
                             </td>
                             <td className="px-10 py-8 text-right">
                                <Badge className={cn(
                                   "font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest border-0",
                                   entry.is_current_user ? 'bg-primary-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                                )}>
                                   {entry.is_current_user ? 'Self' : 'Linked'}
                                </Badge>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
