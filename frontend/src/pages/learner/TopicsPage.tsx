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
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { Card, Button, Badge, ProgressBar } from "@/components/ui";

/**
 * TopicsPage (UC-08 — View Topics: Learner Dashboard & Progress)
 *
 * Browse Discrete Mathematics topics organized by category.
 * Shows FIRe-based progress and review status for each topic.
 *
 * UC-08 Features:
 * - "Due Today" vs "Future Reviews" categorization (Step 3)
 * - FIRe memory-based sorting — lowest = highest priority (Step 4)
 * - Tier badges: 🥉 Tier 1 / 🥈 Tier 2 / 🥇 Tier 3 (Step 5)
 * - "Review!" visual cue for due topics (Step 5)
 * - Search / filter bar (Alt Flow 5a)
 * - "All caught up!" state with Study Ahead / New Topics (Alt Flow 3a)
 */

interface TopicItem {
  id: string;
  nameKey: string;
  icon: string;
  progress: number;
  questionsTotal: number;
  questionsDue: number;
  lastReviewed?: string;
  state: "new" | "learning" | "review" | "mastered";
  /** FIRe memory 0–1 — lower = more urgent (UC-08 Step 4) */
  memory: number;
  /** Scaffolding tier 1–3 (UC-08 Step 5) */
  tier: 1 | 2 | 3;
  /** Next scheduled review date label */
  nextReview?: string;
}

interface TopicCategory {
  id: string;
  nameKey: string;
  icon: string;
  topics: TopicItem[];
}

