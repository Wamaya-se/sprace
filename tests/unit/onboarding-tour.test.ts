import { describe, expect, it } from 'vitest'

import {
	clampStepIndex,
	getTourSteps,
	type TourStep,
} from '@/lib/onboarding/tour-steps'
import { CURRENT_TOUR_VERSION, shouldShowTour } from '@/lib/onboarding/version'

describe('shouldShowTour', () => {
	it('returns true for a user that has never completed a tour', () => {
		expect(shouldShowTour(null)).toBe(true)
		expect(shouldShowTour(undefined)).toBe(true)
		expect(shouldShowTour('')).toBe(true)
	})

	it('returns false when the user is on the current version', () => {
		expect(shouldShowTour(CURRENT_TOUR_VERSION)).toBe(false)
	})

	it('returns true when the stored version is stale', () => {
		expect(shouldShowTour('some-old-version')).toBe(true)
	})
})

describe('clampStepIndex', () => {
	it('clamps negative indices to zero', () => {
		expect(clampStepIndex(-5, 4)).toBe(0)
	})

	it('clamps out-of-range indices to the last step', () => {
		expect(clampStepIndex(99, 4)).toBe(3)
	})

	it('passes through valid indices', () => {
		expect(clampStepIndex(2, 4)).toBe(2)
	})

	it('returns zero when there are no steps', () => {
		expect(clampStepIndex(3, 0)).toBe(0)
	})
})

describe('getTourSteps', () => {
	const roles = ['creator', 'business', 'admin'] as const

	it('returns a non-empty step list for every role', () => {
		for (const role of roles) {
			const steps = getTourSteps(role)
			expect(steps.length).toBeGreaterThanOrEqual(3)
		}
	})

	it('starts with a centered welcome step and ends with a centered finish step', () => {
		for (const role of roles) {
			const steps = getTourSteps(role)
			const first = steps[0] as TourStep
			const last = steps[steps.length - 1] as TourStep
			expect(first.placement).toBe('center')
			expect(first.id).toBe('welcome')
			expect(last.placement).toBe('center')
			expect(last.id).toBe('finished')
		}
	})

	it('keeps the same array reference between calls (stable keys)', () => {
		expect(getTourSteps('creator')).toBe(getTourSteps('creator'))
		expect(getTourSteps('business')).toBe(getTourSteps('business'))
		expect(getTourSteps('admin')).toBe(getTourSteps('admin'))
	})

	it('uses unique step ids within each role', () => {
		for (const role of roles) {
			const steps = getTourSteps(role)
			const ids = new Set(steps.map((s) => s.id))
			expect(ids.size).toBe(steps.length)
		}
	})

	it('requires a non-empty target on any non-center step', () => {
		for (const role of roles) {
			for (const step of getTourSteps(role)) {
				if (step.placement !== 'center') {
					expect(step.target).not.toBe('')
				}
			}
		}
	})

	it('references only translation keys under the tour namespace', () => {
		for (const role of roles) {
			for (const step of getTourSteps(role)) {
				expect(step.titleKey).toMatch(/^[a-zA-Z]+(\.[a-zA-Z]+)+$/)
				expect(step.descriptionKey).toMatch(/^[a-zA-Z]+(\.[a-zA-Z]+)+$/)
			}
		}
	})
})
