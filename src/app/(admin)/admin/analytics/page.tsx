import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { KpiCard } from '@/components/analytics/kpi-card'
import { MultiAreaChart } from '@/components/analytics/multi-area-chart'
import { RangePicker } from '@/components/analytics/range-picker'
import { TopCategoriesTable } from '@/components/analytics/top-categories-table'
import { Card, CardContent } from '@/components/ui/card'
import {
	type AnalyticsRangeKey,
	resolveAnalyticsRange,
	trendDelta,
} from '@/lib/analytics/range'
import {
	getAdminAnalyticsSummary,
	getAdminRevenueTimeseries,
	getAdminTopCategories,
	getAdminUserGrowthTimeseries,
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

interface AdminAnalyticsPageProps {
	searchParams: Promise<{ range?: string }>
}

export default async function AdminAnalyticsPage({
	searchParams,
}: AdminAnalyticsPageProps) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/login')
	if (user.app_metadata?.role !== 'admin') redirect('/dashboard')

	const t = await getTranslations('analytics')
	const params = await searchParams
	const rangeKey = parseRange(params.range)
	const { start, end, bucket } = resolveAnalyticsRange(rangeKey)

	const [summary, revenueSeries, growthSeries, categories] = await Promise.all([
		getAdminAnalyticsSummary({ start, end }),
		getAdminRevenueTimeseries({ start, end, bucket }),
		getAdminUserGrowthTimeseries({ start, end, bucket }),
		getAdminTopCategories({ start, end, limit: 10 }),
	])

	const previousHint = t('comparedToPreviousPeriod')
	const safe = summary ?? {
		gross_volume_minor: 0,
		platform_fee_minor: 0,
		payout_volume_minor: 0,
		refund_volume_minor: 0,
		payments_count: 0,
		completed_bookings_count: 0,
		new_users_count: 0,
		new_creators_count: 0,
		new_businesses_count: 0,
		prev_gross_volume_minor: 0,
		prev_platform_fee_minor: 0,
		prev_completed_bookings_count: 0,
		prev_new_users_count: 0,
	}

	const gmvDelta = trendDelta(
		Number(safe.gross_volume_minor),
		Number(safe.prev_gross_volume_minor),
	)
	const feesDelta = trendDelta(
		Number(safe.platform_fee_minor),
		Number(safe.prev_platform_fee_minor),
	)
	const completedDelta = trendDelta(
		Number(safe.completed_bookings_count),
		Number(safe.prev_completed_bookings_count),
	)
	const newUsersDelta = trendDelta(
		Number(safe.new_users_count),
		Number(safe.prev_new_users_count),
	)

	const revenueData = revenueSeries.map((p) => ({
		bucket_start: p.bucket_start,
		gross_volume_minor: Number(p.gross_volume_minor),
		platform_fee_minor: Number(p.platform_fee_minor),
		payout_volume_minor: Number(p.payout_volume_minor),
	}))

	const growthData = growthSeries.map((p) => ({
		bucket_start: p.bucket_start,
		creator_count: Number(p.creator_count),
		business_count: Number(p.business_count),
	}))

	return (
		<div className="mx-auto max-w-6xl">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<p className="font-sans text-sm text-muted-foreground">
					{t('adminDescription')}
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
					label={t('kpiGmv')}
					value={formatMoney(Number(safe.gross_volume_minor))}
					trend={gmvDelta}
					trendSrHint={t('kpiGmv')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiPlatformFees')}
					value={formatMoney(Number(safe.platform_fee_minor))}
					trend={feesDelta}
					trendSrHint={t('kpiPlatformFees')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiPayouts')}
					value={formatMoney(Number(safe.payout_volume_minor))}
					hint={t('paymentsCountSuffix', {
						count: Number(safe.payments_count),
					})}
				/>
				<KpiCard
					label={t('kpiRefunds')}
					value={formatMoney(Number(safe.refund_volume_minor))}
					hint={t('kpiRefundsHint')}
				/>
				<KpiCard
					label={t('kpiCompleted')}
					value={String(safe.completed_bookings_count)}
					trend={completedDelta}
					trendSrHint={t('kpiCompleted')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiNewUsers')}
					value={String(safe.new_users_count)}
					trend={newUsersDelta}
					trendSrHint={t('kpiNewUsers')}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiNewCreators')}
					value={String(safe.new_creators_count)}
					hint={previousHint}
				/>
				<KpiCard
					label={t('kpiNewBusinesses')}
					value={String(safe.new_businesses_count)}
					hint={previousHint}
				/>
			</section>

			<section aria-labelledby="gmv-chart-heading" className="mt-8">
				<Card>
					<CardContent>
						<h2
							id="gmv-chart-heading"
							className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground"
						>
							{t('gmvChartTitle')}
						</h2>
						<p className="mt-1 font-sans text-xs text-muted-foreground">
							{t('gmvChartDescription')}
						</p>
						<div className="mt-4">
							<MultiAreaChart
								data={revenueData}
								bucket={bucket}
								valueKind="money"
								series={[
									{
										dataKey: 'gross_volume_minor',
										label: t('kpiGmv'),
										color: 'var(--chart-1)',
									},
									{
										dataKey: 'platform_fee_minor',
										label: t('kpiPlatformFees'),
										color: 'var(--chart-3)',
									},
									{
										dataKey: 'payout_volume_minor',
										label: t('kpiPayouts'),
										color: 'var(--chart-5)',
									},
								]}
								emptyMessage={t('gmvChartEmpty')}
								srLabel={t('gmvChartTitle')}
							/>
						</div>
					</CardContent>
				</Card>
			</section>

			<section aria-labelledby="user-growth-chart-heading" className="mt-6">
				<Card>
					<CardContent>
						<h2
							id="user-growth-chart-heading"
							className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground"
						>
							{t('userGrowthChartTitle')}
						</h2>
						<p className="mt-1 font-sans text-xs text-muted-foreground">
							{t('userGrowthChartDescription')}
						</p>
						<div className="mt-4">
							<MultiAreaChart
								data={growthData}
								bucket={bucket}
								valueKind="count"
								series={[
									{
										dataKey: 'creator_count',
										label: t('kpiNewCreators'),
										color: 'var(--chart-1)',
									},
									{
										dataKey: 'business_count',
										label: t('kpiNewBusinesses'),
										color: 'var(--chart-5)',
									},
								]}
								emptyMessage={t('userGrowthChartEmpty')}
								srLabel={t('userGrowthChartTitle')}
							/>
						</div>
					</CardContent>
				</Card>
			</section>

			<section className="mt-6">
				<TopCategoriesTable
					title={t('topCategoriesTitle')}
					emptyMessage={t('topCategoriesEmpty')}
					categoryHeader={t('topCategoriesCategoryHeader')}
					bookingsHeader={t('topCategoriesBookingsHeader')}
					completedHeader={t('topCategoriesCompletedHeader')}
					gmvHeader={t('kpiGmv')}
					rows={categories.map((c) => ({
						specialty_id: c.specialty_id,
						slug: c.slug,
						name: c.name,
						bookings_count: Number(c.bookings_count),
						completed_bookings_count: Number(c.completed_bookings_count),
						gross_volume_minor: Number(c.gross_volume_minor),
					}))}
				/>
			</section>
		</div>
	)
}
