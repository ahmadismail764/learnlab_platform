import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Rocket, 
  Target, 
  BrainCircuit, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BookOpen
} from 'lucide-react'


import { Button, Card, CardContent } from '@/components/ui'
import { useCurrentUser } from '@/contexts'
import { cn } from '@/utils/cn'
import { useTopics } from '@/hooks'

/**
 * OnboardingPage
 * 
 * A beautiful, full-screen, multi-step onboarding flow for new learners.
 * Features smooth Framer Motion transitions and interactive selections.
 */

const GOALS = [
  { id: 'casual', label: 'Casual', desc: '5 mins/day', icon: Sparkles, color: 'text-blue-500' },
  { id: 'regular', label: 'Regular', desc: '15 mins/day', icon: Target, color: 'text-green-500' },
  { id: 'serious', label: 'Serious', desc: '30+ mins/day', icon: Rocket, color: 'text-orange-500' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const { data: topicsData, isLoading: topicsLoading } = useTopics()
  
  const [step, setStep] = useState(0)
  const [selectedGoal, setSelectedGoal] = useState<string>('regular')
  const [selectedTopics, setSelectedTopics] = useState<number[]>([])

  const topics = Array.isArray(topicsData) ? topicsData : topicsData?.results ?? []

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_done_${user.id}`, 'true')
    }
    navigate('/learner', { replace: true })
  }

  const toggleTopic = (id: number) => {
    setSelectedTopics(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  }

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Progress Indicator */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between px-4">
        {[0, 1, 2, 3].map(idx => (
          <div key={idx} className="flex-1 flex items-center">
            <div className={cn(
              "h-2 flex-1 rounded-full transition-all duration-500",
              step >= idx ? "bg-primary-600 dark:bg-primary-500" : "bg-neutral-200 dark:bg-neutral-800"
            )} />
            {idx < 3 && <div className="w-2" />}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-2xl overflow-hidden shadow-xl shadow-neutral-200/50 dark:shadow-none border-neutral-200/60 dark:border-neutral-800">
        <CardContent className="p-0 relative min-h-[480px]">
          <AnimatePresence mode="wait" custom={1}>
            
            {/* STEP 0: Welcome */}
            {step === 0 && (
              <motion.div
                key="step0"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 sm:p-12"
              >
                <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
                  Welcome to LearnLab
                </h1>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-10 leading-relaxed">
                  The adaptive learning platform that uses Fast Interval Repetition Engine (FIRe) to guarantee you remember what you learn.
                </p>
                <Button size="lg" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full sm:w-auto px-8 py-6 text-lg rounded-2xl shadow-lg shadow-primary-500/20">
                  Get Started
                </Button>
              </motion.div>
            )}

            {/* STEP 1: Daily Goal */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col p-8 sm:p-12"
              >
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Set your daily goal</h2>
                  <p className="text-neutral-600 dark:text-neutral-400">Consistency is the key to mastery. How much time can you commit?</p>
                </div>

                <div className="space-y-4 flex-1">
                  {GOALS.map(goal => {
                    const Icon = goal.icon
                    const isSelected = selectedGoal === goal.id
                    return (
                      <button
                        key={goal.id}
                        onClick={() => {
                          setSelectedGoal(goal.id)
                          setTimeout(() => handleNext(), 350)
                        }}
                        className={cn(
                          "w-full flex items-center p-5 rounded-2xl border-2 transition-all duration-200 text-left",
                          isSelected 
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" 
                            : "border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-neutral-950"
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mr-4", isSelected ? "bg-white dark:bg-neutral-900 shadow-sm" : "bg-neutral-100 dark:bg-neutral-900")}>
                          <Icon className={cn("w-6 h-6", goal.color)} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{goal.label}</h3>
                          <p className="text-neutral-500 dark:text-neutral-400">{goal.desc}</p>
                        </div>
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected ? "border-primary-500 bg-primary-500" : "border-neutral-300 dark:border-neutral-700"
                        )}>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800/50">
                  <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                  <Button onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>Continue</Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Choose Topics */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col p-8 sm:p-12"
              >
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">What do you want to learn?</h2>
                  <p className="text-neutral-600 dark:text-neutral-400">Select a few topics to kickstart your adaptive queue.</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar">
                  {topicsLoading ? (
                    <div className="flex justify-center py-10"><Rocket className="w-8 h-8 animate-spin text-primary-500" /></div>
                  ) : topics.length > 0 ? (
                    topics.map((topic: any) => {
                      const isSelected = selectedTopics.includes(topic.id)
                      return (
                        <button
                          key={topic.id}
                          onClick={() => toggleTopic(topic.id)}
                          className={cn(
                            "w-full flex items-center p-4 rounded-xl border transition-all text-left",
                            isSelected 
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" 
                              : "border-neutral-200 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800"
                          )}
                        >
                          <BookOpen className={cn("w-5 h-5 mr-3 shrink-0", isSelected ? "text-primary-600 dark:text-primary-400" : "text-neutral-400")} />
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900 dark:text-white">{topic.name}</h4>
                            {topic.parent_module && <p className="text-xs text-neutral-500 mt-0.5">{topic.parent_module}</p>}
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />}
                        </button>
                      )
                    })
                  ) : (
                    <div className="text-center py-10 text-neutral-500">No topics available to select yet.</div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/50">
                  <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                  <Button onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />} disabled={selectedTopics.length === 0 && topics.length > 0}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Ready */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-gradient-to-br from-primary-500 to-indigo-600 dark:from-primary-900 dark:to-indigo-950"
              >
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 shadow-2xl">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">You're all set!</h2>
                <p className="text-primary-100 max-w-sm mx-auto mb-10 text-lg">
                  We've personalized your learning queue based on your preferences. Time to earn your first XP!
                </p>
                <Button 
                  size="lg" 
                  onClick={handleComplete} 
                  className="bg-white text-primary-700 hover:bg-neutral-50 px-10 py-6 text-lg rounded-2xl shadow-xl hover:-translate-y-1 transition-transform"
                >
                  Enter Dashboard
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
