import { describe, it, expect } from 'vitest'
import { calculateFees } from '@/lib/fees'

describe('calculateFees', () => {
	it('splits a whole amount into fee + payout that sum back exactly', () => {
		const r = calculateFees(100_00, 15)
		expect(r.amountTotal).toBe(100_00)
		expect(r.platformFee + r.creatorPayout).toBe(r.amountTotal)
		expect(r.platformFee).toBe(15_00)
		expect(r.creatorPayout).toBe(85_00)
	})

	it('rounds the fee (no fractional cents) and preserves total integrity', () => {
		const r = calculateFees(33_33, 15)
		expect(r.platformFee + r.creatorPayout).toBe(r.amountTotal)
		expect(Number.isInteger(r.platformFee)).toBe(true)
		expect(Number.isInteger(r.creatorPayout)).toBe(true)
	})

	it('handles 0% fee (payout equals amount)', () => {
		const r = calculateFees(50_00, 0)
		expect(r.platformFee).toBe(0)
		expect(r.creatorPayout).toBe(50_00)
	})

	it('handles 100% fee (payout is zero)', () => {
		const r = calculateFees(50_00, 100)
		expect(r.platformFee).toBe(50_00)
		expect(r.creatorPayout).toBe(0)
	})

	it('works with an amount of zero', () => {
		const r = calculateFees(0, 15)
		expect(r.platformFee).toBe(0)
		expect(r.creatorPayout).toBe(0)
	})
})
