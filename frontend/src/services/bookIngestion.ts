import { api, throwApiError } from './api'

export interface ExtractQuestionsFromBookPayload {
  file: File
  numQuestions?: number | null
}

export interface ExtractQuestionsFromBookResult {
  message: string
}

export const bookIngestionService = {
  extractQuestionsFromPdf: async ({
    file,
    numQuestions,
  }: ExtractQuestionsFromBookPayload): Promise<ExtractQuestionsFromBookResult> => {
    const formData = new FormData()
    formData.append('pdf_file', file)

    if (typeof numQuestions === 'number' && Number.isFinite(numQuestions)) {
      formData.append('num_questions', String(numQuestions))
    }

    const response = await api.postForm('/extract-questions/', formData)
    if (!response.ok) {
      await throwApiError(response, 'Failed to extract questions from the book')
    }

    return await response.json() as ExtractQuestionsFromBookResult
  },
}
