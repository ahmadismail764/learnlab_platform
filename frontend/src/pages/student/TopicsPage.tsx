import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  Clock,
  Search,
  Filter,
  Database,
  Binary,
  Layers,
  Activity,
  Target
} from 'lucide-react'
import { Card, Button, Badge, ProgressBar } from '@/components/ui'
import { topicsService } from '@/services/topics'
import { cn } from '@/utils/cn'

/**
 * TopicsPage (Knowledge Inventory)
 * Re-imagined as a categorical specimen catalog.
 */

interface TopicItem {
  id: number
  name: string
  icon: string
  progress: number
  questionsTotal: number
  questionsDue: number
  lastReviewed?: string
  state: 'new' | 'learning' | 'review' | 'mastered'
  retrievability: number
  tier: number
  nextReview?: string
  category?: string
}

const TIER_BADGE: Record<number, string> = {
  1: '🥉',
  2: '🥈',
  3: '🥇',
}

export function TopicsPage() {
  const { t } = useTranslation(['topics', 'student', 'common'])
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsData, masteryData] = await Promise.all([
          topicsService.getTopics(),
          topicsService.getTopicMastery()
        ])

        const merged: TopicItem[] = topicsData.map((topic: any) => {
          const m: any = masteryData.find((item: any) => item.topic === topic.id) || {}
          return {
            id: topic.id,
            name: topic.name,
            icon: topic.icon || '📚',
            category: topic.category || 'General',
            tier: topic.tier || 1,
            progress: m.mastery_score ? Math.round(m.mastery_score * 100) : 0,
            questionsTotal: topic.questions_count || 0,
            questionsDue: m.items_due || 0,
            retrievability: m.retrievability || 1.0,
            state: (m.mastery_score > 0.9) ? 'mastered' : (m.mastery_score > 0.4 ? 'review' : (m.mastery_score > 0 ? 'learning' : 'new')),
            nextReview: m.next_review ? new Date(m.next_review).toLocaleDateString() : undefined
          }
        })
        setTopics(merged)
      } catch (err) {
        console.error("Failed to fetch topics", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const categories = useMemo(() => {
    const grouped: Record<string, TopicItem[]> = {}
    topics.forEach(topic => {
      const cat = topic.category || 'Fundamental Core'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(topic)
    })
    return Object.entries(grouped).map(([name, topicList]) => ({
      name,
      topics: topicList
    }))
  }, [topics])

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return categories
      .map(cat => ({
        ...cat,
        topics: cat.topics.filter(topic => topic.name.toLowerCase().includes(q))
      }))
      .filter(cat => cat.topics.length > 0)
  }, [searchQuery, categories])

  const totals = useMemo(() => {
    const due = topics.filter(t => t.questionsDue > 0).length
    const avg = topics.length ? Math.round(topics.reduce((s, t) => s + t.progress, 0) / topics.length) : 0
    return { due, avg, total: topics.length }
  }, [topics])

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
         <div className="w-16 h-16 border-4 border-primary-500/20 rounded-full" />
         <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px]">Accessing Knowledge Inventory</p>
    </div>
  )

  return (
    <div className="stagger-in space-y-12 pb-20 pt-4">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-neutral-200 dark:border-neutral-800 pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-primary-600 rounded-full" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Library 04 // Concepts</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight text-neutral-950 dark:text-white leading-none">
            Knowledge <br/>Inventory<span className="text-primary-600">.</span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            A comprehensive matrix of your subject mastery. Review specimens categorized by retrievability and scheduled priority.
          </p>
        </div>

        <div className="flex gap-4">
           <div className="p-8 bg-neutral-900 rounded-[2rem] text-white flex flex-col justify-between h-48 w-48 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-scanline opacity-10" />
              <Activity className="w-8 h-8 text-primary-500 animate-pulse" />
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Active Queue</p>
                 <p className="text-4xl font-black">{totals.due}</p>
              </div>
           </div>
           <div className="p-8 bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between h-48 w-48 shadow-sm">
              <Target className="w-8 h-8 text-secondary-500" />
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Global Mastery</p>
                 <p className="text-4xl font-black text-neutral-900 dark:text-white">{totals.avg}%</p>
              </div>
           </div>
        </div>
      </div>

      {/* Action Controller */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search specimen index..." 
            className="w-full h-20 pl-16 pr-8 bg-neutral-100 dark:bg-neutral-900 rounded-[1.5rem] border-0 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-primary-500/50 transition-all outline-hidden text-xl font-bold tracking-tight shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="h-20 px-8 rounded-[1.5rem] bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 border-0 flex gap-4 shadow-xl">
           <Filter className="w-6 h-6" />
           <span className="font-black uppercase tracking-widest text-xs">Filter Matrix</span>
        </Button>
      </div>

      {/* Categorized Specimens */}
      <div className="space-y-20">
        {filteredCategories.map(category => (
          <div key={category.name} className="space-y-8">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                  <Database className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                    {category.name}
                  </h3>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{category.topics.length} Specimen in Sector</p>
               </div>
               <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.topics.map(topic => (
                <Link key={topic.id} to={`/student/practice?topic=${topic.id}`} className="block group">
                  <Card className="glass group-hover:border-primary-500/50 transition-all border-neutral-200/50 dark:border-neutral-800/50 rounded-[2.5rem] overflow-hidden flex flex-col h-full bg-lab">
                    {/* Header Area */}
                    <div className="p-8 pb-4 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="w-16 h-16 rounded-3xl bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center text-4xl shadow-2xl group-hover:bg-primary-600 group-hover:scale-110 transition-all duration-500">
                           <Layers className="w-8 h-8 text-white opacity-80" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <Badge className={cn(
                              "font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest",
                              topic.state === 'mastered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              topic.state === 'new' ? 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20' :
                              'bg-primary-500/10 text-primary-500 border-primary-500/20'
                           )}>
                              {topic.state}
                           </Badge>
                           <span className="text-lg opacity-80">{TIER_BADGE[topic.tier]}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-black text-primary-500 uppercase tracking-widest">
                           <Binary className="w-3 h-3" />
                           <span>Item ID: TK-{topic.id.toString().padStart(3, '0')}</span>
                        </div>
                        <h4 className="text-2xl font-black font-display tracking-tight text-neutral-900 dark:text-white leading-tight">
                          {topic.name}
                        </h4>
                      </div>
                    </div>

                    {/* Meta Data */}
                    <div className="flex-1 p-8 pt-4 space-y-6">
                       <div className="grid grid-cols-2 gap-4 border-y border-neutral-100 dark:border-neutral-800 py-6">
                          <div>
                             <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Stability</p>
                             <p className="text-xl font-black text-neutral-800 dark:text-neutral-100">{topic.progress}%</p>
                          </div>
                          <div className="text-end">
                             <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Retrievability</p>
                             <p className={cn(
                                "text-xl font-black",
                                topic.retrievability < 0.7 ? "text-amber-500" : "text-primary-600"
                             )}>{Math.round(topic.retrievability * 100)}%</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <ProgressBar 
                            value={topic.retrievability * 100} 
                            className="h-1.5 bg-neutral-100 dark:bg-neutral-800" 
                            indicatorClassName={topic.retrievability < 0.7 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"}
                          />
                          
                          <div className="flex items-center justify-between gap-4">
                             <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {topic.nextReview ? <span>{topic.nextReview}</span> : 'Standby'}
                             </div>
                             <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                {topic.questionsTotal} Items
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-2 pt-0 px-8 pb-8">
                       <Button fullWidth className="h-14 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg group-hover:bg-primary-600 group-hover:text-white transition-all">
                          Initiate Sequence
                       </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-32 rounded-[3.5rem] bg-neutral-100 dark:bg-neutral-900/50 border-2 border-dashed border-neutral-200 dark:border-neutral-800">
           <Search className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-6" />
           <h3 className="text-3xl font-black text-neutral-800 dark:text-white uppercase tracking-tight">Zero Matches</h3>
           <p className="text-neutral-500 font-medium mt-2">The requested concept is not in our current inventory.</p>
           <Button variant="outline" className="mt-10 h-14 px-10 rounded-2xl border-neutral-300 font-black uppercase tracking-widest text-xs" onClick={() => setSearchQuery('')}>
              Reset Inventory Filter
           </Button>
        </div>
      )}
    </div>
  )
}
