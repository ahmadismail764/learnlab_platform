/**
 * Shared TypeScript Types Index
 * 
 * Global type definitions used across the application.
 * Feature-specific types live in their feature folders.
 * 
 * Domain: Learn Lab - Discrete Mathematics Learning Platform
 * Target: First-year college students
 * 
 * Stakeholders:
 * - Student: Primary user - solves problems, views progress
 * - Admin (System Admin): Content manager - manages question bank, difficulty tiers
 * - Supervisor: Academic advisor - reviews pedagogical validity
 */

// ============================================
// User & Role Types
// ============================================

/**
 * User roles in the system
 * - student: Primary learner
 * - admin: System administrator / Content manager
 * - supervisor: Academic advisor / Content reviewer
 */
export type UserRole = 'student' | 'admin' | 'supervisor'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

/** Extended user profile for students */
export interface StudentProfile extends User {
  role: 'student'
  totalXP: number
  level: number
  streakCount: number
  lastActiveAt: string
}

// ============================================
// Course & Topic Types (OCP: Configurable)
// ============================================

/**
 * Course configuration - designed for extensibility
 * Currently: Discrete Mathematics
 * Can be extended for other courses following OCP
 */
export interface CourseConfig {
  id: string
  name: string
  description: string
  icon?: string
  topics: Topic[]
}

/**
 * Topic within a course
 * Represents an atomic unit of learning
 */
export interface Topic {
  id: string
  courseId: string
  name: string
  /** Translation key for localization */
  nameKey: string
  description?: string
  /** Parent topic ID for hierarchical topics */
  parentId?: string
  /** Order within parent/course */
  order: number
  /** Whether this topic has subtopics */
  hasChildren: boolean
}

// ============================================
// FSRS (Free Spaced Repetition Scheduler) Types
// ============================================

/**
 * FSRS scheduling data for a topic
 * Based on the FSRS-4.5 algorithm
 */
export interface FSRSData {
  /** Stability: Expected retention period (days) */
  stability: number
  /** Difficulty: How hard the topic is for this user (0-10) */
  difficulty: number
  /** Number of times reviewed */
  reps: number
  /** Number of lapses (forgotten) */
  lapses: number
  /** Last review date */
  lastReview: string
  /** Next scheduled review date */
  nextReview: string
  /** Current state: new, learning, review, relearning */
  state: 'new' | 'learning' | 'review' | 'relearning'
}

/**
 * Topic with user's FSRS scheduling data
 */
export interface UserTopic {
  topic: Topic
  fsrs: FSRSData
  /** User's mastery percentage (0-100) */
  mastery: number
}

// ============================================
// Question & Difficulty Types
// ============================================

/**
 * Difficulty tiers for scaffolding
 * Tier 1: Basic - foundational understanding
 * Tier 2: Intermediate - application of concepts
 * Tier 3: Advanced - complex problem solving
 */
export type DifficultyTier = 1 | 2 | 3

export interface Question {
  id: string
  topicId: string
  tier: DifficultyTier
  /** Question content (may contain LaTeX) */
  content: string
  /** Expected answer format */
  answerType: 'symbolic' | 'multiple-choice' | 'true-false' | 'text'
  /** Correct answer(s) */
  correctAnswer: string | string[]
  /** Solution steps for feedback */
  solutionSteps: SolutionStep[]
  /** Hints (progressive disclosure) */
  hints?: string[]
  /** XP reward for correct answer */
  xpReward: number
  /** Estimated time to solve (seconds) */
  estimatedTime?: number
  /** Review status for admin workflow */
  status: 'draft' | 'pending_review' | 'approved' | 'archived'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SolutionStep {
  order: number
  content: string
  /** Optional explanation for this step */
  explanation?: string
}

// ============================================
// Practice Session Types
// ============================================

export interface PracticeSession {
  id: string
  userId: string
  /** Topics included in this session (interleaved) */
  topicIds: string[]
  questions: SessionQuestion[]
  startedAt: string
  completedAt?: string
  /** Total XP earned in session */
  totalXP: number
}

export interface SessionQuestion {
  questionId: string
  /** User's submitted answer */
  userAnswer?: string
  /** Whether the answer was correct */
  isCorrect?: boolean
  /** Time taken to answer (ms) */
  timeSpent?: number
  /** XP earned for this question */
  xpEarned?: number
  answeredAt?: string
}

// ============================================
// Gamification Types
// ============================================

export interface XPTransaction {
  id: string
  userId: string
  amount: number
  /** Source of XP */
  source: 'question' | 'streak_bonus' | 'achievement' | 'challenge'
  /** Multiplier applied (streak, etc.) */
  multiplier: number
  createdAt: string
}

export interface Achievement {
  id: string
  nameKey: string
  descriptionKey: string
  icon: string
  /** Condition to unlock (for display) */
  conditionKey: string
  xpReward: number
}

export interface UserAchievement {
  achievementId: string
  unlockedAt: string
}

// ============================================
// Review Queue Types (FR-02)
// ============================================

export interface DailyReviewQueue {
  date: string
  userId: string
  /** Topics due for review, ordered by priority */
  topics: UserTopic[]
  /** Whether interleaving is enabled */
  interleaved: boolean
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// Common Utility Types
// ============================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined

/** Make specific keys optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Make specific keys required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
