import { describe, it, expect } from 'vitest'
import { cn } from '@/utils/cn'

describe('cn utility', () => {
  it('merges class names together', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('handles conditionally falsy and truthy arguments', () => {
    const includeSecond: boolean = false
    const includeThird: boolean = true

    expect(cn('class1', includeSecond && 'class2', 'class3', null, undefined, '')).toBe('class1 class3')
    expect(cn('class1', includeThird && 'class2')).toBe('class1 class2')
  })

  it('handles object structures correctly', () => {
    expect(cn({
      'bg-red-500': true,
      'text-white': false,
      'p-4': true,
    })).toBe('bg-red-500 p-4')
  })

  it('handles nested arrays and mixed parameters', () => {
    const includeNestedClass: boolean = false

    expect(cn(['class1', 'class2'], ['class3', includeNestedClass && 'class4'], 'class5')).toBe('class1 class2 class3 class5')
  })

  it('resolves Tailwind CSS conflicts correctly (last one wins)', () => {
    // Conflict on padding-x
    expect(cn('px-4', 'px-8')).toBe('px-8')

    // Conflict on layout and background
    expect(cn('bg-red-500 text-sm p-2', 'bg-blue-600 p-4')).toBe('text-sm bg-blue-600 p-4')
  })
})
