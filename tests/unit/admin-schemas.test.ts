import { describe, expect, it } from 'vitest'

import {
	auditLogFiltersSchema,
	createBroadcastSchema,
	sendBroadcastSchema,
} from '@/lib/validation/admin'

describe('createBroadcastSchema', () => {
	const valid = {
		title: 'Scheduled maintenance',
		body: 'Platform maintenance on Saturday 20:00–21:00 UTC. Short downtime expected.',
		audience: 'all' as const,
	}

	it('accepts a minimal valid payload', () => {
		expect(createBroadcastSchema.safeParse(valid).success).toBe(true)
	})

	it('rejects a short title', () => {
		expect(
			createBroadcastSchema.safeParse({ ...valid, title: 'hi' }).success,
		).toBe(false)
	})

	it('rejects a short body', () => {
		expect(
			createBroadcastSchema.safeParse({ ...valid, body: 'short' }).success,
		).toBe(false)
	})

	it('trims whitespace on title/body', () => {
		const parsed = createBroadcastSchema.safeParse({
			...valid,
			title: '   Welcome aboard   ',
			body: '   A longer body that is at least ten characters.   ',
		})
		expect(parsed.success).toBe(true)
		if (parsed.success) {
			expect(parsed.data.title).toBe('Welcome aboard')
			expect(parsed.data.body.startsWith('A')).toBe(true)
		}
	})

	it('coerces empty link to undefined', () => {
		const parsed = createBroadcastSchema.safeParse({
			...valid,
			link: '   ',
		})
		expect(parsed.success).toBe(true)
		if (parsed.success) {
			expect(parsed.data.link).toBeUndefined()
		}
	})

	it('rejects invalid link', () => {
		expect(
			createBroadcastSchema.safeParse({
				...valid,
				link: 'not-a-url',
			}).success,
		).toBe(false)
	})

	it('accepts creators audience', () => {
		expect(
			createBroadcastSchema.safeParse({ ...valid, audience: 'creators' })
				.success,
		).toBe(true)
	})

	it('rejects unknown audience', () => {
		expect(
			createBroadcastSchema.safeParse({
				...valid,
				audience: 'vips' as unknown as 'all',
			}).success,
		).toBe(false)
	})
})

describe('sendBroadcastSchema', () => {
	it('accepts a uuid', () => {
		expect(
			sendBroadcastSchema.safeParse({
				broadcastId: '11111111-1111-4111-8111-111111111111',
			}).success,
		).toBe(true)
	})

	it('rejects a non-uuid', () => {
		expect(sendBroadcastSchema.safeParse({ broadcastId: 'nope' }).success).toBe(
			false,
		)
	})
})

describe('auditLogFiltersSchema', () => {
	it('fills in defaults', () => {
		const parsed = auditLogFiltersSchema.parse({})
		expect(parsed.limit).toBe(50)
		expect(parsed.offset).toBe(0)
	})

	it('clamps limit at 200', () => {
		const parsed = auditLogFiltersSchema.safeParse({ limit: '500' })
		expect(parsed.success).toBe(false)
	})

	it('accepts a valid action filter', () => {
		const parsed = auditLogFiltersSchema.parse({
			action: 'user.role_changed',
		})
		expect(parsed.action).toBe('user.role_changed')
	})

	it('rejects an unknown action', () => {
		expect(
			auditLogFiltersSchema.safeParse({ action: 'nope.ever' }).success,
		).toBe(false)
	})

	it('coerces string offset to number', () => {
		const parsed = auditLogFiltersSchema.parse({ offset: '100' })
		expect(parsed.offset).toBe(100)
	})
})
