import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Medal,
  UserCircle,
  Moon,
  Sun,
  BrainCircuit,
  Compass,
  FolderTree,
  TrendingUp,
  UserCog,
  Library,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import { LogoMark, LogoFull } from "@/components/brand";
import type { User, UserRole } from "@/types";
import { useTheme } from "@/contexts";

/**
 * Sidebar Component
 *
 * Main navigation sidebar that adapts based on user role.
 * RTL-aware: layout and chevron flip automatically.
 * Follows Open/Closed principle - extend via navItems config.
 */

export interface SidebarProps {
  /** Current user info */
  user: User;
  /** Whether sidebar is collapsed */
  isCollapsed?: boolean;
  /** Callback when collapse toggle is clicked */
  onToggleCollapse?: () => void;
  /** Callback for logout */
  onLogout?: () => void;
}

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

// Navigation items configuration - extensible without modifying component
const navItems: NavItem[] = [
  // Learner items
  {
    labelKey: "nav:dashboard",
    href: "/learner",
    icon: LayoutDashboard,
    roles: ["learner"],
  },
  {
    labelKey: "nav:topics",
    href: "/learner/topics",
    icon: Compass,
    roles: ["learner"],
  },
  {
    labelKey: "nav:practice",
    href: "/learner/practice",
    icon: BrainCircuit,
    roles: ["learner"],
  },
  {
    labelKey: "nav:progress",
    href: "/learner/progress",
    icon: TrendingUp,
    roles: ["learner"],
  },

  {
    labelKey: "nav:leaderboard",
    href: "/learner/leaderboard",
    icon: Medal,
    roles: ["learner"],
  },
  {
    labelKey: "nav:profile",
    href: "/learner/profile",
    icon: UserCircle,
    roles: ["learner"],
  },

  // Admin (Content Manager) items
  {
    labelKey: "nav:dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    labelKey: "nav:curriculum",
    href: "/admin/topics",
    icon: FolderTree,
    roles: ["admin"],
  },
  {
    labelKey: "nav:questionBank",
    href: "/admin/questions",
    icon: Library,
    roles: ["admin"],
  },
  {
    labelKey: "nav:analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    labelKey: "nav:profile",
    href: "/admin/profile",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    labelKey: "nav:settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

export function Sidebar({
  user,
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const { t } = useTranslation(["auth", "nav"]);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const isLearner = user.role === 'learner'

  // Filter nav items based on user role
  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user.role),
  );

  const roleLabels: Record<UserRole, string> = {
    learner: t("auth:learner"),
    admin: t("auth:admin"),
  };

  const activeIconClass = isLearner
    ? 'text-primary-600 dark:text-primary-300'
    : 'text-secondary-600 dark:text-secondary-300'
  const activeIndicatorClass = isLearner ? 'bg-primary-500' : 'bg-secondary-500'

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-e transition-[width] duration-300 ease-out",
        "border-neutral-200/70 bg-white/82 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/82",
        isCollapsed ? "w-20" : isLearner ? "w-[17.5rem] xl:w-[18rem]" : "w-[17rem] xl:w-[17.5rem]",
      )}
    >
      {/* Inner wrapper that clips the animating content during width transitions */}
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Logo */}
        <div
          className={cn(
            'relative flex h-[4.25rem] items-center border-b justify-between gap-3 px-5',
            isCollapsed && 'justify-center px-3',
            'border-neutral-200/70 dark:border-neutral-800',
          )}
        >
          {isCollapsed ? <LogoMark size={32} /> : <LogoFull iconSize={32} />}
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden", isCollapsed ? "py-4" : "py-3")}>
          <ul className={cn('space-y-1', isCollapsed ? 'px-2' : 'px-3')}>
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              const label = t(item.labelKey);

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      'group relative flex items-center rounded-xl text-sm transition-colors duration-200',
                      isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3.5 py-3',
                      isActive
                        ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200/80 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700'
                        : isLearner
                          ? 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900/72 dark:hover:text-white'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200',
                    )}
                    title={isCollapsed ? label : undefined}
                  >
                    {!isCollapsed && isActive && (
                      <span className={cn("absolute inset-y-2 start-1 w-0.5 rounded-full", activeIndicatorClass)} />
                    )}
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive
                          ? activeIconClass
                          : 'text-neutral-400 transition-colors group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300',
                      )}
                    />
                    {!isCollapsed && <span className={cn('truncate', isActive && 'font-medium')}>{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div
          className={cn(
            'border-t border-neutral-200/70 p-3 dark:border-neutral-800',
            isCollapsed && "px-2",
          )}
        >
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "gap-3",
            )}
          >
            <Link
              to={`/${user.role}/profile`}
              className={cn(
                "flex items-center transition-colors",
                isCollapsed ? "p-1" : "min-w-0 flex-1 gap-3 rounded-xl px-2 py-2 hover:bg-neutral-100/80 dark:hover:bg-neutral-900/70",
              )}
            >
              <Avatar
                name={`${user.firstName} ${user.lastName}`}
                src={user.avatarUrl}
                avatarColor={user.avatarColor}
                size="sm"
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {roleLabels[user.role]}
                  </p>
                </div>
              )}
            </Link>
            {!isCollapsed && (
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800/70 dark:hover:text-neutral-300"
                  title={isDark ? t('nav:lightMode') : t('nav:darkMode')}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800/70 dark:hover:text-neutral-300"
                    title={t("nav:logout")}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          {isCollapsed && (
            <button
              onClick={toggleTheme}
              className="mt-2 mx-auto p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-center"
              title={isDark ? t('nav:lightMode') : t('nav:darkMode')}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Keep the collapse handle below the logo row so it never overlaps the brand. */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "absolute top-[5.35rem] -end-3 z-20 flex h-8 w-7 items-center justify-center rounded-full",
            "border border-neutral-200/80 bg-white text-neutral-500 shadow-md shadow-neutral-900/5",
            "transition-colors duration-150 hover:bg-neutral-50 hover:text-neutral-900",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
            "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
          )}
          aria-label={isCollapsed ? t("nav:expand") : t("nav:collapse")}
          title={isCollapsed ? t("nav:expand") : t("nav:collapse")}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              isCollapsed && "ltr:rotate-180 rtl:-rotate-180",
            )}
          />
        </button>
      )}
    </aside>
  );
}
