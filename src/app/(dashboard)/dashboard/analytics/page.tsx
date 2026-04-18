import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { BookingsStatusChart } from '@/components/analytics/bookings-status-chart'
import { KpiCard } from '@/components/analytics/kpi-card'
import { RangePicker } from '@/components/analytics/range-picker'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { TopCreatorsTable } from '@/components/analytics/top-creators-table'
import { Card, CardContent } from '@/components/ui/card'
import {
	type AnalyticsRangeKey,
	resolveAnalyticsRange,
	trendDelta,
} from '@/lib/analytics/range'
import {
	getBusinessAnalyticsSummary,
	getBusinessSpendingTimeseries,
	getBusinessTopCreators,
	getCreatorAnalyticsSummary,
	getCreatorBookingsByStatus,
	getCreatorRevenueTimeseries,
} from '@/lib/queries/analytics'
import { createClient } from '@/lib/supabase/server'
import { formatMoney } from '@/lib/utils'

const VALID_RANGES = new Set<AnalyticsRangeKey>([
	'this_week',
	'this_month',
	'this_quarter',
	'this_year',
	'last_30_days',
	'last_90_days',
	'last_12_months',
])

function parseRange(raw: string | string[] | undefined): AnalyticsRangeKey {
	const value = Array.isArray(raw) ? raw[0] : raw
	if (value && VALID_RANGES.has(value as AnalyticsRangeKey)) {
		return value as AnalyticsRangeKey
	}
	return 'last_30_days'
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('analyticsTitle') }
}

interface AnalyticsPageProps {
	searchParams: Promise<{ range?: string }>
}

export default async function DashboardAnalyticsPage({
	searchParams,
}: AnalyticsPageProps) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const role = user.app_metadata?.role
	if (role !== 'creator' && role !== 'business') redirect('/dashboard')

	const params = await searchParams
	const rangeKey = parseRange(params.range)
	const range = resolveAnalyticsRange(rangeKey)

	if (role === 'business') {
		return <BusinessAnalytics rangeKey={rangeKey} range={range} />
	}
	return <CreatorAnalytics rangeKey={rangeKey} range={range} />
}

// ============================================================
// Creator
// ============================================================

interface ViewProps {
	rangeKey: AnalyticsRangeKey
	range: ReturnType<typeof resolveAnalyticsRange>
}

