import { useMemo } from "react";
import {
  BookOpen,
  Target,
  ChevronRight,
  Zap,
  Sparkles,
  Flame,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Button, Badge, ProgressBar } from "@/components/ui";
import { Skeleton } from "@/components/ui/Loading";
import { useCurrentUser } from "@/contexts";
import { useLearnerProfile, useTopicMastery } from "@/hooks";

/**
 * LearnerDashboard
 *
 * Main landing page for learners showing real data from the backend:
 * - Welcome message with brand-gradient hero card
 * - Progress overview with branded stat cards (XP, streak, mastery, topics)
 * - Topics due for review (from FIRe mastery data)
 * RTL-aware with full i18n support.
 */

interface TopicMastery {
  id: number;
  topic: number;
  topic_name: string;
  rep_num: number;
  memory: number;
  speed: number;
  status: "new" | "learning" | "learned" | "struggling";
  last_reviewed: string | null;
  next_due: string | null;
}

export function LearnerDashboard() {
  const { t } = useTranslation(["learner", "common", "topics"]);
  const user = useCurrentUser();

  const { data: profile, isLoading: profileLoading } = useLearnerProfile();
  const { data: rawMasteries, isLoading: masteryLoading } = useTopicMastery();
  const masteries = (rawMasteries ?? []) as TopicMastery[];
  const isLoading = profileLoading || masteryLoading;

  // Derive stats from real data
  if (user && !localStorage.getItem(`onboarding_done_${user.id}`)) {
    return <Navigate to="/learner/onboarding" replace />;
  }

  const stats = useMemo(() => {
    const mastered = masteries.filter((m) => m.status === "learned").length;
    const inProgress = masteries.filter(
      (m) => m.status === "learning" || m.status === "struggling"
    ).length;
    const due = masteries.filter((m) => {
      if (!m.next_due) return false;
      return new Date(m.next_due) <= new Date();
    }).length;

    return {
      totalMastered: mastered,
      topicsInProgress: inProgress,
      topicsDue: due,
      totalXP: profile?.total_xp ?? 0,
      streak: profile?.streak_count ?? 0,
    };
  }, [masteries, profile]);

  // Topics due for review — sorted by next_due ascending (most urgent first)
  const topicsDueForReview = useMemo(() => {
    const now = new Date();
    return masteries
      .filter((m) => m.next_due && new Date(m.next_due) <= now)
      .sort(
        (a, b) =>
          new Date(a.next_due!).getTime() - new Date(b.next_due!).getTime()
      )
      .slice(0, 5)
      .map((m) => ({
        id: String(m.topic),
        name: m.topic_name,
        progress: Math.round(Math.min(1, m.memory || 0) * 100),
        status: m.status,
      }));
  }, [masteries]);

  // If no topics are due, show learning / new topics instead
  const displayTopics = useMemo(() => {
    if (topicsDueForReview.length > 0) return topicsDueForReview;
    return masteries
      .filter((m) => m.status !== "learned")
      .slice(0, 3)
      .map((m) => ({
        id: String(m.topic),
        name: m.topic_name,
        progress: Math.round(Math.min(1, m.memory || 0) * 100),
        status: m.status,
      }));
  }, [topicsDueForReview, masteries]);

  const statusIcons: Record<string, string> = {
    new: "🆕",
    learning: "📖",
    learned: "✅",
    struggling: "⚠️",
  };

  return (
    <div className="space-y-6">
      {/* Hero — branded gradient with decorative nodes */}
      <Card className="relative overflow-hidden bg-linear-to-br from-primary-600 via-primary-500 to-secondary-600 text-white border-0">
        {/* Decorative graph nodes */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 600 200"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <circle cx="500" cy="30" r="6" fill="white" />
            <circle cx="540" cy="80" r="4" fill="white" />
            <circle cx="460" cy="100" r="5" fill="white" />
            <circle cx="520" cy="150" r="7" fill="white" />
            <circle cx="400" cy="60" r="3" fill="white" />
            <line x1="500" y1="30" x2="540" y2="80" stroke="white" strokeWidth="1.5" />
            <line x1="540" y1="80" x2="520" y2="150" stroke="white" strokeWidth="1.5" />
            <line x1="460" y1="100" x2="520" y2="150" stroke="white" strokeWidth="1.5" />
            <line x1="400" y1="60" x2="460" y2="100" stroke="white" strokeWidth="1.5" />
            <line x1="500" y1="30" x2="400" y2="60" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent-300" />
              <p className="text-white/70 text-sm">
                {t("learner:todaysProgress")}
              </p>
            </div>
            <h1 className="text-2xl font-bold font-display">
              {t("learner:welcomeBack", { name: user.firstName })}
            </h1>
            {isLoading ? (
              <Skeleton width="60%" height={36} className="mt-2 bg-white/20" />
            ) : (
              <>
                <p className="text-3xl font-bold mt-2 font-display">
                  {stats.totalXP.toLocaleString()} XP
                </p>
                <p className="text-white/70 text-sm mt-1">
                  {t("learner:topicsProgress", { due: stats.topicsDue })}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link to="/learner/practice">
              <Button
                variant="outline"
                className="border-white/50 dark:border-white/50 text-white hover:bg-white/20 hover:border-white/70 dark:hover:bg-white/20 dark:hover:border-white/70 backdrop-blur-sm"
                rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {t("learner:startSession")}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Grid — branded icon backgrounds */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">
                  {stats.totalMastered}
                </p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("learner:questionsMastered")}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">
                  {stats.topicsInProgress}
                </p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("learner:activeTopics")}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-100 dark:bg-accent-900/30 rounded-xl group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">
                  {stats.totalXP.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("common:totalXP", "Total XP")}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="group hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-primary-700 dark:text-primary-300" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton width={48} height={28} />
              ) : (
                <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">
                  {stats.streak} {t("common:days", "days")}
                </p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("learner:thisWeek", "Streak")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Topics Due for Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-display text-neutral-800 dark:text-neutral-100">
            {t("learner:todaysQueue")}
          </h2>
          <Link
            to="/learner/topics"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            {t("common:viewAll")}
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="sm">
                <div className="flex items-center gap-4">
                  <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="50%" />
                    <Skeleton width="100%" height={8} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : displayTopics.length === 0 ? (
          <Card className="border-dashed">
            <div className="text-center py-6 space-y-2">
              <Sparkles className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="font-medium text-neutral-800 dark:text-neutral-100">
                {t("learner:allCaughtUp", "All caught up!")}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {masteries.length === 0
                  ? t(
                    "learner:startFirstSession",
                    "Start a practice session to begin tracking your progress."
                  )
                  : t(
                    "learner:noTopicsDue",
                    "No topics are due for review right now. Great work!"
                  )}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayTopics.map((topic) => (
              <Link
                key={topic.id}
                to={`/learner/practice?topic=${topic.id}`}
                className="block group"
              >
                <Card
                  hoverable
                  padding="sm"
                  className="group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-2xl shrink-0">
                      {statusIcons[topic.status] || "📖"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-medium text-neutral-800 dark:text-neutral-100">
                          {topic.name}
                        </h3>
                        <Badge variant="primary" size="sm">
                          {topic.progress}%
                        </Badge>
                      </div>
                      <ProgressBar
                        value={topic.progress}
                        size="sm"
                        showLabel={false}
                      />
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 rtl:rotate-180 transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
