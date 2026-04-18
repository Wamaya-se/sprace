'use client'

import { useTranslations } from 'next-intl'
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import type { BucketGranularity } from '@/lib/analytics/range'
import { formatMoneyShort } from '@/lib/utils'

interface RevenueChartPoint {
	bucket_start: string
	value_minor: number
}

interface RevenueChartProps {
	data: RevenueChartPoint[]
	bucket: BucketGranularity
	currency?: string
	emptyMessage: string
	tooltipLabel: string
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

export function RevenueChart({
	data,
	bucket,
	currency = 'sek',
	emptyMessage,
	tooltipLabel,
	srLabel,
}: RevenueChartProps) {
	const t = useTranslations('analytics')

	const totalValue = data.reduce((sum, p) => sum + p.value_minor, 0)

	if (totalValue === 0) {
		return (
			<div
				role="status"
				className="flex h-64 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container/40 px-4 text-center font-sans text-sm text-muted-foreground"
			>
				{emptyMessage}
			</div>
		)
	}

	const formatted = data.map((p) => ({
		label: formatBucketLabel(p.bucket_start, bucket),
		raw: p.bucket_start,
		value: p.value_minor / 100,
	}))

	const yAxisFormatter = (val: number) => {
		if (val === 0) return '0'
		if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
		if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
		return val.toString()
	}

	return (
		<div
			role="img"
			aria-label={t('chartSummary', {
				label: srLabel,
				total: formatMoneyShort(totalValue, currency),
			})}
			className="h-64 w-full"
		>
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart
					data={formatted}
					margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
				>
					<defs>
						<linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="var(--brand)" stopOpacity={0.45} />
							<stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
						</linearGradient>
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
						formatter={(value) => {
							const num = typeof value === 'number' ? value : Number(value)
							return [formatMoneyShort(num * 100, currency), tooltipLabel]
						}}
					/>
					<Area
						type="monotone"
						dataKey="value"
						stroke="var(--brand)"
						strokeWidth={2}
						fill="url(#revGradient)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	)
}
