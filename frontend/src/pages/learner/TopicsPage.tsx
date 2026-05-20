import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Target,
  Clock,
  Play,
  Search,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Card, Button, Badge, Input, ProgressBar, AllCaughtUpIllustration } from "@/components/ui";
import { useTopicMastery } from "@/hooks";
import {
  TOPIC_CATEGORIES,
  TIER_BADGE,
  type TopicCategory,
  type TopicItem,
} from "@/constants/topicCategories";

/**
 * TopicsPage (UC-08 — View Topics: Learner Dashboard & Progress)
 *
 * Browse Discrete Mathematics topics organized by category.
 * Shows FSRS-based progress and review status for each topic.
 *
 * UC-08 Features:
 * - "Due Today" vs "Future Reviews" categorization (Step 3)
 * - FSRS retrievability-based sorting — lowest = highest priority (Step 4)
 * - Tier badges: 🥉 Tier 1 / 🥈 Tier 2 / 🥇 Tier 3 (Step 5)
 * - "Review!" visual cue for due topics (Step 5)
 * - Search / filter bar (Alt Flow 5a)
 * - "All caught up!" state with Study Ahead / New Topics (Alt Flow 3a)
 */

// Mock topic data — includes memory & tier for UC-08
const topicCategories: TopicCategory[] = TOPIC_CATEGORIES;

