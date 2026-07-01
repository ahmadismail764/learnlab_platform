import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Compass } from 'lucide-react'
import { Card } from '@/components/ui'
import { TopicCatalog } from './TopicCatalog'
import type { BackendSubtopic } from '@/services/topics'

interface ExploreTopicsProps {
  /** Not-yet-enrolled subtopics. */
  subtopics: BackendSubtopic[]
  onEnroll: (subtopicId: string) => void
  enrollingId?: string | number | null
  /** Open on mount — used when the learner has no enrolled topics yet. */
  defaultOpen?: boolean
}

/**
 * Collapsed "Explore more topics" section on the Topics page. Holds the enroll
 * catalog; open by default only when the learner has nothing enrolled so the
 * empty state never hides the way forward.
 */
export function ExploreTopics({ subtopics, onEnroll, enrollingId, defaultOpen = false }: ExploreTopicsProps) {
  const { t } = useTranslation(['learner'])
  const [open, setOpen] = useState(defaultOpen)

  if (subtopics.length === 0) return null

  return (
    <Card className="overflow-hidden" padding="none">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-4 text-start transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-300">
          <Compass className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('learner:exploreMoreTopics', { count: subtopics.length })}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('learner:exploreMoreDescription')}
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400 rtl:rotate-180" />
        )}
      </button>

      {open && (
        <div className="border-t border-neutral-100 p-4 dark:border-neutral-700">
          <TopicCatalog subtopics={subtopics} onEnroll={onEnroll} enrollingId={enrollingId} />
        </div>
      )}
    </Card>
  )
}
