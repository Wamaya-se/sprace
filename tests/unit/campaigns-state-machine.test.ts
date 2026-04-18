import { describe, expect, it } from 'vitest'

import {
	canApply,
	canPublish,
	canTransitionApplication,
	canTransitionCampaign,
	shouldAutoComplete,
} from '@/lib/campaigns/state-machine'

describe('canTransitionCampaign', () => {
	it('allows draft → open', () => {
		expect(canTransitionCampaign('draft', 'open')).toEqual({ ok: true })
	})

	it('allows open → closed and open → cancelled', () => {
		expect(canTransitionCampaign('open', 'closed')).toEqual({ ok: true })
		expect(canTransitionCampaign('open', 'cancelled')).toEqual({ ok: true })
	})

	it('allows closed → completed', () => {
		expect(canTransitionCampaign('closed', 'completed')).toEqual({ ok: true })
	})

	it('rejects jumping draft → completed', () => {
		expect(canTransitionCampaign('draft', 'completed')).toEqual({
			ok: false,
			reason: 'invalidTransition',
		})
	})

	it('rejects transitions from terminal states', () => {
		expect(canTransitionCampaign('completed', 'cancelled')).toEqual({
			ok: false,
			reason: 'invalidTransition',
		})
		expect(canTransitionCampaign('cancelled', 'open')).toEqual({
			ok: false,
			reason: 'invalidTransition',
		})
	})
})

describe('canTransitionApplication', () => {
	it('business can accept a pending application', () => {
		expect(canTransitionApplication('pending', 'accepted', 'business')).toEqual(
			{ ok: true },
		)
	})

	it('business can shortlist a pending application', () => {
		expect(
			canTransitionApplication('pending', 'shortlisted', 'business'),
		).toEqual({ ok: true })
	})

	it('business cannot withdraw an application', () => {
		expect(
			canTransitionApplication('pending', 'withdrawn', 'business'),
		).toEqual({ ok: false, reason: 'notAllowedForRole' })
	})

	it('creator can withdraw a pending application', () => {
		expect(canTransitionApplication('pending', 'withdrawn', 'creator')).toEqual(
			{ ok: true },
		)
	})

	it('creator cannot accept their own application', () => {
		expect(canTransitionApplication('pending', 'accepted', 'creator')).toEqual({
			ok: false,
			reason: 'notAllowedForRole',
		})
	})

	it('no transitions from accepted/declined/withdrawn', () => {
		expect(
			canTransitionApplication('accepted', 'declined', 'business'),
		).toEqual({ ok: false, reason: 'invalidTransition' })
		expect(
			canTransitionApplication('declined', 'accepted', 'business'),
		).toEqual({ ok: false, reason: 'invalidTransition' })
		expect(canTransitionApplication('withdrawn', 'pending', 'creator')).toEqual(
			{ ok: false, reason: 'invalidTransition' },
		)
	})
})

describe('canApply', () => {
	it('allows first application on an open campaign', () => {
		expect(canApply('open', null)).toBe(true)
	})

	it('rejects applying to a draft/closed/cancelled/completed campaign', () => {
		expect(canApply('draft', null)).toBe(false)
		expect(canApply('closed', null)).toBe(false)
		expect(canApply('cancelled', null)).toBe(false)
		expect(canApply('completed', null)).toBe(false)
	})

	it('rejects re-applying when an application already exists', () => {
		expect(canApply('open', 'pending')).toBe(false)
		expect(canApply('open', 'shortlisted')).toBe(false)
		expect(canApply('open', 'accepted')).toBe(false)
		expect(canApply('open', 'declined')).toBe(false)
	})

	it('allows re-applying after a withdrawn application', () => {
		expect(canApply('open', 'withdrawn')).toBe(true)
	})
})

describe('canPublish', () => {
	it('only allows publishing from draft', () => {
		expect(canPublish('draft')).toBe(true)
		expect(canPublish('open')).toBe(false)
		expect(canPublish('closed')).toBe(false)
		expect(canPublish('completed')).toBe(false)
		expect(canPublish('cancelled')).toBe(false)
	})
})

describe('shouldAutoComplete', () => {
	it('returns false when there are no bookings', () => {
		expect(shouldAutoComplete([])).toBe(false)
	})

	it('returns false when no non-cancelled bookings remain', () => {
		expect(shouldAutoComplete(['cancelled', 'cancelled'])).toBe(false)
		expect(shouldAutoComplete(['declined'])).toBe(false)
	})

	it('returns false when some non-cancelled are not completed', () => {
		expect(shouldAutoComplete(['completed', 'in_progress'])).toBe(false)
		expect(shouldAutoComplete(['awaiting_payment'])).toBe(false)
	})

	it('returns true when all non-cancelled are completed', () => {
		expect(shouldAutoComplete(['completed'])).toBe(true)
		expect(shouldAutoComplete(['completed', 'completed', 'cancelled'])).toBe(
			true,
		)
	})
})
