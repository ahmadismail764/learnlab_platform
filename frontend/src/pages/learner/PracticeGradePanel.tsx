import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { SectionHeading } from '@/components/common'
import { cn } from '@/utils/cn'
import { FSRS_GRADE_OPTIONS, type FSRSGrade } from './practiceSession'

interface PracticeGradePanelProps {
  onGrade: (grade: FSRSGrade) => void
}

export function PracticeGradePanel({ onGrade }: PracticeGradePanelProps) {
  const { t } = useTranslation('practice')

  return (
    <Card>
      <SectionHeading
        title={t('difficultyPromptTitle')}
        description={t('difficultyPromptDescription')}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {FSRS_GRADE_OPTIONS.map((button) => (
          <button
            key={button.grade}
            type="button"
            onClick={() => onGrade(button.grade)}
            className={cn(
              'rounded-2xl px-4 py-4 text-center text-white transition-transform hover:-translate-y-0.5',
              button.tone,
            )}
          >
            <p className="flex items-center justify-center gap-2 text-sm font-semibold">
              <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border border-white/30 bg-white/10 font-sans text-[10px] font-bold text-white">
                {button.grade}
              </kbd>
              {t(button.labelKey)}
            </p>
            <p className="mt-1 text-xs text-white/80">{t(button.subKey)}</p>
          </button>
        ))}
      </div>
    </Card>
  )
}
