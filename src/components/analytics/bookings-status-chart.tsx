'use client'

import { useTranslations } from 'next-intl'
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

interface BookingsStatusPoint {
	label: string
	count: number
}

interface BookingsStatusChartProps {
	data: BookingsStatusPoint[]
	emptyMessage: string
	tooltipLabel: string
	srLabel: string
}

export function BookingsStatusChart({
	data,
	emptyMessage,
	tooltipLabel,
	srLabel,
}: BookingsStatusChartProps) {
	const t = useTranslations('analytics')

	const total = data.reduce((sum, p) => sum + p.count, 0)

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

	return (
		<div
			role="img"
			aria-label={t('chartSummaryCount', { label: srLabel, count: total })}
			className="h-64 w-full"
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="var(--outline-variant)"
						strokeOpacity={0.4}
						horizontal
						vertical={false}
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
						allowDecimals={false}
						width={32}
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
							return [num, tooltipLabel]
						}}
					/>
					<Bar
						dataKey="count"
						fill="var(--brand)"
						radius={[8, 8, 0, 0]}
						maxBarSize={48}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
