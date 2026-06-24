import { describe, expect, it, vi, beforeEach } from 'vitest'
import { bookIngestionService } from '@/services/bookIngestion'
import { api, throwApiError } from '@/services/api'

vi.mock('@/services/api', () => ({
  api: {
    postForm: vi.fn(),
  },
  throwApiError: vi.fn(async () => {
    throw new Error('backend extraction failed')
  }),
}))

describe('bookIngestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits the PDF and optional question limit as multipart form data', async () => {
    const file = new File(['%PDF-1.4'], 'discrete-math.pdf', {
      type: 'application/pdf',
    })

    vi.mocked(api.postForm).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Extraction successful', extracted_count: 3 }),
    } as Response)

    const result = await bookIngestionService.extractQuestionsFromPdf({
      file,
      numQuestions: 3,
    })

    expect(api.postForm).toHaveBeenCalledWith('/extract-questions/', expect.any(FormData))
    const formData = vi.mocked(api.postForm).mock.calls[0][1]
    expect(formData.get('pdf_file')).toBe(file)
    expect(formData.get('num_questions')).toBe('3')
    expect(result.extracted_count).toBe(3)
  })

  it('surfaces backend extraction failures', async () => {
    const file = new File(['%PDF-1.4'], 'broken.pdf', {
      type: 'application/pdf',
    })
    const response = { ok: false, status: 500 } as Response

    vi.mocked(api.postForm).mockResolvedValueOnce(response)

    await expect(
      bookIngestionService.extractQuestionsFromPdf({ file }),
    ).rejects.toThrow('backend extraction failed')

    expect(throwApiError).toHaveBeenCalledWith(
      response,
      'Failed to extract questions from the book',
    )
  })
})
