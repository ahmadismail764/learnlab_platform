import { Outlet } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

/**
 * AuthLayout Component
 * 
 * Layout for authentication pages (login, register, etc.)
 * Clean, focused design to minimize distractions.
 * Supports dark mode.
 */

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-500 dark:bg-primary-600 flex-col justify-between p-12 text-white">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">LearnLab</span>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <h1 className="text-4xl font-bold mb-4">
            Learn at your own pace
          </h1>
          <p className="text-lg text-primary-100">
            Master Discrete Mathematics through spaced repetition and personalized learning paths. 
            Track your progress and achieve your goals.
          </p>
        </div>

        <div />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">LearnLab</span>
          </div>
          
          <Outlet />
        </div>
      </div>
    </div>
  )
}
