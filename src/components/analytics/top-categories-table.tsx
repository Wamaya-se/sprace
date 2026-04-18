import { Card, CardContent } from '@/components/ui/card'
import { formatMoney } from '@/lib/utils'

export interface TopCategoryRow {
	specialty_id: string
	slug: string | null
	name: string | null
	bookings_count: number
	completed_bookings_count: number
	gross_volume_minor: number
}

interface TopCategoriesTableProps {
	title: string
	emptyMessage: string
	categoryHeader: string
	bookingsHeader: string
	completedHeader: string
	gmvHeader: string
	rows: TopCategoryRow[]
	currency?: string
}

/**
 * Server component that renders the top categories on the platform
 * by booking volume + GMV. Used on the admin analytics dashboard.
 */
export function TopCategoriesTable({
	title,
	emptyMessage,
	categoryHeader,
	bookingsHeader,
	completedHeader,
	gmvHeader,
	rows,
	currency = 'sek',
}: TopCategoriesTableProps) {
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
					<div className="mt-4 overflow-x-auto">
						<table className="w-full text-left">
							<thead>
								<tr className="border-b border-outline-variant/10">
									<th
										scope="col"
										className="pb-2 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground"
									>
										#
									</th>
									<th
										scope="col"
										className="pb-2 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground"
									>
										{categoryHeader}
									</th>
									<th
										scope="col"
										className="pb-2 text-right font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground"
									>
										{bookingsHeader}
									</th>
									<th
										scope="col"
										className="hidden pb-2 text-right font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell"
									>
										{completedHeader}
									</th>
									<th
										scope="col"
										className="pb-2 text-right font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground"
									>
										{gmvHeader}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-outline-variant/10">
								{rows.map((row, index) => (
									<tr key={row.specialty_id}>
										<td className="py-3 font-sans text-sm text-muted-foreground tabular-nums">
											{index + 1}
										</td>
										<td className="py-3 font-sans text-sm font-medium text-foreground">
											{row.name ?? row.slug ?? '—'}
										</td>
										<td className="py-3 text-right font-sans text-sm tabular-nums text-foreground">
											{Number(row.bookings_count).toLocaleString('sv-SE')}
										</td>
										<td className="hidden py-3 text-right font-sans text-sm tabular-nums text-muted-foreground sm:table-cell">
											{Number(row.completed_bookings_count).toLocaleString(
												'sv-SE',
											)}
										</td>
										<td className="py-3 text-right font-sans text-sm font-semibold tabular-nums text-foreground">
											{formatMoney(Number(row.gross_volume_minor), currency)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
