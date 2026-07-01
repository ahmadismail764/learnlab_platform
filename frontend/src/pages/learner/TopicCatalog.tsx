import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { getTopicCategoryDisplayName, getTopicDisplayName } from '@/utils/topicLabels'
import type { BackendSubtopic } from '@/services/topics'

interface TopicCatalogProps {
  /** Not-yet-enrolled subtopics to offer. */
  subtopics: BackendSubtopic[]
  onEnroll: (subtopicId: string) => void
  /** Subtopic id currently being enrolled (shows a pending state on that card). */
  enrollingId?: string | number | null
  emptyLabel?: string
}

/**
 * A browse-and-enroll catalog: not-yet-enrolled topics grouped by category, each
 * with a single Add action. No progress/mastery UI (there's nothing to show
 * until enrolled). Reused by the Topics page (Explore) and onboarding.
 */
export function TopicCatalog({ subtopics, onEnroll, enrollingId, emptyLabel }: TopicCatalogProps) {
  const { t } = useTranslation(['learner', 'topics'])

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

  if (subtopics.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {emptyLabel ?? t('learner:exploreEmpty')}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map(([category, items]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
            {getTopicCategoryDisplayName(t, category)}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((subtopic) => {
              const id = String(subtopic.id)
              const isEnrolling = String(enrollingId ?? '') === id
              return (
                <Card key={id} padding="sm" className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {getTopicDisplayName(t, subtopic.name)}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {subtopic.question_count} {t('learner:questions')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Plus className="h-4 w-4" />}
                    isLoading={isEnrolling}
                    disabled={isEnrolling}
                    onClick={() => onEnroll(id)}
                  >
                    {t('learner:addTopic')}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
