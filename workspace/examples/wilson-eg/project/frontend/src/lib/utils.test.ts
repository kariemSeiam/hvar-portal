import { describe, it, expect, vi } from 'vitest'
import {
  cn,
  formatPrice,
  formatNumber,
  formatDate,
  slugify,
  truncate,
  getDiscountPercentage,
  debounce,
  validatePhone,
  validateEmail,
  generateOrderId,
} from '@/lib/utils'

describe('cn (className merge utility)', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included')
  })

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6')
  })
})

describe('formatPrice', () => {
  it('formats price with Arabic locale', () => {
    const result = formatPrice(1000)
    // Arabic locale uses Arabic numerals and RTL markers
    expect(result).toContain('ج.م')
    expect(result).toMatch(/[\u0660-\u0669]/) // Contains Arabic numerals
  })

  it('handles zero', () => {
    const result = formatPrice(0)
    expect(result).toContain('ج.م')
  })

  it('handles large numbers', () => {
    const result = formatPrice(1000000)
    expect(result).toContain('ج.م')
  })
})

describe('formatNumber', () => {
  it('formats numbers with Arabic locale', () => {
    const result = formatNumber(1000)
    // Arabic locale uses Arabic numerals
    expect(result).toMatch(/[\u0660-\u0669]/) // Contains Arabic numerals
  })

  it('handles zero', () => {
    const result = formatNumber(0)
    expect(result).toMatch(/[\u0660-\u0669]/)
  })
})

describe('slugify', () => {
  it('converts text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world')
  })

  it('handles multiple spaces', () => {
    expect(slugify('Hello    World')).toBe('hello-world')
  })
})

describe('truncate', () => {
  it('truncates long text', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
  })

  it('keeps short text unchanged', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })
})

describe('getDiscountPercentage', () => {
  it('calculates discount percentage', () => {
    expect(getDiscountPercentage(100, 80)).toBe(20)
  })

  it('handles zero original price', () => {
    expect(getDiscountPercentage(0, 50)).toBe(0)
  })

  it('rounds to integer', () => {
    expect(getDiscountPercentage(100, 75)).toBe(25)
  })
})

describe('validatePhone', () => {
  it('validates Egyptian phone numbers', () => {
    expect(validatePhone('01012345678')).toBe(true)
    expect(validatePhone('+201012345678')).toBe(true)
    expect(validatePhone('01234567890')).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    expect(validatePhone('12345678')).toBe(false)
    expect(validatePhone('invalid')).toBe(false)
  })
})

describe('validateEmail', () => {
  it('validates email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.org')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('no@domain')).toBe(false)
  })
})

describe('formatDate', () => {
  it('formats date with locale', () => {
    const date = '2025-02-15'
    expect(formatDate(date, 'en-US')).toContain('February')
    expect(formatDate(date, 'ar-EG')).toBeTruthy()
  })

  it('handles Date object', () => {
    const date = new Date('2025-02-15')
    expect(formatDate(date)).toBeTruthy()
  })
})

describe('debounce', () => {
  it('delays execution', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('cancels previous call on rapid invocations', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced()
    debounced()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

describe('generateOrderId', () => {
  it('generates order ID with WIL prefix', () => {
    const orderId = generateOrderId()
    expect(orderId).toMatch(/^WIL-/)
  })

  it('generates unique IDs', () => {
    const id1 = generateOrderId()
    const id2 = generateOrderId()
    expect(id1).not.toBe(id2)
  })
})
