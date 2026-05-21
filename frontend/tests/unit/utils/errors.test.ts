import { describe, it, expect, vi } from 'vitest'
import {
  ApiError,
  NetworkError,
  TimeoutError,
  isApiError,
  getErrorMessage,
  safeAsync,
  withRetry
} from '@/utils/errors'

describe('ApiError class', () => {
  it('correctly sets up properties from constructor', () => {
    const details = { email: ['Invalid email format'] }
    const error = new ApiError('Something went wrong', 422, 'VALIDATION_FAILED', details)

    expect(error.message).toBe('Something went wrong')
    expect(error.status).toBe(422)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.details).toEqual(details)
    expect(error.name).toBe('ApiError')
  })

  it('correctly maps status validation helpers', () => {
    const notFound = new ApiError('Not Found', 404)
    expect(notFound.isNotFound()).toBe(true)
    expect(notFound.isValidationError()).toBe(false)

    const unauth = new ApiError('Unauthorized', 401)
    expect(unauth.isUnauthorized()).toBe(true)

    const forbidden = new ApiError('Forbidden', 403)
    expect(forbidden.isForbidden()).toBe(true)

    const badRequest = new ApiError('Bad Request', 400)
    expect(badRequest.isValidationError()).toBe(true)

    const valError = new ApiError('Validation Error', 422)
    expect(valError.isValidationError()).toBe(true)

    const serverError = new ApiError('Server Crash', 503)
    expect(serverError.isServerError()).toBe(true)
    expect(serverError.isValidationError()).toBe(false)

    const netError = new NetworkError()
    expect(netError.isNetworkError()).toBe(true)
  })

  it('generates an ApiError from a valid JSON fetch Response', async () => {
    const mockJson = {
      message: 'Email already exists',
      code: 'EMAIL_TAKEN',
      errors: { email: ['Must be unique'] }
    }
    const mockResponse = {
      status: 409,
      statusText: 'Conflict',
      json: async () => mockJson,
    } as unknown as Response

    const apiError = await ApiError.fromResponse(mockResponse)
    expect(apiError.status).toBe(409)
    expect(apiError.message).toBe('Email already exists')
    expect(apiError.code).toBe('EMAIL_TAKEN')
    expect(apiError.details).toEqual({ email: ['Must be unique'] })
  })

  it('generates an ApiError fallback when response is not JSON', async () => {
    const mockResponse = {
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new Error('Not JSON')
      },
    } as unknown as Response

    const apiError = await ApiError.fromResponse(mockResponse)
    expect(apiError.status).toBe(502)
    expect(apiError.message).toBe('Bad Gateway')
    expect(apiError.code).toBe('UNKNOWN_ERROR')
  })
})

describe('Specialized Errors', () => {
  it('instantiates NetworkError with appropriate defaults', () => {
    const error = new NetworkError()
    expect(error.status).toBe(0)
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.message).toContain('check your internet connection')
  })

  it('instantiates TimeoutError with the specified duration', () => {
    const error = new TimeoutError(5000)
    expect(error.status).toBe(0)
    expect(error.code).toBe('TIMEOUT_ERROR')
    expect(error.message).toContain('Request timed out after 5000ms')
  })
})

describe('Error Type Guards and Message Helpers', () => {
  it('correctly runs isApiError type checks', () => {
    const apiError = new ApiError('Error', 400)
    const normalError = new Error('Generic')
    
    expect(isApiError(apiError)).toBe(true)
    expect(isApiError(new NetworkError())).toBe(true)
    expect(isApiError(normalError)).toBe(false)
    expect(isApiError('string error')).toBe(false)
    expect(isApiError(null)).toBe(false)
  })

  it('retrieves user-friendly error messages', () => {
    const apiError = new ApiError('Api Error Msg', 400)
    const errorObj = new Error('Generic Error Msg')
    
    expect(getErrorMessage(apiError)).toBe('Api Error Msg')
    expect(getErrorMessage(errorObj)).toBe('Generic Error Msg')
    expect(getErrorMessage('Raw string error')).toBe('Raw string error')
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.')
  })
})

describe('safeAsync wrapper', () => {
  it('returns data and null when the promise resolves', async () => {
    const promise = Promise.resolve('Success data')
    const [data, error] = await safeAsync(promise)
    
    expect(data).toBe('Success data')
    expect(error).toBeNull()
  })

  it('returns null and an Error object when the promise rejects with Error', async () => {
    const originalError = new Error('Database crash')
    const promise = Promise.reject(originalError)
    const [data, error] = await safeAsync(promise)
    
    expect(data).toBeNull()
    expect(error).toBe(originalError)
  })

  it('returns null and coerced Error when the promise rejects with string', async () => {
    const promise = Promise.reject('Rejected message')
    const [data, error] = await safeAsync(promise)
    
    expect(data).toBeNull()
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('Rejected message')
  })
})

describe('withRetry logic', () => {
  it('succeeds immediately on first attempt without retries', async () => {
    const callback = vi.fn().mockResolvedValue('Fast Result')
    
    const result = await withRetry(callback)
    
    expect(result).toBe('Fast Result')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('retries on network or server errors and succeeds', async () => {
    const serverErr = new ApiError('Temporary Server Breakdown', 503)
    const callback = vi.fn()
      .mockRejectedValueOnce(serverErr)
      .mockResolvedValueOnce('Succeeded after retry')

    const result = await withRetry(callback, { delay: 1 })
    
    expect(result).toBe('Succeeded after retry')
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('stops retrying if the error is not retryable (e.g. 400 Validation Error)', async () => {
    const validationErr = new ApiError('Validation failed', 400)
    const callback = vi.fn().mockRejectedValue(validationErr)

    await expect(withRetry(callback, { delay: 1 })).rejects.toThrow('Validation failed')
    expect(callback).toHaveBeenCalledTimes(1) // Should abort immediately
  })

  it('fails repeatedly and throws after reaching maxAttempts', async () => {
    const serverErr = new ApiError('DB connection loss', 500)
    const callback = vi.fn().mockRejectedValue(serverErr)

    await expect(withRetry(callback, { maxAttempts: 3, delay: 1 })).rejects.toThrow('DB connection loss')
    expect(callback).toHaveBeenCalledTimes(3)
  })
})
