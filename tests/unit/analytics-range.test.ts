import { describe, expect, it } from 'vitest'

import { resolveAnalyticsRange, trendDelta } from '@/lib/analytics/range'

describe('resolveAnalyticsRange', () => {
	const now = new Date('2026-04-18T13:30:45.123Z')

	it('rounds end to the next minute boundary', () => {
		const { end } = resolveAnalyticsRange('this_week', now)
		expect(end.toISOString()).toBe('2026-04-18T13:31:00.000Z')
	})

	it('this_week spans 7 days back from end', () => {
		const { start, end, bucket } = resolveAnalyticsRange('this_week', now)
		expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
		expect(bucket).toBe('day')
	})

	it('this_month starts at the first of the month at 00:00 UTC', () => {
		const { start, bucket } = resolveAnalyticsRange('this_month', now)
		expect(start.toISOString()).toBe('2026-04-01T00:00:00.000Z')
		expect(bucket).toBe('day')
	})

	it('this_quarter rounds down to the quarter start month', () => {
		const { start, bucket } = resolveAnalyticsRange('this_quarter', now)
		expect(start.toISOString()).toBe('2026-04-01T00:00:00.000Z')
		expect(bucket).toBe('week')

		const q1Now = new Date('2026-02-15T00:00:00.000Z')
		const q1 = resolveAnalyticsRange('this_quarter', q1Now)
		expect(q1.start.toISOString()).toBe('2026-01-01T00:00:00.000Z')
	})

	it('this_year starts at Jan 1 at 00:00 UTC', () => {
		const { start, bucket } = resolveAnalyticsRange('this_year', now)
		expect(start.toISOString()).toBe('2026-01-01T00:00:00.000Z')
		expect(bucket).toBe('month')
	})

	it('last_30_days spans 30 * 24h back from end', () => {
		const { start, end, bucket } = resolveAnalyticsRange('last_30_days', now)
		expect(end.getTime() - start.getTime()).toBe(30 * 24 * 60 * 60 * 1000)
		expect(bucket).toBe('day')
	})

	it('last_90_days uses week buckets', () => {
		const { bucket } = resolveAnalyticsRange('last_90_days', now)
		expect(bucket).toBe('week')
	})

	it('last_12_months uses month buckets', () => {
		const { start, bucket } = resolveAnalyticsRange('last_12_months', now)
		expect(start.getUTCFullYear()).toBe(2025)
		expect(start.getUTCMonth()).toBe(3)
		expect(bucket).toBe('month')
	})

	it('start is strictly before end for every range key', () => {
		const keys = [
			'this_week',
			'this_month',
			'this_quarter',
			'this_year',
			'last_30_days',
			'last_90_days',
			'last_12_months',
		] as const
		for (const key of keys) {
			const { start, end } = resolveAnalyticsRange(key, now)
			expect(start.getTime()).toBeLessThan(end.getTime())
		}
	})
})

describe('trendDelta', () => {
	it('returns null when previous is zero and current is positive', () => {
		expect(trendDelta(100, 0)).toBeNull()
	})

	it('returns flat 0% when both are zero', () => {
		expect(trendDelta(0, 0)).toEqual({ pct: 0, direction: 'flat' })
	})

	it('computes positive delta for growth', () => {
		const result = trendDelta(150, 100)
		expect(result).not.toBeNull()
		expect(result!.direction).toBe('up')
		expect(result!.pct).toBeCloseTo(50, 5)
	})

	it('computes negative delta for decline', () => {
		const result = trendDelta(80, 100)
		expect(result).not.toBeNull()
		expect(result!.direction).toBe('down')
		expect(result!.pct).toBeCloseTo(-20, 5)
	})

	it('returns flat when current equals previous', () => {
		expect(trendDelta(50, 50)).toEqual({ pct: 0, direction: 'flat' })
	})

	it('handles negative previous values without crashing', () => {
		const result = trendDelta(-50, -100)
		expect(result).not.toBeNull()
		expect(result!.direction).toBe('down')
		expect(result!.pct).toBeCloseTo(-50, 5)
	})
})
