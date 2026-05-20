import { useMemo } from "react";
import { BookOpen, ChevronRight, Clock3, Flame, Sparkles, Target } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  ProgressRing,
} from "@/components/ui";
import { PageStatCard, SectionHeading } from "@/components/common";
import { Skeleton } from "@/components/ui/Loading";
import { useCurrentUser } from "@/contexts";
import { useLearnerProfile, useTopicMastery } from "@/hooks";

/**
 * LearnerDashboard
 *
 * Main landing page for learners showing real data from the backend:
 * - A concise overview of what matters right now
 * - Progress signals derived from learner profile and mastery data
 * - Review queue prioritized from FSRS mastery data
 * RTL-aware with full i18n support.
 */

interface TopicMastery {
  id: string | number;
  topic: string | number;
  topic_name: string;
  rep_num: number;
  memory: number;
  speed: number;
  status: "new" | "learning" | "learned" | "struggling";
  last_reviewed: string | null;
  next_due: string | null;
}

const statusIcons: Record<TopicMastery["status"], string> = {
  new: "N",
  learning: "L",
  learned: "M",
  struggling: "S",
};

const statusVariants: Record<
  TopicMastery["status"],
  "outline" | "primary" | "success" | "warning"
> = {
  new: "outline",
  learning: "primary",
  learned: "success",
  struggling: "warning",
};

