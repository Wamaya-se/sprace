import { Card, CardContent } from '@/components/ui/card'
import type { TrendDelta } from '@/lib/analytics/range'

import { TrendBadge } from './trend-badge'

interface KpiCardProps {
	label: string
	value: string
	trend?: TrendDelta | null
	trendSrHint?: string
	hint?: string
}

/**
 * Reusable KPI card for analytics dashboards. Renders a label, a
 * large value, an optional trend pill, and an optional secondary hint
 * (e.g. "vs previous 30 days"). Server Component — pure presentational.
 */
export function KpiCard({
	label,
	value,
	trend,
	trendSrHint,
	hint,
}: KpiCardProps) {
	return (
		<Card>
			<CardContent>
				<p className="font-sans text-sm text-muted-foreground">{label}</p>
				<div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
					<p className="font-heading text-3xl font-bold tracking-[-0.03em] text-foreground">
						{value}
					</p>
					{trend !== undefined && (
						<TrendBadge delta={trend} srHint={trendSrHint} />
					)}
				</div>
				{hint && (
					<p className="mt-1 font-sans text-xs text-muted-foreground">{hint}</p>
				)}
			</CardContent>
		</Card>
	)
}
