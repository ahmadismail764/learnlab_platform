import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/utils/cn'
import { getTopicCategoryDisplayName, getTopicDisplayName } from '@/utils/topicLabels'
import type { BackendSubtopic } from '@/services/topics'

interface OnboardingTopicPickerProps {
  subtopics: BackendSubtopic[]
  /** Recommended subtopic ids, pre-checked so accepting defaults is one click. */
  defaultSelected: string[]
  onSubmit: (subtopicIds: string[]) => void
  onBack: () => void
  onSkip: () => void
  isSubmitting: boolean
}

/**
 * First-run topic picker. Multi-select with a recommended set pre-checked;
 * "Add N & continue" enrolls the selection in one go. Requires at least one
 * pick so the learner never lands in an empty app.
 */
export function OnboardingTopicPicker({
  subtopics,
  defaultSelected,
  onSubmit,
  onBack,
  onSkip,
  isSubmitting,
}: OnboardingTopicPickerProps) {
  const { t } = useTranslation(['learner', 'common'])
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected))

  const recommended = useMemo(() => new Set(defaultSelected), [defaultSelected])

  const groups = useMemo(() => {
    const byCategory = new Map<string, BackendSubtopic[]>()
    for (const subtopic of subtopics) {
      const category = subtopic.topic_name || 'Uncategorized'
      const list = byCategory.get(category) ?? []
      list.push(subtopic)
      byCategory.set(category, list)
    }
    return Array.from(byCategory.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [subtopics])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const count = selected.size

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
          {t('learner:onboardingPickTitle')}
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {t('learner:onboardingPickDescription')}
        </p>
      </div>

      <div className="space-y-5">
        {groups.map(([category, items]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              {getTopicCategoryDisplayName(t, category)}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((subtopic) => {
                const id = String(subtopic.id)
                const isSelected = selected.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={isSelected}
                    disabled={isSubmitting}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 text-start transition-colors',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-950/30'
                        : 'border-neutral-200 bg-white hover:border-primary-300 dark:border-neutral-700 dark:bg-neutral-900/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                        isSelected
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-neutral-300 dark:border-neutral-600',
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {getTopicDisplayName(t, subtopic.name)}
                        </span>
                        {recommended.has(id) && (
                          <span className="shrink-0 rounded-full bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300">
                            {t('learner:onboardingRecommended')}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                        {subtopic.question_count} {t('learner:questions')}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-neutral-200/80 bg-white/80 px-1 py-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <Button variant="ghost" onClick={onBack} disabled={isSubmitting} leftIcon={<ArrowLeft className="h-4 w-4 rtl:rotate-180" />}>
          {t('common:back')}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onSkip} disabled={isSubmitting}>
            {t('learner:onboardingSkip')}
          </Button>
          <Button
            onClick={() => onSubmit([...selected])}
            isLoading={isSubmitting}
            disabled={count === 0 || isSubmitting}
            rightIcon={!isSubmitting ? <ArrowRight className="h-4 w-4 rtl:rotate-180" /> : undefined}
          >
            {t('learner:onboardingAddAndContinue', { count })}
          </Button>
        </div>
      </div>
    </div>
  )
}