async function CreatorAnalytics({ rangeKey, range }: ViewProps) {
	const t = await getTranslations('analytics')
	const { start, end, bucket } = range

	const [summary, revenueSeries, statusBreakdown] = await Promise.all([
		getCreatorAnalyticsSummary({ start, end }),
		getCreatorRevenueTimeseries({ start, end, bucket }),
		getCreatorBookingsByStatus({ start, end }),
	])

	const revenueDelta = trendDelta(
		Number(summary.revenue_minor),
		Number(summary.prev_revenue_minor),
	)
	const bookingsDelta = trendDelta(
		Number(summary.bookings_count),
		Number(summary.prev_bookings_count),
	)
	const completedDelta = trendDelta(
		Number(summary.completed_count),
		Number(summary.prev_completed_count),
	)
	const payoutsDelta = trendDelta(
		Number(summary.payouts_count),
		Number(summary.prev_payouts_count),
	)

	const avgRating = summary.avg_rating ? Number(summary.avg_rating) : null
	const reviewCount = Number(summary.review_count)
	const previousHint = t('comparedToPreviousPeriod')

	const revenueChartData = revenueSeries.map((p) => ({
		bucket_start: p.bucket_start,
		value_minor: Number(p.revenue_minor),
	}))

	const statusChartData = statusBreakdown.map((s) => ({
		label: t(`bookingStatus.${s.status}`),
		count: Number(s.count),
	}))

	return (
		<div className="mx-auto max-w-6xl">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<p className="font-sans text-sm text-muted-foreground">
					{t('creatorDescription')}
				</p>
				<RangePicker current={rangeKey} />
			</div>

			<section
				aria-labelledby="kpi-heading"
				className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
			>
				<h2 id="kpi-heading" className="sr-only">
					{t('kpiSectionLabel')}
				</h2>
				<KpiCard
					label={t('kpiRevenue')}
					value={formatMoney(Number(summary.revenue_minor))}
					trend={revenueDelta}
					trendSrHint={t('kpiRevenue')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiBookings')}
					value={String(summary.bookings_count)}
					trend={bookingsDelta}
					trendSrHint={t('kpiBookings')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiCompleted')}
					value={String(summary.completed_count)}
					trend={completedDelta}
					trendSrHint={t('kpiCompleted')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiAvgRating')}
					value={
						avgRating !== null
							? avgRating.toLocaleString('sv-SE', {
									minimumFractionDigits: 1,
									maximumFractionDigits: 1,
								})
							: '—'
					}
					hint={
						reviewCount > 0
							? t('kpiReviewCount', { count: reviewCount })
							: t('kpiReviewCountEmpty')
					}
				/>
			</section>

			<section aria-labelledby="revenue-chart-heading" className="mt-8">
				<Card>
					<CardContent>
						<div className="flex items-baseline justify-between gap-4">
							<h2
								id="revenue-chart-heading"
								className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground"
							>
								{t('revenueChartTitle')}
							</h2>
							<span className="font-sans text-xs text-muted-foreground">
								{t('payoutsCountSuffix', {
									count: Number(summary.payouts_count),
								})}
							</span>
						</div>
						<div className="mt-4">
							<RevenueChart
								data={revenueChartData}
								bucket={bucket}
								emptyMessage={t('revenueChartEmpty')}
								tooltipLabel={t('kpiRevenue')}
								srLabel={t('revenueChartTitle')}
							/>
						</div>
					</CardContent>
				</Card>
			</section>

			<section aria-labelledby="bookings-chart-heading" className="mt-6">
				<Card>
					<CardContent>
						<h2
							id="bookings-chart-heading"
							className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground"
						>
							{t('bookingsByStatusTitle')}
						</h2>
						<div className="mt-4">
							<BookingsStatusChart
								data={statusChartData}
								emptyMessage={t('bookingsByStatusEmpty')}
								tooltipLabel={t('bookingsCount')}
								srLabel={t('bookingsByStatusTitle')}
							/>
						</div>
					</CardContent>
				</Card>
			</section>

			<p className="mt-6 font-sans text-xs text-muted-foreground">
				{t('payoutsTrendHint', { count: Number(summary.payouts_count) })}{' '}
				{payoutsDelta && payoutsDelta.direction !== 'flat'
					? t(
							payoutsDelta.direction === 'up'
								? 'payoutsTrendUp'
								: 'payoutsTrendDown',
							{
								value: Math.abs(payoutsDelta.pct).toLocaleString('sv-SE', {
									minimumFractionDigits: 1,
									maximumFractionDigits: 1,
								}),
							},
						)
					: ''}
			</p>
		</div>
	)
}

// ============================================================
// Business
// ============================================================

async function BusinessAnalytics({ rangeKey, range }: ViewProps) {
	const t = await getTranslations('analytics')
	const { start, end, bucket } = range

	const [summary, spendingSeries, topCreators] = await Promise.all([
		getBusinessAnalyticsSummary({ start, end }),
		getBusinessSpendingTimeseries({ start, end, bucket }),
		getBusinessTopCreators({ start, end, limit: 5 }),
	])

	const spendingDelta = trendDelta(
		Number(summary.spending_minor),
		Number(summary.prev_spending_minor),
	)
	const bookingsDelta = trendDelta(
		Number(summary.bookings_count),
		Number(summary.prev_bookings_count),
	)
	const completedDelta = trendDelta(
		Number(summary.completed_count),
		Number(summary.prev_completed_count),
	)

	const previousHint = t('comparedToPreviousPeriod')

	const spendingChartData = spendingSeries.map((p) => ({
		bucket_start: p.bucket_start,
		value_minor: Number(p.spending_minor),
	}))

	return (
		<div className="mx-auto max-w-6xl">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<p className="font-sans text-sm text-muted-foreground">
					{t('businessDescription')}
				</p>
				<RangePicker current={rangeKey} />
			</div>

			<section
				aria-labelledby="kpi-heading"
				className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
			>
				<h2 id="kpi-heading" className="sr-only">
					{t('kpiSectionLabel')}
				</h2>
				<KpiCard
					label={t('kpiSpending')}
					value={formatMoney(Number(summary.spending_minor))}
					trend={spendingDelta}
					trendSrHint={t('kpiSpending')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiBookings')}
					value={String(summary.bookings_count)}
					trend={bookingsDelta}
					trendSrHint={t('kpiBookings')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiActiveBookings')}
					value={String(summary.active_bookings_count)}
					hint={t('kpiActiveBookingsHint')}
				/>
				<KpiCard
					label={t('kpiCompleted')}
					value={String(summary.completed_count)}
					trend={completedDelta}
					trendSrHint={t('kpiCompleted')}
					hint={previousHint}
				/>
			</section>

			<section aria-labelledby="spending-chart-heading" className="mt-8">
				<Card>
					<CardContent>
						<div className="flex items-baseline justify-between gap-4">
							<h2
								id="spending-chart-heading"
								className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground"
							>
								{t('spendingChartTitle')}
							</h2>
							<span className="font-sans text-xs text-muted-foreground">
								{t('paymentsCountSuffix', {
									count: Number(summary.payments_count),
								})}
							</span>
						</div>
						<div className="mt-4">
							<RevenueChart
								data={spendingChartData}
								bucket={bucket}
								emptyMessage={t('spendingChartEmpty')}
								tooltipLabel={t('kpiSpending')}
								srLabel={t('spendingChartTitle')}
							/>
						</div>
					</CardContent>
				</Card>
			</section>

			<section className="mt-6">
				<TopCreatorsTable
					title={t('topCreatorsTitle')}
					emptyMessage={t('topCreatorsEmpty')}
					bookingsLabel={(count: number) =>
						t('topCategoriesBookings', { count })
					}
					spendingLabel={t('kpiSpending')}
					rows={topCreators.map((c) => ({
						creator_id: c.creator_id,
						display_name: c.display_name,
						avatar_url: c.avatar_url,
						slug: c.slug,
						bookings_count: Number(c.bookings_count),
						spending_minor: Number(c.spending_minor),
					}))}
				/>
			</section>
		</div>
	)
}
