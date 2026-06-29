import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { convertLatexToAsciiMath } from 'mathlive'
import { ArrowRight } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { SectionHeading } from '@/components/common'
import { MathInput } from '@/components/MathInput'

interface WrittenAnswerPanelProps {
  /** Receives the answer as plain ASCII math (what the CAS grader expects). */
  onSubmit: (asciiAnswer: string) => void
  isSubmitting: boolean
  disabled?: boolean
}

/**
 * Free-response answer entry for WRITTEN questions. The learner types with the
 * MathLive keyboard (LaTeX); on submit we convert to plain ASCII math, which is
 * what the backend's SymPy/CAS grader parses.
 */
export function WrittenAnswerPanel({ onSubmit, isSubmitting, disabled = false }: WrittenAnswerPanelProps) {
  const { t } = useTranslation(['practice'])
  const [latex, setLatex] = useState('')

  const handleSubmit = () => {
    const ascii = convertLatexToAsciiMath(latex).trim()
    if (!ascii) return
    onSubmit(ascii)
  }

  const isDisabled = disabled || isSubmitting

  return (
    <Card>
      <SectionHeading
        title={t('practice:writtenPromptTitle')}
        description={t('practice:writtenPromptDescription')}
      />
      <div className="mt-4 space-y-4">
        <MathInput
          value={latex}
          onChange={setLatex}
          placeholder={t('practice:writtenPlaceholder')}
          disabled={isDisabled}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isDisabled || latex.trim().length === 0}
            rightIcon={!isSubmitting ? <ArrowRight className="h-4 w-4 rtl:rotate-180" /> : undefined}
          >
            {t('practice:submitAnswer')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
