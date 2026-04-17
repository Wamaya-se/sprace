import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodFieldError } from '@/lib/validation/common'

describe('zodFieldError', () => {
	const schema = z.object({
		email: z.string().email(),
		age: z.number().min(18),
	})

	it('returns success:false with default fallback', () => {
		const parsed = schema.safeParse({ email: 'x', age: 10 })
		if (parsed.success) throw new Error('expected failure')
		const result = zodFieldError(parsed.error)
		expect(result.success).toBe(false)
		if (result.success) return
		expect(result.error).toBe('errors.invalidInput')
	})

	it('extracts the first field path', () => {
		const parsed = schema.safeParse({ email: 'x', age: 10 })
		if (parsed.success) throw new Error('expected failure')
		const result = zodFieldError(parsed.error)
		if (result.success) return
		expect(result.field).toBe('email')
	})

	it('accepts a custom fallback key', () => {
		const parsed = schema.safeParse({ email: 'x', age: 10 })
		if (parsed.success) throw new Error('expected failure')
		const result = zodFieldError(parsed.error, 'errors.registrationFailed')
		if (result.success) return
		expect(result.error).toBe('errors.registrationFailed')
	})
})
