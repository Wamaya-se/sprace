import { useTranslations } from 'next-intl'

import type { TrendDelta } from '@/lib/analytics/range'
import { cn } from '@/lib/utils'

interface TrendBadgeProps {
	delta: TrendDelta | null
	srHint?: string
}

/**
 * Presentational trend pill: ↑ +12,3 % (green), ↓ −5,4 % (red),
 * — flat (muted), or "—" when previous=0 (no comparison possible).
 */
export function TrendBadge({ delta, srHint }: TrendBadgeProps) {
	const t = useTranslations('analytics')

	if (delta === null) {
		return (
			<span
				className="inline-flex items-center gap-1 rounded-full bg-surface-container/60 px-2 py-0.5 font-sans text-xs font-medium text-muted-foreground"
				aria-label={t('trendNoComparison')}
			>
				—
			</span>
		)
	}

	const arrow =
		delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'
	const color =
		delta.direction === 'up'
			? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
			: delta.direction === 'down'
				? 'bg-destructive/10 text-destructive'
				: 'bg-surface-container/60 text-muted-foreground'

	const formatted = delta.pct.toLocaleString('sv-SE', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	})
	const sign = delta.direction === 'up' ? '+' : ''
	const label = `${arrow} ${sign}${formatted} %`
	const ariaLabel = srHint
		? `${srHint}: ${label}`
		: t('trendDelta', { value: `${sign}${formatted}` })

	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-xs font-semibold',
				color,
			)}
			aria-label={ariaLabel}
		>
			{label}
		</span>
	)
}
