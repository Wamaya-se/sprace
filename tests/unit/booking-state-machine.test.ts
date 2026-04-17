import { describe, it, expect } from 'vitest'
import {
	canTransition,
	statusTransitions,
	roleAllowedTransitions,
} from '@/lib/bookings/state-machine'

describe('booking state machine', () => {
	describe('canTransition (happy paths)', () => {
		it('allows creator to move pending → awaiting_payment', () => {
			expect(canTransition('pending', 'awaiting_payment', 'creator')).toEqual({
				ok: true,
			})
		})

		it('allows business to move accepted → in_progress', () => {
			expect(canTransition('accepted', 'in_progress', 'business')).toEqual({
				ok: true,
			})
		})

		it('allows creator to move in_progress → delivered', () => {
			expect(canTransition('in_progress', 'delivered', 'creator')).toEqual({
				ok: true,
			})
		})

		it('allows business to move delivered → completed', () => {
			expect(canTransition('delivered', 'completed', 'business')).toEqual({
				ok: true,
			})
		})
	})

	describe('canTransition (invalid transitions)', () => {
		it('rejects pending → completed', () => {
			const result = canTransition('pending', 'completed', 'business')
			expect(result).toEqual({ ok: false, reason: 'invalidTransition' })
		})

		it('rejects completed → anything', () => {
			expect(canTransition('completed', 'in_progress', 'business').ok).toBe(
				false,
			)
			expect(canTransition('completed', 'cancelled', 'business').ok).toBe(false)
		})

		it('rejects cancelled → pending', () => {
			expect(canTransition('cancelled', 'pending', 'business').ok).toBe(false)
		})

		it('rejects disputed → anything (manual admin resolve only)', () => {
			expect(canTransition('disputed', 'completed', 'business').ok).toBe(false)
			expect(canTransition('disputed', 'cancelled', 'creator').ok).toBe(false)
		})
	})

	describe('canTransition (role restrictions)', () => {
		it('rejects business moving pending → awaiting_payment (creator-only)', () => {
			const result = canTransition('pending', 'awaiting_payment', 'business')
			expect(result).toEqual({ ok: false, reason: 'notAllowedForRole' })
		})

		it('rejects business moving pending → declined (creator-only)', () => {
			expect(canTransition('pending', 'declined', 'business').ok).toBe(false)
		})

		it('rejects creator moving delivered → completed (business-only)', () => {
			expect(canTransition('delivered', 'completed', 'creator').ok).toBe(false)
		})

		it('rejects creator moving accepted → in_progress only if role disallows', () => {
			expect(canTransition('accepted', 'in_progress', 'creator').ok).toBe(true)
		})
	})

	describe('state machine integrity', () => {
		it('all terminal statuses have no outgoing transitions', () => {
			const terminal = [
				'completed',
				'declined',
				'cancelled',
				'disputed',
			] as const
			for (const s of terminal) {
				expect(statusTransitions[s].allowedNext).toHaveLength(0)
			}
		})

		it('every allowed next status is permitted for at least one role', () => {
			for (const [, config] of Object.entries(statusTransitions)) {
				for (const nextStatus of config.allowedNext) {
					const allowed =
						roleAllowedTransitions.business[nextStatus] ||
						roleAllowedTransitions.creator[nextStatus]
					expect(allowed, `no role can transition to ${nextStatus}`).toBe(true)
				}
			}
		})
	})
})
