export const ONBOARDING_STORAGE_PREFIX = 'onboarding_done_'

export function getOnboardingStorageKey(userId: string | number) {
  return `${ONBOARDING_STORAGE_PREFIX}${userId}`
}

export function hasCompletedOnboarding(userId: string | number) {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(getOnboardingStorageKey(userId)) === 'true'
}

export function markOnboardingComplete(userId: string | number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getOnboardingStorageKey(userId), 'true')
}

/**
 * Reconcile the per-browser flag with the durable backend preference. Prevents
 * a stale flag (reused integer user ids in dev, or a different device) from
 * skipping onboarding for a learner who never actually completed it.
 */
export function syncOnboardingFlag(userId: string | number, completed: boolean) {
  if (typeof window === 'undefined') return
  const key = getOnboardingStorageKey(userId)
  if (completed) window.localStorage.setItem(key, 'true')
  else window.localStorage.removeItem(key)
}
