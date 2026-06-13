import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogoMark, LogoFull } from "@/components/brand";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";


/**
 * AuthLayout Component
 *
 * Layout for authentication pages (login, register, etc.)
 * Clean, focused design with LearnLab brand identity.
 * Supports dark mode.
 */

export function AuthLayout() {
  const { t } = useTranslation("auth");


  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary-600 via-primary-500 to-secondary-600 dark:from-primary-700 dark:via-primary-600 dark:to-secondary-700 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Decorative graph nodes — reinforces the brand identity */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg
            className="w-full h-full"
            viewBox="0 0 600 800"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="150" r="8" fill="white" />
            <circle cx="200" cy="100" r="6" fill="white" />
            <circle cx="300" cy="200" r="10" fill="white" />
            <circle cx="450" cy="120" r="7" fill="white" />
            <circle cx="500" cy="300" r="9" fill="white" />
            <circle cx="150" cy="400" r="8" fill="white" />
            <circle cx="350" cy="500" r="6" fill="white" />
            <circle cx="480" cy="550" r="10" fill="white" />
            <circle cx="80" cy="650" r="7" fill="white" />
            <circle cx="250" cy="700" r="8" fill="white" />
            <circle cx="420" cy="680" r="5" fill="white" />
            <line
              x1="100"
              y1="150"
              x2="200"
              y2="100"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="200"
              y1="100"
              x2="300"
              y2="200"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="300"
              y1="200"
              x2="450"
              y2="120"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="450"
              y1="120"
              x2="500"
              y2="300"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="100"
              y1="150"
              x2="150"
              y2="400"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="300"
              y1="200"
              x2="500"
              y2="300"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="150"
              y1="400"
              x2="350"
              y2="500"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="350"
              y1="500"
              x2="480"
              y2="550"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="80"
              y1="650"
              x2="250"
              y2="700"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="250"
              y1="700"
              x2="420"
              y2="680"
              stroke="white"
              strokeWidth="1.5"
            />
            <line
              x1="480"
              y1="550"
              x2="420"
              y2="680"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <LogoMark size={44} transparent />
            <span className="text-2xl font-bold tracking-tight">LearnLab</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4 font-display">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-white/80">
            {t("heroDescription")}
          </p>
        </div>

        <div />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute top-4 end-4 flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher variant="globe" />
        </div>

        <div className="w-full max-w-md">


          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <LogoFull iconSize={40} />
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
