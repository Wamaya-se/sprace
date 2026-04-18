/**
 * Pure analytics helpers for date-range resolution and trend math.
 * Kept free of `server-only` so unit tests can import directly.
 */

export type BucketGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year'

export type AnalyticsRangeKey =
	| 'this_week'
	| 'this_month'
	| 'this_quarter'
	| 'this_year'
	| 'last_30_days'
	| 'last_90_days'
	| 'last_12_months'

export interface RangeWithBucket {
	start: Date
	end: Date
	bucket: BucketGranularity
}

/**
 * Convert an `AnalyticsRangeKey` into a concrete date range plus a
 * sensible default bucket granularity for charts. End is exclusive
 * (`now()` rounded up to the next minute) so the latest events are
 * included without a half-empty trailing bucket.
 */
export function resolveAnalyticsRange(
	key: AnalyticsRangeKey,
	now: Date = new Date(),
): RangeWithBucket {
	const end = new Date(now)
	end.setUTCSeconds(0, 0)
	end.setUTCMinutes(end.getUTCMinutes() + 1)

	const start = new Date(end)
	let bucket: BucketGranularity = 'day'

	switch (key) {
		case 'this_week': {
			start.setUTCDate(end.getUTCDate() - 7)
			bucket = 'day'
			break
		}
		case 'this_month': {
			start.setUTCDate(1)
			start.setUTCHours(0, 0, 0, 0)
			bucket = 'day'
			break
		}
		case 'this_quarter': {
			const qStartMonth = Math.floor(end.getUTCMonth() / 3) * 3
			start.setUTCMonth(qStartMonth, 1)
			start.setUTCHours(0, 0, 0, 0)
			bucket = 'week'
			break
		}
		case 'this_year': {
			start.setUTCMonth(0, 1)
			start.setUTCHours(0, 0, 0, 0)
			bucket = 'month'
			break
		}
		case 'last_30_days': {
			start.setUTCDate(end.getUTCDate() - 30)
			bucket = 'day'
			break
		}
		case 'last_90_days': {
			start.setUTCDate(end.getUTCDate() - 90)
			bucket = 'week'
			break
		}
		case 'last_12_months': {
			start.setUTCMonth(end.getUTCMonth() - 12)
			bucket = 'month'
			break
		}
	}

	return { start, end, bucket }
}

export interface TrendDelta {
	pct: number
	direction: 'up' | 'down' | 'flat'
}

/**
 * Compute percentage change between current and previous period.
 * Returns `null` when previous is zero (undefined trend), so callers
 * can render a "—" indicator instead of a misleading "+∞".
 */
export function trendDelta(
	current: number,
	previous: number,
): TrendDelta | null {
	if (previous === 0) {
		if (current === 0) return { pct: 0, direction: 'flat' }
		return null
	}
	const pct = ((current - previous) / previous) * 100
	const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
	return { pct, direction }
}
