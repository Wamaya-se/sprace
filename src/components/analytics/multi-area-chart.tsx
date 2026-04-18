'use client'

import { useTranslations } from 'next-intl'
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import type { BucketGranularity } from '@/lib/analytics/range'
import { formatMoneyShort } from '@/lib/utils'

export type ChartValueKind = 'money' | 'count'

export interface ChartSeries {
	dataKey: string
	label: string
	color: string
}

interface MultiAreaChartProps<T extends Record<string, unknown>> {
	data: Array<T & { bucket_start: string }>
	bucket: BucketGranularity
	series: ChartSeries[]
	valueKind: ChartValueKind
	currency?: string
	emptyMessage: string
	srLabel: string
}

function formatBucketLabel(iso: string, bucket: BucketGranularity): string {
	const date = new Date(iso)
	switch (bucket) {
		case 'month':
		case 'quarter':
			return date.toLocaleDateString('sv-SE', {
				month: 'short',
				year: '2-digit',
			})
		case 'year':
			return date.getUTCFullYear().toString()
		default:
			return date.toLocaleDateString('sv-SE', {
				day: '2-digit',
				month: 'short',
			})
	}
}

function makeYAxisFormatter(kind: ChartValueKind) {
	if (kind === 'count') {
		return (val: number) => {
			if (val === 0) return '0'
			if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`
			return Math.round(val).toString()
		}
	}
	return (val: number) => {
		if (val === 0) return '0'
		if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
		if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
		return val.toString()
	}
}

/**
 * Generic stacked / overlay area chart used by the admin dashboards
 * to render multiple series (e.g. GMV / fees / payouts, or new
 * creators vs new businesses) in a single chart.
 *
 * For money series we expect minor units (öre) and divide by 100 for
 * display, mirroring `RevenueChart`.
 */
export function MultiAreaChart<T extends Record<string, unknown>>({
	data,
	bucket,
	series,
	valueKind,
	currency = 'sek',
	emptyMessage,
	srLabel,
}: MultiAreaChartProps<T>) {
	const t = useTranslations('analytics')

	const total = data.reduce((sum, point) => {
		for (const s of series) {
			const raw = point[s.dataKey]
			const num = typeof raw === 'number' ? raw : Number(raw ?? 0)
			sum += Number.isFinite(num) ? num : 0
		}
		return sum
	}, 0)

	if (total === 0) {
		return (
			<div
				role="status"
				className="flex h-64 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container/40 px-4 text-center font-sans text-sm text-muted-foreground"
			>
				{emptyMessage}
			</div>
		)
	}

	const formatted = data.map((p) => {
		const row: Record<string, string | number> = {
			label: formatBucketLabel(p.bucket_start, bucket),
		}
		for (const s of series) {
			const raw = p[s.dataKey]
			const num = typeof raw === 'number' ? raw : Number(raw ?? 0)
			row[s.dataKey] = valueKind === 'money' ? num / 100 : num
		}
		return row
	})

	const yAxisFormatter = makeYAxisFormatter(valueKind)

	const summary =
		valueKind === 'money'
			? t('chartSummary', {
					label: srLabel,
					total: formatMoneyShort(total, currency),
				})
			: t('chartSummaryCount', { label: srLabel, count: total })

	return (
		<div role="img" aria-label={summary} className="h-64 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart
					data={formatted}
					margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
				>
					<defs>
						{series.map((s) => (
							<linearGradient
								key={s.dataKey}
								id={`grad-${s.dataKey}`}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
								<stop offset="100%" stopColor={s.color} stopOpacity={0} />
							</linearGradient>
						))}
					</defs>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="var(--outline-variant)"
						strokeOpacity={0.4}
					/>
					<XAxis
						dataKey="label"
						stroke="var(--muted-foreground)"
						fontSize={11}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						stroke="var(--muted-foreground)"
						fontSize={11}
						tickLine={false}
						axisLine={false}
						tickFormatter={yAxisFormatter}
						width={48}
						allowDecimals={valueKind === 'money'}
					/>
					<Tooltip
						cursor={{ fill: 'var(--surface-container-high)', opacity: 0.4 }}
						contentStyle={{
							backgroundColor: 'var(--surface-container)',
							border: '1px solid var(--outline-variant)',
							borderRadius: '12px',
							fontSize: '12px',
							color: 'var(--foreground)',
						}}
						labelStyle={{ color: 'var(--muted-foreground)' }}
						formatter={(value, name) => {
							const num = typeof value === 'number' ? value : Number(value)
							const label =
								series.find((s) => s.dataKey === name)?.label ?? String(name)
							const display =
								valueKind === 'money'
									? formatMoneyShort(num * 100, currency)
									: num.toLocaleString('sv-SE')
							return [display, label]
						}}
					/>
					<Legend
						wrapperStyle={{
							fontSize: '12px',
							paddingTop: '8px',
							color: 'var(--muted-foreground)',
						}}
						formatter={(value) =>
							series.find((s) => s.dataKey === value)?.label ?? String(value)
						}
					/>
					{series.map((s) => (
						<Area
							key={s.dataKey}
							type="monotone"
							dataKey={s.dataKey}
							name={s.dataKey}
							stroke={s.color}
							strokeWidth={2}
							fill={`url(#grad-${s.dataKey})`}
						/>
					))}
				</AreaChart>
			</ResponsiveContainer>
		</div>
	)
}
