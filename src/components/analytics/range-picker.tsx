'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'

import type { AnalyticsRangeKey } from '@/lib/analytics/range'
import { cn } from '@/lib/utils'

const RANGE_KEYS: AnalyticsRangeKey[] = [
	'this_week',
	'this_month',
	'this_quarter',
	'this_year',
	'last_30_days',
	'last_90_days',
	'last_12_months',
]

interface RangePickerProps {
	current: AnalyticsRangeKey
	paramName?: string
}

export function RangePicker({
	current,
	paramName = 'range',
}: RangePickerProps) {
	const t = useTranslations('analytics')
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [isPending, startTransition] = useTransition()

	function handleSelect(next: AnalyticsRangeKey) {
		if (next === current) return
		const params = new URLSearchParams(searchParams.toString())
		params.set(paramName, next)
		startTransition(() => {
			router.replace(`${pathname}?${params.toString()}`, { scroll: false })
		})
	}

	return (
		<div
			role="group"
			aria-label={t('rangePickerLabel')}
			className="inline-flex flex-wrap gap-1 rounded-2xl bg-surface-container/60 p-1"
		>
			{RANGE_KEYS.map((key) => {
				const active = key === current
				return (
					<button
						key={key}
						type="button"
						onClick={() => handleSelect(key)}
						aria-pressed={active}
						disabled={isPending && active}
						className={cn(
							'rounded-xl px-3 py-1.5 font-sans text-xs font-medium duration-150',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
							active
								? 'bg-surface-container-high text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{t(`range.${key}`)}
					</button>
				)
			})}
		</div>
	)
}