export function LearnerDashboard() {
  const { t } = useTranslation(["learner", "common", "topics"]);
  const user = useCurrentUser();

  const { data: profile, isLoading: profileLoading } = useLearnerProfile();
  const { data: rawMasteries, isLoading: masteryLoading } = useTopicMastery();
  const masteries = useMemo(
    () => (rawMasteries ?? []) as TopicMastery[],
    [rawMasteries]
  );
  const isLoading = profileLoading || masteryLoading;

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

  const overallRetention = useMemo(() => {
    if (masteries.length === 0) return 0;
    return Math.round(
      (masteries.reduce((sum, mastery) => sum + Math.min(1, mastery.memory || 0), 0) /
        masteries.length) *
        100,
    );
  }, [masteries]);

  const masteredShare = useMemo(() => {
    if (masteries.length === 0) return 0;
    return Math.round((stats.totalMastered / masteries.length) * 100);
  }, [masteries.length, stats.totalMastered]);

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
        status: m.status as TopicMastery["status"],
      }));
  }, [masteries]);

  // If no topics are due, show learning / new topics instead
  const displayTopics = useMemo(() => {
    if (topicsDueForReview.length > 0) return topicsDueForReview;
    return masteries
      .filter((m) => m.status !== "learned")
      .slice(0, 4)
      .map((m) => ({
        id: String(m.topic),
        name: m.topic_name,
        progress: Math.round(Math.min(1, m.memory || 0) * 100),
        status: m.status as TopicMastery["status"],
      }));
  }, [topicsDueForReview, masteries]);

  const shouldRedirectToOnboarding = Boolean(
    user && !localStorage.getItem(`onboarding_done_${user.id}`),
  );

  const dashboardStats = [
    {
      icon: <Target className="h-5 w-5" />,
      label: t("learner:questionsMastered"),
      value: stats.totalMastered,
      helper: `${masteredShare}% stable coverage`,
      tone: "primary" as const,
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: t("learner:activeTopics"),
      value: stats.topicsInProgress,
      helper: "Still in circulation",
      tone: "secondary" as const,
    },
    {
      icon: <Clock3 className="h-5 w-5" />,
      label: t("learner:dueForReview"),
      value: stats.topicsDue,
      helper: stats.topicsDue > 0 ? "Ready for review" : "Nothing urgent",
      tone: "accent" as const,
    },
    {
      icon: <Flame className="h-5 w-5" />,
      label: t("learner:thisWeek", "Streak"),
      value: `${stats.streak} ${t("common:days", "days")}`,
      helper: "Consistency pays off",
      tone: "success" as const,
    },
  ];

  if (shouldRedirectToOnboarding) {
    return <Navigate to="/learner/onboarding" replace />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-700/80 dark:text-primary-300/80">
              Today
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 sm:text-[2.4rem]">
              {t("learner:welcomeBack", { name: user.firstName })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:text-base">
              {stats.topicsDue > 0
                ? t("learner:dashboardHeroDueDescription", {
                    count: stats.topicsDue,
                    defaultValue:
                      "You have {{count}} topics ready for review. Start there first and the rest of the week stays lighter.",
                  })
                : t("learner:dashboardHeroCalmDescription", {
                    defaultValue:
                      "Your queue is under control. This is a good moment to reinforce strong topics or push into something new.",
                  })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-2">
              <span>Due now</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {isLoading ? "--" : stats.topicsDue}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span>Retention</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {isLoading ? "--" : `${overallRetention}%`}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span>Streak</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {isLoading ? "--" : `${stats.streak} ${t("common:days", "days")}`}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/learner/practice">
              <Button
                className="rounded-full px-5"
                rightIcon={<ChevronRight className="h-4 w-4 rtl:rotate-180" />}
              >
                {t("learner:startSession")}
              </Button>
            </Link>
            <Link to="/learner/topics">
              <Button variant="ghost" className="rounded-full px-5">
                {t("topics:title", "Browse topics")}
              </Button>
            </Link>
          </div>
        </div>

        <Card className="learner-panel">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
            Today&apos;s focus
          </p>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton width="60%" height={34} />
              <Skeleton width="100%" height={14} />
              <Skeleton width="100%" height={14} />
            </div>
          ) : (
            <>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                {stats.topicsDue > 0
                  ? `${stats.topicsDue} topic${stats.topicsDue === 1 ? "" : "s"} due`
                  : "Queue clear"}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {stats.topicsDue > 0
                  ? "A short review session will do the most work right now."
                  : "Use a small session to reinforce strong topics without building pressure."}
              </p>

              <div className="mt-5 space-y-3 border-t border-neutral-200/80 pt-4 dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">In progress</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {stats.topicsInProgress}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Stable topics</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {stats.totalMastered}
                  </span>
                </div>
              </div>
            </>
          )}
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item) => (
          <PageStatCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={isLoading ? "--" : item.value}
            helper={item.helper}
            tone={item.tone}
            className="learner-panel-soft border-0"
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.95fr)]">
        <Card className="learner-panel">
          <SectionHeading
            title={t("learner:todaysQueue")}
            description={
              displayTopics.length > 0
                ? "Start with the items that will buy back the most retention."
                : "There is no urgent review debt right now."
            }
          />

          <div className="mt-5">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="space-y-2 border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0 dark:border-neutral-800"
                  >
                    <Skeleton width="42%" />
                    <Skeleton width="100%" height={8} />
                    <Skeleton width="68%" height={12} />
                  </div>
                ))}
              </div>
            ) : displayTopics.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/60">
                <Sparkles className="mx-auto h-9 w-9 text-neutral-300 dark:text-neutral-600" />
                <p className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {t("learner:allCaughtUp", "All caught up!")}
                </p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {masteries.length === 0
                    ? t(
                        "learner:startFirstSession",
                        "Start a practice session to begin tracking your progress.",
                      )
                    : t(
                        "learner:noTopicsDue",
                        "No topics are due for review right now. Great work!",
                      )}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {displayTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    to={`/learner/practice?topic=${topic.id}`}
                    className="group -mx-2 block rounded-xl px-2 py-4 first:pt-0 last:pb-0 hover:bg-neutral-50/80 dark:hover:bg-neutral-900/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-sm font-semibold text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                        {statusIcons[topic.status]}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-neutral-950 dark:text-neutral-50 sm:text-base">
                            {topic.name}
                          </h3>
                          <Badge variant={statusVariants[topic.status]} size="sm">
                            {topic.status === "new"
                              ? t("learner:stateNew")
                              : topic.status === "learning"
                                ? t("learner:stateLearning")
                                : topic.status === "learned"
                                  ? t("learner:stateMastered")
                                  : t("learner:stateReview")}
                          </Badge>
                        </div>

                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {topic.progress}% retained
                          {topic.status === "struggling"
                            ? " • Needs a quick reset"
                            : " • Good candidate for a short review"}
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                          <ProgressBar
                            value={topic.progress}
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            showLabel={false}
                            indicatorClassName="bg-linear-to-r from-primary-500 to-secondary-500"
                          />
                          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {topic.progress}%
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-600 rtl:rotate-180 dark:group-hover:text-neutral-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="learner-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
                Learning health
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                Keep the system calm
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                Small, frequent reviews protect progress better than catch-up sessions.
              </p>
            </div>
            <Badge variant={stats.topicsDue > 0 ? "warning" : "success"} size="sm">
              {stats.topicsDue > 0 ? "Needs attention" : "On track"}
            </Badge>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-[auto_1fr] xl:grid-cols-1">
            <div className="flex justify-center xl:justify-start">
              {isLoading ? (
                <Skeleton variant="circular" width={112} height={112} />
              ) : (
                <ProgressRing
                  value={overallRetention}
                  size={112}
                  variant={stats.topicsDue > 0 ? "secondary" : "success"}
                />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Retention strength</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {overallRetention}%
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    value={overallRetention}
                    size="sm"
                    variant="success"
                    indicatorClassName="bg-linear-to-r from-green-500 to-emerald-400"
                    showLabel={false}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Covered topics</span>
                  <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {stats.totalMastered}/{masteries.length || 0}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    value={masteredShare}
                    size="sm"
                    variant="accent"
                    indicatorClassName="bg-linear-to-r from-accent-500 to-primary-500"
                    showLabel={false}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Next best move
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {stats.topicsDue > 0
                    ? "Clear the due queue before opening a new topic. It is the cheapest way to keep retention high."
                    : "Use one short practice set to reinforce what already feels strong, then expand from there."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Link to="/learner/progress">
              <Button fullWidth variant="outline">
                View progress
              </Button>
            </Link>
            <Link to="/learner/topics">
              <Button
                fullWidth
                rightIcon={<ChevronRight className="h-4 w-4 rtl:rotate-180" />}
              >
                Browse topics
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
