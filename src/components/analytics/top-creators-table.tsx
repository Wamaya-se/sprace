import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { formatMoney } from '@/lib/utils'

export interface TopCreatorRow {
	creator_id: string
	display_name: string | null
	avatar_url: string | null
	slug: string | null
	bookings_count: number
	spending_minor: number
}

interface TopCreatorsTableProps {
	title: string
	emptyMessage: string
	bookingsLabel: (count: number) => string
	spendingLabel: string
	rows: TopCreatorRow[]
	currency?: string
}

/**
 * Server component that renders a top-N table of creators a business
 * has spent the most with in the selected period. Each row links to
 * the creator's public profile so the user can re-book quickly.
 */
export function TopCreatorsTable({
	title,
	emptyMessage,
	bookingsLabel,
	spendingLabel,
	rows,
	currency = 'sek',
}: TopCreatorsTableProps) {
	return (
		<Card>
			<CardContent>
				<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
					{title}
				</h2>
				{rows.length === 0 ? (
					<p className="mt-4 rounded-2xl border border-outline-variant/20 bg-surface-container/40 px-4 py-8 text-center font-sans text-sm text-muted-foreground">
						{emptyMessage}
					</p>
				) : (
					<ol className="mt-4 divide-y divide-outline-variant/10">
						{rows.map((row, index) => {
							const initial = (row.display_name ?? '?').charAt(0).toUpperCase()
							const name = row.display_name ?? '—'
							const href = row.slug
								? `/dashboard/discover/${row.slug}`
								: '/dashboard/discover'
							return (
								<li
									key={row.creator_id}
									className="flex items-center gap-3 py-3"
								>
									<span className="w-5 flex-shrink-0 font-sans text-sm font-medium text-muted-foreground tabular-nums">
										{index + 1}
									</span>
									<Avatar className="h-9 w-9">
										{row.avatar_url ? (
											<AvatarImage src={row.avatar_url} alt={name} />
										) : null}
										<AvatarFallback>{initial}</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1">
										<Link
											href={href}
											className="block truncate font-sans text-sm font-medium text-foreground hover:text-brand"
										>
											{name}
										</Link>
										<p className="font-sans text-xs text-muted-foreground">
											{bookingsLabel(Number(row.bookings_count))}
										</p>
									</div>
									<div className="text-right">
										<p className="font-heading text-sm font-semibold tabular-nums text-foreground">
											{formatMoney(Number(row.spending_minor), currency)}
										</p>
										<p className="font-sans text-xs text-muted-foreground">
											{spendingLabel}
										</p>
									</div>
								</li>
							)
						})}
					</ol>
				)}
			</CardContent>
		</Card>
	)
}