export function TopicsPage() {
  const { t } = useTranslation(["topics", "learner", "common"]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["logic", "sets"]),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rawMasteries } = useTopicMastery();
  const masteries = useMemo(() => rawMasteries ?? [], [rawMasteries]);

  const mappedCategories = useMemo(() => {
    return topicCategories.map((category) => {
      const topics = category.topics.map((topic) => {
        // Find matching backend mastery
        const m = masteries.find((mastery: any) => {
          const name = (mastery.topic_name || '').toLowerCase();
          const normalizedId = topic.id.toLowerCase();
          if (normalizedId === 'propositional') return name.includes('propositional');
          if (normalizedId === 'predicates') return name.includes('predicate');
          if (normalizedId === 'proofs') return name.includes('proof');
          if (normalizedId === 'operations') return name.includes('operations');
          if (normalizedId === 'venn') return name.includes('venn');
          if (normalizedId === 'power') return name.includes('power');
          if (normalizedId === 'cartesian') return name.includes('cartesian');
          if (normalizedId === 'properties') return name.includes('properties');
          if (normalizedId === 'equivalence') return name.includes('equivalence');
          if (normalizedId === 'partial') return name.includes('partial');
          if (normalizedId === 'functions') return name.includes('functions');
          if (normalizedId === 'counting') return name.includes('count');
          if (normalizedId === 'permutations') return name.includes('permut');
          if (normalizedId === 'combinations') return name.includes('combin');
          if (normalizedId === 'pigeonhole') return name.includes('pigeon');
          if (normalizedId === 'basics') return name.includes('basic') || name.includes('definition');
          if (normalizedId === 'paths') return name.includes('path') || name.includes('cycle');
          if (normalizedId === 'trees') return name.includes('tree');
          if (normalizedId === 'planarity') return name.includes('planar');
          if (normalizedId === 'divisibility') return name.includes('divis');
          if (normalizedId === 'modular') return name.includes('modular');
          if (normalizedId === 'gcd') return name.includes('gcd');
          if (normalizedId === 'primes') return name.includes('prime');
          return false;
        });

        if (m) {
          const isDue = m.next_due && new Date(m.next_due) <= new Date();
          const lastReviewedStr = m.last_reviewed
            ? new Date(m.last_reviewed).toLocaleDateString()
            : undefined;

          // State determination
          let stateVal = topic.state;
          if (m.status === 'learned') {
            stateVal = isDue ? 'review' : 'mastered';
          } else if (m.status === 'struggling') {
            stateVal = 'review';
          } else if (m.status === 'learning') {
            stateVal = 'learning';
          } else if (m.status === 'new') {
            stateVal = 'new';
          }

          return {
            ...topic,
            progress: Math.round((m.memory || 0) * 100),
            questionsDue: isDue ? 5 : 0,
            lastReviewed: lastReviewedStr,
            state: stateVal as any,
            memory: m.memory || 0,
            nextReview: isDue ? 'today' : m.next_due ? new Date(m.next_due).toLocaleDateString() : undefined,
          };
        }

        return topic;
      });

      return {
        ...category,
        topics,
      };
    });
  }, [masteries]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getStateColor = (state: TopicItem["state"]) => {
    switch (state) {
      case "mastered":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "review":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "learning":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
      case "new":
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400";
    }
  };

  const getStateLabel = (state: TopicItem["state"]) => {
    switch (state) {
      case "mastered":
        return t("learner:stateMastered");
      case "review":
        return t("learner:stateReview");
      case "learning":
        return t("learner:stateLearning");
      case "new":
        return t("learner:stateNew");
    }
  };

  // --- Search / filter (UC-08 Alt Flow 5a) ---
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return mappedCategories;
    const q = searchQuery.toLowerCase();
    return mappedCategories
      .map((cat) => ({
        ...cat,
        topics: cat.topics.filter((topic) =>
          t(topic.nameKey).toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.topics.length > 0);
  }, [searchQuery, t, mappedCategories]);

  // --- Due Today vs Future Reviews (UC-08 Step 3) ---
  const allTopics = useMemo(
    () => mappedCategories.flatMap((cat) => cat.topics),
    [mappedCategories],
  );

  const dueTodayTopics = useMemo(
    () =>
      allTopics
        .filter((t) => t.nextReview === "today")
        .sort((a, b) => a.memory - b.memory), // UC-08 Step 4: lowest memory first
    [allTopics],
  );

  const futureReviewTopics = useMemo(
    () =>
      allTopics.filter(
        (t) => t.nextReview && t.nextReview !== "today" && t.state !== "new",
      ),
    [allTopics],
  );

  const newTopics = useMemo(
    () => allTopics.filter((t) => t.state === "new"),
    [allTopics],
  );

  // Calculate overall stats
  const totalTopics = allTopics.length;
  const topicsDue = dueTodayTopics.length;
  const avgProgress = Math.round(
    allTopics.reduce((sum, t) => sum + t.progress, 0) / totalTopics,
  );

  // UC-08 Alt Flow 3a: All caught up?
  const allCaughtUp = topicsDue === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
          {t("topics:discreteMath")}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          {t("learner:browseTopics")}
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {totalTopics}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("learner:totalTopics")}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {topicsDue}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("learner:dueForReview")}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
              <Target className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {avgProgress}%
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("learner:avgProgress")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search bar (UC-08 Alt Flow 5a) */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t("learner:searchTopics")}
        leftIcon={<Search className="h-4 w-4" />}
        size="md"
        className="rounded-xl py-2.5"
      />

      {/* ═══ All Caught Up state (UC-08 Alt Flow 3a) ═══ */}
      {allCaughtUp ? (
        <Card className="text-center py-8">
          <div className="flex flex-col items-center gap-3">
            <AllCaughtUpIllustration className="mx-auto" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
              {t("learner:allCaughtUp")}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
              {t("learner:allCaughtUpDescription")}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {futureReviewTopics.length > 0 && (
                <Link to="/learner/practice">
                  <Button
                    variant="outline"
                    leftIcon={<TrendingUp className="w-4 h-4" />}
                  >
                    {t("learner:studyAhead")}
                  </Button>
                </Link>
              )}
              {newTopics.length > 0 && (
                <Link to="/learner/practice">
                  <Button leftIcon={<BookOpen className="w-4 h-4" />}>
                    {t("learner:exploreNewTopics", { count: newTopics.length })}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      ) : (
        /* Start practice CTA — only when topics are due */
        <Card className="bg-linear-to-r from-primary-500 to-primary-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {t("learner:topicsProgress", { due: topicsDue })}
              </p>
              <p className="text-sm text-primary-100">
                {t("learner:keepKnowledgeFresh")}
              </p>
            </div>
            <Link to="/learner/practice">
              <Button
                variant="outline"
                className="border-white/50 dark:border-white/50 text-white hover:bg-white/20 hover:border-white/70 dark:hover:bg-white/20 dark:hover:border-white/70"
                leftIcon={<Play className="w-4 h-4" />}
              >
                {t("learner:startSession")}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ═══ Due Today section (UC-08 Step 3) — sorted by memory ═══ */}
      {dueTodayTopics.length > 0 && !searchQuery && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
            {t("learner:dueToday")}
            <Badge variant="primary" size="sm">
              {dueTodayTopics.length}
            </Badge>
          </h2>
          <div className="space-y-2">
            {dueTodayTopics.map((topic) => (
              <Card
                key={topic.id}
                padding="sm"
                className="hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-mono shrink-0">
                    {topic.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                        {t(topic.nameKey)}
                      </h4>
                      {/* Tier badge (UC-08 Step 5) */}
                      <span
                        className="text-sm"
                        title={t("learner:tier", { level: topic.tier })}
                      >
                        {TIER_BADGE[topic.tier]}
                      </span>
                      <Badge size="sm" className={getStateColor(topic.state)}>
                        {getStateLabel(topic.state)}
                      </Badge>
                      {/* "Review!" cue (UC-08 Step 5) */}
                      <Badge
                        size="sm"
                        variant="primary"
                        className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse"
                      >
                        {t("learner:reviewCue")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      <span>
                        {topic.questionsTotal} {t("learner:questions")}
                      </span>
                      <span className="text-primary-600 dark:text-primary-400 font-medium">
                        {topic.questionsDue} {t("learner:due")}
                      </span>
                      <span>
                        {t("learner:memoryLabel")}:{" "}
                        {Math.round(topic.memory * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <ProgressBar
                        value={topic.progress}
                        size="sm"
                        showLabel={false}
                      />
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1">
                        {topic.progress}%
                      </p>
                    </div>
                    <Link to={`/learner/practice?topic=${topic.id}`}>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Future Reviews section (UC-08 Step 3) ═══ */}
      {futureReviewTopics.length > 0 && !searchQuery && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            {t("learner:futureReviews")}
            <Badge variant="default" size="sm">
              {futureReviewTopics.length}
            </Badge>
          </h2>
          <div className="space-y-2">
            {futureReviewTopics.map((topic) => (
              <Card
                key={topic.id}
                padding="sm"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-mono shrink-0">
                    {topic.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                        {t(topic.nameKey)}
                      </h4>
                      <span
                        className="text-sm"
                        title={t("learner:tier", { level: topic.tier })}
                      >
                        {TIER_BADGE[topic.tier]}
                      </span>
                      <Badge size="sm" className={getStateColor(topic.state)}>
                        {getStateLabel(topic.state)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      <span>
                        {topic.questionsTotal} {t("learner:questions")}
                      </span>
                      <span>
                        {t("learner:nextReviewIn")}: {topic.nextReview}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <ProgressBar
                        value={topic.progress}
                        size="sm"
                        showLabel={false}
                      />
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1">
                        {topic.progress}%
                      </p>
                    </div>
                    <Link to={`/learner/practice?topic=${topic.id}`}>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Browse by category (with search filtering) ═══ */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
          {t("learner:browseByCategory")}
        </h2>
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <Card className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                <p className="text-neutral-500 dark:text-neutral-400">
                  {t("common:noResults")}
                </p>
              </div>
            </Card>
          ) : (
            filteredCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const categoryProgress = Math.round(
                category.topics.reduce((sum, t) => sum + t.progress, 0) /
                  category.topics.length,
              );
              const categoryDue = category.topics.filter(
                (t) => t.questionsDue > 0,
              ).length;

              return (
                <Card key={category.id} className="overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <div className="flex-1 text-start">
                      <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                        {t(category.nameKey)}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t("learner:categoryInfo", {
                          count: category.topics.length,
                          progress: categoryProgress,
                        })}
                        {categoryDue > 0 && (
                          <span className="text-primary-600 dark:text-primary-400 ms-2">
                            · {t("learner:categoryDue", { count: categoryDue })}
                          </span>
                        )}
                      </p>
                    </div>
                    <ProgressBar
                      value={categoryProgress}
                      size="sm"
                      className="w-24"
                      showLabel={false}
                    />
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-neutral-400 rtl:rotate-180" />
                    )}
                  </button>

                  {/* Topic list */}
                  {isExpanded && (
                    <div className="border-t border-neutral-100 dark:border-neutral-700">
                      {category.topics.map((topic, index) => (
                        <div
                          key={topic.id}
                          className={`p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                            index !== category.topics.length - 1
                              ? "border-b border-neutral-100 dark:border-neutral-700"
                              : ""
                          }`}
                        >
                          <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg font-mono shrink-0">
                            {topic.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                                {t(topic.nameKey)}
                              </h4>
                              {/* Tier badge (UC-08 Step 5) */}
                              <span
                                className="text-sm"
                                title={t("learner:tier", { level: topic.tier })}
                              >
                                {TIER_BADGE[topic.tier]}
                              </span>
                              <Badge
                                size="sm"
                                className={`shrink-0 ${getStateColor(topic.state)}`}
                              >
                                {getStateLabel(topic.state)}
                              </Badge>
                              {/* "Review!" cue for due topics */}
                              {topic.nextReview === "today" && (
                                <Badge
                                  size="sm"
                                  className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px]"
                                >
                                  {t("learner:reviewCue")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              <span>
                                {topic.questionsTotal} {t("learner:questions")}
                              </span>
                              {topic.questionsDue > 0 && (
                                <span className="text-primary-600 dark:text-primary-400 font-medium">
                                  {topic.questionsDue} {t("learner:due")}
                                </span>
                              )}
                              {topic.lastReviewed && (
                                <span>
                                  {t("learner:lastReviewed")}:{" "}
                                  {topic.lastReviewed}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20">
                              <ProgressBar
                                value={topic.progress}
                                size="sm"
                                showLabel={false}
                              />
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1">
                                {topic.progress}%
                              </p>
                            </div>
                            <Link to={`/learner/practice?topic=${topic.id}`}>
                              <Button variant="ghost" size="sm">
                                <Play className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