// Mock topic data — includes memory & tier for UC-08
const topicCategories: TopicCategory[] = [
  {
    id: "logic",
    nameKey: "topics:logic.title",
    icon: "🔢",
    topics: [
      {
        id: "propositional",
        nameKey: "topics:logic.propositional",
        icon: "→",
        progress: 75,
        questionsTotal: 20,
        questionsDue: 3,
        lastReviewed: "2 days ago",
        state: "review",
        memory: 0.62,
        tier: 2,
        nextReview: "today",
      },
      {
        id: "predicates",
        nameKey: "topics:logic.predicates",
        icon: "∀",
        progress: 45,
        questionsTotal: 15,
        questionsDue: 5,
        lastReviewed: "1 week ago",
        state: "learning",
        memory: 0.38,
        tier: 1,
        nextReview: "today",
      },
      {
        id: "quantifiers",
        nameKey: "topics:logic.quantifiers",
        icon: "∃",
        progress: 20,
        questionsTotal: 12,
        questionsDue: 8,
        state: "learning",
        memory: 0.25,
        tier: 1,
        nextReview: "today",
      },
      {
        id: "proofs",
        nameKey: "topics:logic.proofTechniques",
        icon: "⊢",
        progress: 0,
        questionsTotal: 18,
        questionsDue: 0,
        state: "new",
        memory: 1.0,
        tier: 3,
      },
    ],
  },
  {
    id: "sets",
    nameKey: "topics:sets.title",
    icon: "∪",
    topics: [
      {
        id: "operations",
        nameKey: "topics:sets.operations",
        icon: "∩",
        progress: 90,
        questionsTotal: 16,
        questionsDue: 1,
        lastReviewed: "1 day ago",
        state: "mastered",
        memory: 0.92,
        tier: 2,
        nextReview: "in 5 days",
      },
      {
        id: "venn",
        nameKey: "topics:sets.vennDiagrams",
        icon: "◯",
        progress: 60,
        questionsTotal: 10,
        questionsDue: 2,
        lastReviewed: "3 days ago",
        state: "review",
        memory: 0.55,
        tier: 1,
        nextReview: "today",
      },
      {
        id: "power",
        nameKey: "topics:sets.powerSets",
        icon: "P",
        progress: 30,
        questionsTotal: 12,
        questionsDue: 6,
        state: "learning",
        memory: 0.3,
        tier: 2,
        nextReview: "today",
      },
      {
        id: "cartesian",
        nameKey: "topics:sets.cartesianProduct",
        icon: "×",
        progress: 0,
        questionsTotal: 14,
        questionsDue: 0,
        state: "new",
        memory: 1.0,
        tier: 1,
      },
    ],
  },
  {
    id: "relations",
    nameKey: "topics:relations.title",
    icon: "≡",
    topics: [
      {
        id: "properties",
        nameKey: "topics:relations.properties",
        icon: "R",
        progress: 55,
        questionsTotal: 18,
        questionsDue: 4,
        lastReviewed: "4 days ago",
        state: "review",
        memory: 0.48,
        tier: 2,
        nextReview: "today",
      },
      {
        id: "equivalence",
        nameKey: "topics:relations.equivalence",
        icon: "~",
        progress: 25,
        questionsTotal: 14,
        questionsDue: 7,
        state: "learning",
        memory: 0.22,
        tier: 2,
        nextReview: "today",
      },
      {
        id: "partial",
        nameKey: "topics:relations.partialOrders",
        icon: "≤",
        progress: 0,
        questionsTotal: 16,
        questionsDue: 0,
        state: "new",
        memory: 1.0,
        tier: 3,
      },
      {
        id: "functions",
        nameKey: "topics:relations.functions",
        icon: "f",
        progress: 10,
        questionsTotal: 20,
        questionsDue: 10,
        state: "learning",
        memory: 0.15,
        tier: 1,
        nextReview: "today",
      },
    ],
  },
  {
    id: "combinatorics",
    nameKey: "topics:combinatorics.title",
    icon: "📊",
    topics: [
      {
        id: "counting",
        nameKey: "topics:combinatorics.counting",
        icon: "#",
        progress: 80,
        questionsTotal: 14,
        questionsDue: 2,
        lastReviewed: "2 days ago",
        state: "review",
        memory: 0.7,
        tier: 1,
        nextReview: "tomorrow",
      },
      {
        id: "permutations",
        nameKey: "topics:combinatorics.permutations",
        icon: "P",
        progress: 65,
        questionsTotal: 12,
        questionsDue: 3,
        lastReviewed: "5 days ago",
        state: "review",
        memory: 0.5,
        tier: 2,
        nextReview: "tomorrow",
      },
      {
        id: "combinations",
        nameKey: "topics:combinatorics.combinations",
        icon: "C",
        progress: 40,
        questionsTotal: 12,
        questionsDue: 5,
        state: "learning",
        memory: 0.35,
        tier: 2,
        nextReview: "in 2 days",
      },
      {
        id: "pigeonhole",
        nameKey: "topics:combinatorics.pigeonhole",
        icon: "🕊",
        progress: 0,
        questionsTotal: 8,
        questionsDue: 0,
        state: "new",
        memory: 1.0,
        tier: 3,
      },
    ],
  },
  {
    id: "graphTheory",
    nameKey: "topics:graphTheory.title",
    icon: "🔗",
    topics: [
      {
        id: "basics",
        nameKey: "topics:graphTheory.basics",
        icon: "G",
        progress: 50,
        questionsTotal: 16,
        questionsDue: 4,
        lastReviewed: "3 days ago",
        state: "review",
        memory: 0.52,
        tier: 1,
        nextReview: "today",
      },
      {
        id: "paths",
        nameKey: "topics:graphTheory.paths",
        icon: "→",
        progress: 35,
        questionsTotal: 14,
        questionsDue: 6,
        state: "learning",
        memory: 0.28,
        tier: 2,
        nextReview: "today",
      },
      {
        id: "trees",
        nameKey: "topics:graphTheory.trees",
        icon: "🌳",
        progress: 15,
        questionsTotal: 12,
        questionsDue: 8,
        state: "learning",
        memory: 0.18,
        tier: 2,
        nextReview: "today",
      },
      {
        id: "planarity",
        nameKey: "topics:graphTheory.planarity",
        icon: "◇",
        progress: 0,
        questionsTotal: 10,
        questionsDue: 0,
        state: "new",
        memory: 1.0,
        tier: 3,
      },
    ],
  },
  {
    id: "numberTheory",
    nameKey: "topics:numberTheory.title",
    icon: "🔢",
    topics: [
      {
        id: "divisibility",
        nameKey: "topics:numberTheory.divisibility",
        icon: "|",
        progress: 70,
        questionsTotal: 14,
        questionsDue: 2,
        lastReviewed: "1 day ago",
        state: "review",
        memory: 0.78,
        tier: 1,
        nextReview: "in 3 days",
      },
      {
        id: "modular",
        nameKey: "topics:numberTheory.modularArithmetic",
        icon: "%",
        progress: 45,
        questionsTotal: 16,
        questionsDue: 5,
        state: "learning",
        memory: 0.33,
        tier: 2,
        nextReview: "today",
      },
      {
        id: "gcd",
        nameKey: "topics:numberTheory.gcd",
        icon: "÷",
        progress: 85,
        questionsTotal: 10,
        questionsDue: 1,
        lastReviewed: "2 days ago",
        state: "mastered",
        memory: 0.88,
        tier: 1,
        nextReview: "in 7 days",
      },
      {
        id: "primes",
        nameKey: "topics:numberTheory.primes",
        icon: "p",
        progress: 20,
        questionsTotal: 12,
        questionsDue: 7,
        state: "learning",
        memory: 0.2,
        tier: 1,
        nextReview: "today",
      },
    ],
  },
];

/** Tier badge emoji (UC-08 Step 5) */
const TIER_BADGE: Record<number, string> = {
  1: "🥉",
  2: "🥈",
  3: "🥇",
};

export function TopicsPage() {
  const { t } = useTranslation(["topics", "learner", "common"]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["logic", "sets"]),
  );
  const [searchQuery, setSearchQuery] = useState("");

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
    if (!searchQuery.trim()) return topicCategories;
    const q = searchQuery.toLowerCase();
    return topicCategories
      .map((cat) => ({
        ...cat,
        topics: cat.topics.filter((topic) =>
          t(topic.nameKey).toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.topics.length > 0);
  }, [searchQuery, t]);

  // --- Due Today vs Future Reviews (UC-08 Step 3) ---
  const allTopics = useMemo(
    () => topicCategories.flatMap((cat) => cat.topics),
    [],
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
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("learner:searchTopics")}
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
        />
      </div>

      {/* ═══ All Caught Up state (UC-08 Alt Flow 3a) ═══ */}
      {allCaughtUp ? (
        <Card className="text-center py-8">
          <div className="flex flex-col items-center gap-3">
            <PartyPopper className="w-12 h-12 text-primary-500" />
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
                    leftIcon={<Sparkles className="w-4 h-4" />}
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
            <Sparkles className="w-5 h-5 text-amber-500" />
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
