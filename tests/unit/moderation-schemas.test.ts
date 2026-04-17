import { describe, it, expect } from 'vitest'
import {
	createReportSchema,
	resolveReportSchema,
	suspendUserSchema,
} from '@/lib/validation/moderation'

const VALID_UUID = '00000000-0000-4000-8000-000000000000'

describe('createReportSchema', () => {
	it('accepts a valid profile report', () => {
		const result = createReportSchema.safeParse({
			targetType: 'profile',
			targetId: VALID_UUID,
			category: 'spam',
			reason: 'This account is posting repeated spam.',
		})
		expect(result.success).toBe(true)
	})

	it('accepts a valid booking report', () => {
		const result = createReportSchema.safeParse({
			targetType: 'booking',
			targetId: VALID_UUID,
			category: 'fraud',
			reason: 'The creator disappeared after payment.',
		})
		expect(result.success).toBe(true)
	})

	it('rejects reason shorter than 10 chars', () => {
		const result = createReportSchema.safeParse({
			targetType: 'profile',
			targetId: VALID_UUID,
			category: 'spam',
			reason: 'too short',
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid category', () => {
		const result = createReportSchema.safeParse({
			targetType: 'profile',
			targetId: VALID_UUID,
			category: 'bogus',
			reason: 'A valid description here.',
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid target type', () => {
		const result = createReportSchema.safeParse({
			targetType: 'service',
			targetId: VALID_UUID,
			category: 'spam',
			reason: 'A valid description here.',
		})
		expect(result.success).toBe(false)
	})

	it('rejects non-UUID target id', () => {
		const result = createReportSchema.safeParse({
			targetType: 'profile',
			targetId: 'not-a-uuid',
			category: 'spam',
			reason: 'A valid description here.',
		})
		expect(result.success).toBe(false)
	})

	it('rejects reason over 2000 chars', () => {
		const result = createReportSchema.safeParse({
			targetType: 'profile',
			targetId: VALID_UUID,
			category: 'other',
			reason: 'a'.repeat(2001),
		})
		expect(result.success).toBe(false)
	})
})

describe('resolveReportSchema', () => {
	it('accepts resolving with note', () => {
		const result = resolveReportSchema.safeParse({
			status: 'resolved',
			adminNote: 'Warned the creator.',
		})
		expect(result.success).toBe(true)
	})

	it('accepts dismissing without note', () => {
		const result = resolveReportSchema.safeParse({ status: 'dismissed' })
		expect(result.success).toBe(true)
	})

	it('accepts marking as reviewing', () => {
		const result = resolveReportSchema.safeParse({ status: 'reviewing' })
		expect(result.success).toBe(true)
	})

	it('rejects pending as a resolution', () => {
		const result = resolveReportSchema.safeParse({ status: 'pending' })
		expect(result.success).toBe(false)
	})

	it('rejects admin note longer than 2000 chars', () => {
		const result = resolveReportSchema.safeParse({
			status: 'resolved',
			adminNote: 'a'.repeat(2001),
		})
		expect(result.success).toBe(false)
	})
})

describe('suspendUserSchema', () => {
	it('accepts a normal reason', () => {
		const result = suspendUserSchema.safeParse({
			reason: 'Repeated policy violations.',
		})
		expect(result.success).toBe(true)
	})

	it('rejects reason shorter than 5 chars', () => {
		const result = suspendUserSchema.safeParse({ reason: 'abc' })
		expect(result.success).toBe(false)
	})

	it('rejects reason longer than 2000 chars', () => {
		const result = suspendUserSchema.safeParse({
			reason: 'a'.repeat(2001),
		})
		expect(result.success).toBe(false)
	})
})
