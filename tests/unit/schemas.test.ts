import { describe, it, expect } from 'vitest'
import {
	createBookingSchema,
	bookingStatusSchema,
	createReviewSchema,
	openDisputeSchema,
	uuidSchema,
} from '@/lib/validation/schemas'

const VALID_UUID = '00000000-0000-4000-8000-000000000000'

describe('createBookingSchema', () => {
	it('accepts a minimal valid brief', () => {
		const result = createBookingSchema.safeParse({
			creatorId: VALID_UUID,
			title: 'Short brief',
			description: 'This is the body.',
		})
		expect(result.success).toBe(true)
	})

	it('rejects missing title', () => {
		const result = createBookingSchema.safeParse({
			creatorId: VALID_UUID,
			description: 'body',
		})
		expect(result.success).toBe(false)
	})

	it('rejects non-UUID creatorId', () => {
		const result = createBookingSchema.safeParse({
			creatorId: 'not-a-uuid',
			title: 'x',
			description: 'y',
		})
		expect(result.success).toBe(false)
	})

	it('coerces budget from string', () => {
		const result = createBookingSchema.safeParse({
			creatorId: VALID_UUID,
			title: 'a',
			description: 'b',
			budget: '500',
		})
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.budget).toBe(500)
	})

	it('rejects negative budget', () => {
		const result = createBookingSchema.safeParse({
			creatorId: VALID_UUID,
			title: 'a',
			description: 'b',
			budget: -10,
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid deadline string', () => {
		const result = createBookingSchema.safeParse({
			creatorId: VALID_UUID,
			title: 'a',
			description: 'b',
			deadline: '31-12-2026',
		})
		expect(result.success).toBe(false)
	})

	it('caps description length at 5000', () => {
		const longDescription = 'a'.repeat(5001)
		const result = createBookingSchema.safeParse({
			creatorId: VALID_UUID,
			title: 'a',
			description: longDescription,
		})
		expect(result.success).toBe(false)
	})
})

describe('bookingStatusSchema', () => {
	it('accepts known statuses', () => {
		for (const s of [
			'pending',
			'awaiting_payment',
			'accepted',
			'in_progress',
			'delivered',
			'completed',
			'declined',
			'cancelled',
			'disputed',
		]) {
			expect(bookingStatusSchema.safeParse(s).success).toBe(true)
		}
	})

	it('rejects unknown status', () => {
		expect(bookingStatusSchema.safeParse('shipped').success).toBe(false)
	})
})

describe('createReviewSchema', () => {
	it('coerces rating from string', () => {
		const result = createReviewSchema.safeParse({
			bookingId: VALID_UUID,
			rating: '4',
		})
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.rating).toBe(4)
	})

	it('rejects rating > 5', () => {
		const result = createReviewSchema.safeParse({
			bookingId: VALID_UUID,
			rating: 6,
		})
		expect(result.success).toBe(false)
	})

	it('rejects rating < 1', () => {
		const result = createReviewSchema.safeParse({
			bookingId: VALID_UUID,
			rating: 0,
		})
		expect(result.success).toBe(false)
	})
})

describe('openDisputeSchema', () => {
	it('requires reason >= 10 chars', () => {
		expect(
			openDisputeSchema.safeParse({
				bookingId: VALID_UUID,
				reason: 'too short',
			}).success,
		).toBe(false)
		expect(
			openDisputeSchema.safeParse({
				bookingId: VALID_UUID,
				reason: 'This is a long enough reason.',
			}).success,
		).toBe(true)
	})
})

describe('uuidSchema', () => {
	it('accepts v4 UUID', () => {
		expect(uuidSchema.safeParse(VALID_UUID).success).toBe(true)
	})

	it('rejects arbitrary string', () => {
		expect(uuidSchema.safeParse('abc').success).toBe(false)
	})
})
