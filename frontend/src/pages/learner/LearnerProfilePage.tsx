import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Settings, 
  MapPin, 
  Mail, 
  Shield, 
  Fingerprint,
  Activity,
  Zap,
  Brain,
  Binary,
  GraduationCap,
  Sparkles,
  Save,
  LogOut,
  Camera
} from 'lucide-react'
import { Card, Button, Input, Avatar, Badge, ProgressBar } from '@/components/ui'
import { useAuth, useCurrentUser } from '@/contexts'
import { authService } from '@/services/auth'
import { learnersService, type LearnerProfile as LearnerProfileDto } from '@/services/learners'
import { cn } from '@/utils/cn'

/**
 * LearnerProfilePage (Researcher Dossier)
 * Re-imagined as a high-fidelity data dossier for the researcher.
 */

export function LearnerProfilePage() {
  const { t: _t } = useTranslation(['learner', 'common'])
  const user = useCurrentUser()
   const { updateUser, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
   const [isSaving, setIsSaving] = useState(false)
   const [saveMessage, setSaveMessage] = useState('')
   const [saveError, setSaveError] = useState('')
   const [learnerProfile, setLearnerProfile] = useState<LearnerProfileDto | null>(null)
   const [profileForm, setProfileForm] = useState({
      username: user.username ?? user.email.split('@')[0],
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
   })

   useEffect(() => {
      setProfileForm({
         username: user.username ?? user.email.split('@')[0],
         email: user.email,
         firstName: user.firstName,
         lastName: user.lastName,
      })
   }, [user.username, user.email, user.firstName, user.lastName])

   useEffect(() => {
      let isMounted = true

      const loadLearnerProfile = async () => {
         try {
            const profile = await learnersService.getCurrentProfile()
            if (isMounted) {
               setLearnerProfile(profile)
            }
         } catch (error) {
            if (isMounted) {
               const message = error instanceof Error ? error.message : 'Failed to load learner profile'
               setSaveError(message)
            }
         }
      }

      loadLearnerProfile()

      return () => {
         isMounted = false
      }
   }, [])

   const memberSinceYear = useMemo(() => {
      const parsed = new Date(user.createdAt)
      return Number.isNaN(parsed.getTime()) ? 'N/A' : String(parsed.getFullYear())
   }, [user.createdAt])

   const researchStats = useMemo(
      () => [
         {
            label: 'Total XP',
            val: learnerProfile ? learnerProfile.total_xp.toLocaleString() : '--',
            icon: Zap,
            color: 'text-primary-500',
         },
         {
            label: 'Neural Streak',
            val: learnerProfile ? `${learnerProfile.streak_count} Days` : '--',
            icon: Activity,
            color: 'text-orange-500',
         },
         { label: 'Mastery Index', val: '86%', icon: Brain, color: 'text-secondary-500' },
         {
            label: 'Verification Level',
            val: user.role === 'admin' ? 'Admin' : 'Learner',
            icon: Shield,
            color: 'text-emerald-500',
         },
      ],
      [learnerProfile, user.role],
   )

  const topTopics = [
    { name: 'Propositional Logic', level: 'Mastered', progress: 95 },
    { name: 'Set Theory', level: 'Advanced', progress: 78 },
    { name: 'Graph Theory', level: 'Learning', progress: 42 },
  ]

   const handleSyncProfile = async () => {
      if (!isEditing) {
         setIsEditing(true)
         setSaveError('')
         setSaveMessage('')
         return
      }

      setIsSaving(true)
      setSaveError('')
      setSaveMessage('')

      try {
         const payload = {
            username: profileForm.username.trim(),
            email: profileForm.email.trim(),
            first_name: profileForm.firstName.trim(),
            last_name: profileForm.lastName.trim(),
         }

         const updated = await authService.updateCurrentUser(payload)

         updateUser({
            username: updated.username,
            email: updated.email,
            firstName: updated.first_name,
            lastName: updated.last_name,
            role: updated.role === 'admin' || updated.role === 'learner'
               ? updated.role
               : updated.is_staff
                  ? 'admin'
                  : 'learner',
         })

         setIsEditing(false)
         setSaveMessage('Profile synchronized successfully.')
      } catch (error) {
         const message = error instanceof Error ? error.message : 'Failed to synchronize profile.'
         setSaveError(message)
      } finally {
         setIsSaving(false)
      }
   }

  return (
    <div className="stagger-in space-y-12 pb-20 pt-4">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-neutral-200 dark:border-neutral-800 pb-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-neutral-900 dark:bg-white rounded-full" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Researcher Dossier // SECURE ACCESS</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight text-neutral-950 dark:text-white leading-none">
            {user.firstName}<br/>{user.lastName}<span className="text-primary-600">.</span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            Personal metrics and neural configuration settings. This data is encrypted and synced with the central laboratory core.
          </p>
        </div>

        <div className="flex gap-4">
                <Button 
                     onClick={handleSyncProfile}
                     disabled={isSaving}
              className={cn(
                 "h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                 isEditing ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-neutral-950 text-white hover:bg-neutral-800"
              )}
           >
              {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
                     {isEditing ? (isSaving ? 'Syncing...' : 'Sync Changes') : 'Configure Profile'}
           </Button>
        </div>
      </div>

         {saveError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
               {saveError}
            </div>
         )}

         {saveMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
               {saveMessage}
            </div>
         )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Dossier Card & Stats */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="glass border-0 rounded-[3rem] p-10 bg-neutral-900 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-scanline opacity-10" />
              <div className="relative z-10 space-y-10">
                 <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative group/avatar">
                       <div className="w-32 h-32 rounded-[2.5rem] border-2 border-primary-500/30 flex items-center justify-center p-2 relative overflow-hidden">
                          <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-10" />
                          <Avatar name={`${user.firstName} ${user.lastName}`} size="xl" className="shadow-2xl scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                             <Camera className="w-8 h-8 text-white" />
                          </div>
                       </div>
                       <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center shadow-xl border-4 border-neutral-900">
                          <Fingerprint className="w-5 h-5 text-white" />
                       </div>
                    </div>
                    
                    <div>
                       <p className="text-3xl font-black tracking-tight leading-none uppercase">{user.firstName} {user.lastName}</p>
                       <div className="flex items-center justify-center gap-2 mt-3">
                          <Badge variant="outline" className="bg-primary-500/10 text-primary-400 border-primary-500/20 px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                             Lead Researcher
                          </Badge>
                          <Badge variant="outline" className="bg-white/5 text-neutral-400 border-white/5 px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                             Since {memberSinceYear}
                          </Badge>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4 text-neutral-400">
                       <Mail className="w-5 h-5" />
                       <span className="text-sm font-bold truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-neutral-400">
                       <MapPin className="w-5 h-5" />
                       <span className="text-sm font-bold">Neural Core - Node 07</span>
                    </div>
                 </div>

                 <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 relative group overflow-hidden">
                    <div className="relative z-10 space-y-4">
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Mastery Path</p>
                          <span className="text-xs font-black text-primary-400">84%</span>
                       </div>
                       <ProgressBar value={84} className="h-1 bg-white/5" indicatorClassName="bg-primary-500 shadow-[0_0_15px_#14b8a6]" />
                       <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                          Synchronizing with curriculum standards for Discrete Mathematics.
                       </p>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <GraduationCap className="w-16 h-16" />
                    </div>
                 </div>
              </div>
           </Card>

           <div className="grid grid-cols-2 gap-4">
              {researchStats.map((stat, i) => (
                 <Card key={i} className="glass p-6 rounded-[2rem] border-neutral-200/50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <stat.icon className={cn("w-6 h-6 mb-4", stat.color)} />
                    <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter leading-none">{stat.val}</p>
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-2">{stat.label}</p>
                 </Card>
              ))}
           </div>
        </div>

        {/* Right Column: Information Configuration */}
        <div className="lg:col-span-8 space-y-10">
           {/* Section: Credentials */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                 <Shield className="w-5 h-5 text-primary-500" />
                 <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Core Configuration</h2>
              </div>

              <Card className="glass border-0 rounded-[3rem] p-10 shadow-xl space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Researcher ID</label>
                                  <Input
                                     disabled={!isEditing || isSaving}
                                     value={profileForm.username}
                                     onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                                     className="h-14 rounded-2xl bg-neutral-100/50 dark:bg-neutral-900/50 border-0 font-bold"
                                  />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Primary Liaison</label>
                                  <Input
                                     disabled={!isEditing || isSaving}
                                     value={profileForm.email}
                                     onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                                     className="h-14 rounded-2xl bg-neutral-100/50 dark:bg-neutral-900/50 border-0 font-bold"
                                  />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Designation Label</label>
                                  <Input
                                     disabled={!isEditing || isSaving}
                                     value={profileForm.firstName}
                                     onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                     className="h-14 rounded-2xl bg-neutral-100/50 dark:bg-neutral-900/50 border-0 font-bold"
                                  />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Lineage Family</label>
                                  <Input
                                     disabled={!isEditing || isSaving}
                                     value={profileForm.lastName}
                                     onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                     className="h-14 rounded-2xl bg-neutral-100/50 dark:bg-neutral-900/50 border-0 font-bold"
                                  />
                    </div>
                 </div>

                 {isEditing && (
                    <div className="pt-4 flex justify-end gap-4 border-t border-neutral-100 dark:border-neutral-800">
                                  <Button
                                     variant="ghost"
                                     onClick={() => {
                                        setIsEditing(false)
                                        setProfileForm({
                                           username: user.username ?? user.email.split('@')[0],
                                           email: user.email,
                                           firstName: user.firstName,
                                           lastName: user.lastName,
                                        })
                                     }}
                                     className="h-12 px-6 rounded-xl font-black uppercase text-xs"
                                  >
                                     Revert
                                  </Button>
                                  <Button
                                     onClick={handleSyncProfile}
                                     disabled={isSaving}
                                     className="h-12 px-10 bg-primary-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-primary-500/20"
                                  >
                                     {isSaving ? 'Syncing...' : 'Authorize Sync'}
                                  </Button>
                    </div>
                 )}
              </Card>
           </div>

           {/* Section: Knowledge Specialization */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                 <Binary className="w-5 h-5 text-secondary-500" />
                 <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Sector Specialization</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {topTopics.map((topic, i) => (
                    <Card key={i} className="glass border-0 rounded-[2.5rem] p-8 shadow-sm group">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <h4 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight">{topic.name}</h4>
                             <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Level: {topic.level}</p>
                          </div>
                          <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-black px-3 py-1 rounded-lg border-0">
                             #{i + 1}
                          </Badge>
                       </div>
                       <div className="space-y-3">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                             <span>Stability Matrix</span>
                             <span>{topic.progress}%</span>
                          </div>
                          <ProgressBar value={topic.progress} className="h-1.5 bg-neutral-100 dark:bg-neutral-800" indicatorClassName="bg-secondary-500" />
                       </div>
                    </Card>
                 ))}
                 
                 <Card className="glass border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                    <Sparkles className="w-8 h-8 text-neutral-300 group-hover:text-primary-500 transition-colors mb-4" />
                    <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Assign New Sector</p>
                 </Card>
              </div>
           </div>

           {/* Security Footer */}
           <Card className="bg-rose-500/5 border border-rose-500/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center md:text-left">
                 <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Access Termination</h3>
                 <p className="text-sm text-neutral-500 font-medium">Terminate session and disconnect neural link from this workstation.</p>
              </div>
              <Button
                 variant="ghost"
                 onClick={logout}
                 className="h-14 px-10 rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-black uppercase tracking-[0.2em] text-xs"
              >
                 <LogOut className="w-5 h-5 mr-3" /> Disconnect
              </Button>
           </Card>
        </div>
      </div>
    </div>
  )
}
