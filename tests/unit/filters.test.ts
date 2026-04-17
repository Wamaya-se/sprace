import { describe, expect, it } from 'vitest'
import { assertUuid, participantOrFilter } from '@/lib/db/filters'

describe('assertUuid', () => {
	it('returns the value for a valid UUID', () => {
		const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
		expect(assertUuid(id)).toBe(id)
	})

	it('throws for non-UUID strings', () => {
		expect(() => assertUuid('not-a-uuid')).toThrow()
		expect(() => assertUuid('')).toThrow()
		expect(() => assertUuid('1 OR 1=1')).toThrow()
	})
})

describe('participantOrFilter', () => {
	it('builds the expected filter string', () => {
		const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
		expect(participantOrFilter(id)).toBe(
			`participant_one.eq.${id},participant_two.eq.${id}`,
		)
	})

	it('rejects injected values', () => {
		expect(() => participantOrFilter('x,participant_one.eq.*')).toThrow()
	})
})
