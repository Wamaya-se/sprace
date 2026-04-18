import 'server-only'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { BucketGranularity } from '@/lib/analytics/range'

export type {
	BucketGranularity,
	AnalyticsRangeKey,
	RangeWithBucket,
	TrendDelta,
} from '@/lib/analytics/range'
export { resolveAnalyticsRange, trendDelta } from '@/lib/analytics/range'

type Fn<K extends keyof Database['public']['Functions']> =
	Database['public']['Functions'][K]
type Row<K extends keyof Database['public']['Functions']> =
	Fn<K>['Returns'] extends Array<infer R> ? R : never

export type CreatorAnalyticsSummary = Row<'get_creator_analytics_summary'>
export type CreatorRevenuePoint = Row<'get_creator_revenue_timeseries'>
export type CreatorBookingsByStatusRow = Row<'get_creator_bookings_by_status'>

export type BusinessAnalyticsSummary = Row<'get_business_analytics_summary'>
export type BusinessSpendingPoint = Row<'get_business_spending_timeseries'>
export type BusinessTopCreatorRow = Row<'get_business_top_creators'>

export type AdminAnalyticsSummary = Row<'get_admin_analytics_summary'>
export type AdminRevenuePoint = Row<'get_admin_revenue_timeseries'>
export type AdminUserGrowthPoint = Row<'get_admin_user_growth_timeseries'>
export type AdminTopCategoryRow = Row<'get_admin_top_categories'>

interface DateRange {
	start: Date
	end: Date
}

interface TimeseriesArgs extends DateRange {
	bucket?: BucketGranularity
}

interface TopArgs extends DateRange {
	limit?: number
}

function toIso(d: Date): string {
	return d.toISOString()
}

/**
 * Empty-summary fallback used when the caller has no associated
 * creator/business row, so consumers can render zero-state UI without
 * branching on `null`.
 */
function emptyCreatorSummary(): CreatorAnalyticsSummary {
	return {
		revenue_minor: 0,
		payouts_count: 0,
		bookings_count: 0,
		completed_count: 0,
		avg_rating: 0,
		review_count: 0,
		prev_revenue_minor: 0,
		prev_payouts_count: 0,
		prev_bookings_count: 0,
		prev_completed_count: 0,
	}
}

function emptyBusinessSummary(): BusinessAnalyticsSummary {
	return {
		spending_minor: 0,
		payments_count: 0,
		bookings_count: 0,
		active_bookings_count: 0,
		completed_count: 0,
		prev_spending_minor: 0,
		prev_payments_count: 0,
		prev_bookings_count: 0,
		prev_completed_count: 0,
	}
}

// ============================================================
// Creator
// ============================================================

export const getCreatorAnalyticsSummary = cache(
	async ({ start, end }: DateRange): Promise<CreatorAnalyticsSummary> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc(
			'get_creator_analytics_summary',
			{ p_start_date: toIso(start), p_end_date: toIso(end) },
		)
		if (error || !data?.[0]) return emptyCreatorSummary()
		return data[0]
	},
)

export const getCreatorRevenueTimeseries = cache(
	async ({
		start,
		end,
		bucket = 'day',
	}: TimeseriesArgs): Promise<CreatorRevenuePoint[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc(
			'get_creator_revenue_timeseries',
			{
				p_start_date: toIso(start),
				p_end_date: toIso(end),
				p_bucket: bucket,
			},
		)
		if (error || !data) return []
		return data
	},
)

export const getCreatorBookingsByStatus = cache(
	async ({ start, end }: DateRange): Promise<CreatorBookingsByStatusRow[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc(
			'get_creator_bookings_by_status',
			{ p_start_date: toIso(start), p_end_date: toIso(end) },
		)
		if (error || !data) return []
		return data
	},
)

// ============================================================
// Business
// ============================================================

export const getBusinessAnalyticsSummary = cache(
	async ({ start, end }: DateRange): Promise<BusinessAnalyticsSummary> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc(
			'get_business_analytics_summary',
			{ p_start_date: toIso(start), p_end_date: toIso(end) },
		)
		if (error || !data?.[0]) return emptyBusinessSummary()
		return data[0]
	},
)

export const getBusinessSpendingTimeseries = cache(
	async ({
		start,
		end,
		bucket = 'day',
	}: TimeseriesArgs): Promise<BusinessSpendingPoint[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc(
			'get_business_spending_timeseries',
			{
				p_start_date: toIso(start),
				p_end_date: toIso(end),
				p_bucket: bucket,
			},
		)
		if (error || !data) return []
		return data
	},
)

export const getBusinessTopCreators = cache(
	async ({
		start,
		end,
		limit = 5,
	}: TopArgs): Promise<BusinessTopCreatorRow[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc('get_business_top_creators', {
			p_start_date: toIso(start),
			p_end_date: toIso(end),
			p_limit: limit,
		})
		if (error || !data) return []
		return data
	},
)

// ============================================================
// Admin (RPCs check is_admin() server-side and raise 'forbidden')
// ============================================================

export const getAdminAnalyticsSummary = cache(
	async ({ start, end }: DateRange): Promise<AdminAnalyticsSummary | null> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc('get_admin_analytics_summary', {
			p_start_date: toIso(start),
			p_end_date: toIso(end),
		})
		if (error || !data?.[0]) return null
		return data[0]
	},
)

export const getAdminRevenueTimeseries = cache(
	async ({
		start,
		end,
		bucket = 'day',
	}: TimeseriesArgs): Promise<AdminRevenuePoint[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc('get_admin_revenue_timeseries', {
			p_start_date: toIso(start),
			p_end_date: toIso(end),
			p_bucket: bucket,
		})
		if (error || !data) return []
		return data
	},
)

export const getAdminUserGrowthTimeseries = cache(
	async ({
		start,
		end,
		bucket = 'day',
	}: TimeseriesArgs): Promise<AdminUserGrowthPoint[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc(
			'get_admin_user_growth_timeseries',
			{
				p_start_date: toIso(start),
				p_end_date: toIso(end),
				p_bucket: bucket,
			},
		)
		if (error || !data) return []
		return data
	},
)

export const getAdminTopCategories = cache(
	async ({
		start,
		end,
		limit = 10,
	}: TopArgs): Promise<AdminTopCategoryRow[]> => {
		const supabase = await createClient()
		const { data, error } = await supabase.rpc('get_admin_top_categories', {
			p_start_date: toIso(start),
			p_end_date: toIso(end),
			p_limit: limit,
		})
		if (error || !data) return []
		return data
	},
)
