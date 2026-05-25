import type { TopicMastery } from '@/services/topics'
import type { BadgeVariant } from '@/components/ui'

/**
 * Mastery Constants
 *
 * Centralizes TopicMastery-related lookups that were previously duplicated
 * across LearnerDashboard, ProgressPage, and LearnerProfilePage.
 */

/** Re-export the canonical TopicMastery type so pages import from one place. */
export type { TopicMastery } from '@/services/topics'

/** Badge variant per mastery status — used by every page that renders topic cards. */
export const MASTERY_STATUS_BADGE_VARIANT: Record<TopicMastery['status'], BadgeVariant> = {
  new: 'outline',
  learning: 'primary',
  struggling: 'warning',
  learned: 'success',
}

/** Short-letter icons for mastery status — used in compact topic rows. */
export const MASTERY_STATUS_ICONS: Record<TopicMastery['status'], string> = {
  new: 'N',
  learning: 'L',
  learned: 'M',
  struggling: 'S',
}
