import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { useToast } from '@/contexts'
import { useSubtopics, useTopicMastery, useEnrollments, useEnroll, useUnenroll } from '@/hooks'
import { getTopicDisplayName } from '@/utils/topicLabels'
import { buildTopicItems, type TopicItem } from './topicItems'
import { MyTopics } from './MyTopics'
import { ExploreTopics } from './ExploreTopics'
import { UnenrollTopicDialog } from './UnenrollTopicDialog'

/**
 * TopicsPage
 *
 * One place for everything topic-related. *My Topics* (enrolled) is the primary
 * view; *Explore* (collapsed) is the enroll catalog. Enrollment = a
 * SubtopicMastery row, so enrolled subtopics are those with mastery; the rest
 * are the catalog. Heavy rendering lives in MyTopics / ExploreTopics.
 */
export function TopicsPage() {
  const { t } = useTranslation(['topics', 'learner', 'common'])
  const { showError, showSuccess } = useToast()

  const { data: rawSubtopics, isLoading: topicsLoading } = useSubtopics()
  const { data: rawMasteries } = useTopicMastery()
  const { data: rawEnrollments } = useEnrollments()

  const subtopics = useMemo(() => rawSubtopics ?? [], [rawSubtopics])
  const masteries = useMemo(() => rawMasteries ?? [], [rawMasteries])
  const enrollments = useMemo(() => rawEnrollments ?? [], [rawEnrollments])

  // subtopic id -> enrollment (SubtopicMastery) id, needed to unenroll.
  const enrollmentIdBySubtopic = useMemo(() => {
    const map = new Map<string, string | number>()
    for (const enrollment of enrollments) map.set(String(enrollment.subtopic), enrollment.id)
    return map
  }, [enrollments])

  const enrolledSubtopics = useMemo(
    () => subtopics.filter((s) => enrollmentIdBySubtopic.has(String(s.id))),
    [subtopics, enrollmentIdBySubtopic],
  )
  const catalogSubtopics = useMemo(
    () => subtopics.filter((s) => !enrollmentIdBySubtopic.has(String(s.id))),
    [subtopics, enrollmentIdBySubtopic],
  )
  const enrolledTopicItems = useMemo(
    () => buildTopicItems(enrolledSubtopics, masteries),
    [enrolledSubtopics, masteries],
  )

  const enroll = useEnroll()
  const unenroll = useUnenroll()
  const [unenrollTarget, setUnenrollTarget] = useState<TopicItem | null>(null)

  const handleEnroll = (subtopicId: string) => {
    enroll.mutate(subtopicId, {
      onSuccess: () => showSuccess(t('learner:enrollSuccess')),
      onError: (err) => showError(err instanceof Error ? err.message : t('learner:enrollFailed')),
    })
  }

  const confirmUnenroll = () => {
    if (!unenrollTarget) return
    const enrollmentId = enrollmentIdBySubtopic.get(unenrollTarget.id)
    if (!enrollmentId) {
      setUnenrollTarget(null)
      return
    }
    unenroll.mutate(enrollmentId, {
      onSuccess: () => showSuccess(t('learner:removeTopicSuccess')),
      onError: (err) => showError(err instanceof Error ? err.message : t('learner:removeTopicFailed')),
      onSettled: () => setUnenrollTarget(null),
    })
  }

  const hasNoEnrollments = enrolledSubtopics.length === 0

  if (topicsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('common:loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
          {t('topics:discreteMath')}
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">{t('learner:browseTopics')}</p>
      </div>

      {hasNoEnrollments ? (
        <Card className="py-8 text-center">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            {t('learner:noEnrolledTopicsTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
            {t('learner:noEnrolledTopicsDescription')}
          </p>
        </Card>
      ) : (
        <MyTopics
          topics={enrolledTopicItems}
          onRequestUnenroll={setUnenrollTarget}
          unenrollingId={unenroll.isPending ? unenrollTarget?.id ?? null : null}
        />
      )}

      <ExploreTopics
        subtopics={catalogSubtopics}
        onEnroll={handleEnroll}
        enrollingId={enroll.isPending ? enroll.variables ?? null : null}
        defaultOpen={hasNoEnrollments}
      />

      <UnenrollTopicDialog
        isOpen={!!unenrollTarget}
        topicName={unenrollTarget ? getTopicDisplayName(t, unenrollTarget.name) : ''}
        isPending={unenroll.isPending}
        onConfirm={confirmUnenroll}
        onClose={() => {
          if (!unenroll.isPending) setUnenrollTarget(null)
        }}
      />
    </div>
  )
}
