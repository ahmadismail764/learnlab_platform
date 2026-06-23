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
