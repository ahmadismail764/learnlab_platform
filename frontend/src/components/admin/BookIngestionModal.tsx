import { useMemo, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, FileText, Upload, X } from 'lucide-react'
import { Button, Card, CardHeader, Input } from '@/components/ui'
import { bookIngestionService } from '@/services/bookIngestion'

interface BookIngestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function BookIngestionModal({
  isOpen,
  onClose,
  onSuccess,
}: BookIngestionModalProps) {
  const { t } = useTranslation(['admin', 'common'])

  const [file, setFile] = useState<File | null>(null)
  const [numQuestions, setNumQuestions] = useState('')
  const [error, setError] = useState('')

  const selectedFileLabel = useMemo(() => {
    if (!file) return t('admin:questions.ingestion.noFileSelected')
    const sizeMb = file.size / 1024 / 1024
    return `${file.name} (${sizeMb.toFixed(1)} MB)`
  }, [file, t])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error(t('admin:questions.ingestion.fileRequired'))
      }

      const parsedLimit = numQuestions.trim() ? Number(numQuestions) : null
      if (parsedLimit !== null && (!Number.isInteger(parsedLimit) || parsedLimit < 1)) {
        throw new Error(t('admin:questions.ingestion.limitInvalid'))
      }

      return bookIngestionService.extractQuestionsFromPdf({
        file,
        numQuestions: parsedLimit,
      })
    },
    onSuccess: async (result) => {
      onSuccess(result.message)
      setFile(null)
      setNumQuestions('')
      setError('')
      onClose()
    },
    onError: (err) => {
      setError(getErrorMessage(err, t('admin:questions.ingestion.error')))
    },
  })

  const isUploading = mutation.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    mutation.mutate()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isUploading) onClose()
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="scrollbar-styled z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-start justify-between border-b border-neutral-200 p-6 dark:border-neutral-700">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {t('admin:questions.ingestion.title')}
                  </h2>
                  <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                    {t('admin:questions.ingestion.subtitle')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={onClose}
                  className="p-1"
                  aria-label={t('common:close')}
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t('admin:questions.ingestion.fileLabel')}
                  </label>
                  <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/50 dark:border-neutral-700 dark:bg-neutral-900/60 dark:hover:bg-primary-950/20">
                    <Upload className="h-8 w-8 text-primary-500" />
                    <span className="mt-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {selectedFileLabel}
                    </span>
                    <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {t('admin:questions.ingestion.fileHint')}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      disabled={isUploading}
                      onChange={(event) => {
                        setFile(event.target.files?.[0] ?? null)
                        setError('')
                      }}
                    />
                  </label>
                </div>

                <Input
                  label={t('admin:questions.ingestion.limitLabel')}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={numQuestions}
                  disabled={isUploading}
                  onChange={(event) => {
                    setNumQuestions(event.target.value)
                    setError('')
                  }}
                  leftIcon={<FileText className="h-4 w-4" />}
                  helperText={t('admin:questions.ingestion.limitHint')}
                />

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <Button type="button" variant="ghost" disabled={isUploading} onClick={onClose}>
                    {t('common:cancel')}
                  </Button>
                  <Button type="submit" isLoading={isUploading} leftIcon={!isUploading ? <Upload className="h-4 w-4" /> : undefined}>
                    {t('admin:questions.ingestion.submit')}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
