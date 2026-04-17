import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('paymentsAdminTitle') }
}

const PAGE_SIZE = 25

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> =
	{
		pending: 'outline',
		captured: 'default',
		transferred: 'secondary',
		refunded: 'outline',
		failed: 'outline',
	}

interface PageProps {
	searchParams: Promise<{ page?: string }>
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const t = await getTranslations('admin')
	const supabase = await createClient()

	const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
	const offset = (page - 1) * PAGE_SIZE

	const { data: payments, count } = await supabase
		.from('payments')
		.select(
			`
			id, amount_total, platform_fee, creator_payout, currency, status, created_at,
			booking:bookings!payments_booking_id_fkey(id, title)
		`,
			{ count: 'exact' },
		)
		.order('created_at', { ascending: false })
		.range(offset, offset + PAGE_SIZE - 1)

	const totalCount = count ?? 0
	const totalPages = Math.ceil(totalCount / PAGE_SIZE)

	const statusKeys: Record<string, string> = {
		pending: 'paymentStatusPending',
		captured: 'paymentStatusCaptured',
		transferred: 'paymentStatusTransferred',
		refunded: 'paymentStatusRefunded',
		failed: 'paymentStatusFailed',
	}

	return (
		<div className="mx-auto max-w-5xl">
			<div className="flex items-center justify-between gap-4">
				<p className="font-sans text-base leading-[1.7] text-muted-foreground">
					{t('paymentsDescription')}
				</p>
				<Button variant="outline" size="sm" asChild>
					<a href="/api/admin/payments/csv" download>
						{t('exportCsv')}
					</a>
				</Button>
			</div>

			{!payments || payments.length === 0 ? (
				<div className="mt-12 text-center">
					<p className="font-sans text-sm text-muted-foreground">
						{t('noPayments')}
					</p>
				</div>
			) : (
				<>
					<div className="mt-6 overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b border-outline-variant/10">
									<th className="py-3 pr-4 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
										{t('paymentBooking')}
									</th>
									<th className="px-4 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
										{t('paymentAmount')}
									</th>
									<th className="px-4 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
										{t('paymentFee')}
									</th>
									<th className="px-4 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
										{t('paymentPayout')}
									</th>
									<th className="px-4 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
										{t('paymentStatus')}
									</th>
									<th className="pl-4 py-3 text-left font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
										{t('paymentDate')}
									</th>
								</tr>
							</thead>
							<tbody>
								{payments.map((payment) => {
									const booking = payment.booking as unknown as {
										id: string
										title: string
									} | null
									return (
										<tr
											key={payment.id}
											className="border-b border-outline-variant/5"
										>
											<td className="py-3 pr-4">
												<p className="truncate font-sans text-sm text-foreground">
													{booking?.title ?? '—'}
												</p>
											</td>
											<td className="px-4 py-3 font-sans text-sm text-foreground">
												{t('amountFormatted', {
													amount: (payment.amount_total / 100).toLocaleString(),
												})}
											</td>
											<td className="px-4 py-3 font-sans text-sm text-muted-foreground">
												{t('amountFormatted', {
													amount: (payment.platform_fee / 100).toLocaleString(),
												})}
											</td>
											<td className="px-4 py-3 font-sans text-sm text-muted-foreground">
												{t('amountFormatted', {
													amount: (
														payment.creator_payout / 100
													).toLocaleString(),
												})}
											</td>
											<td className="px-4 py-3">
												<Badge
													variant={
														statusBadgeVariant[payment.status] ?? 'outline'
													}
												>
													{t(statusKeys[payment.status] as never)}
												</Badge>
											</td>
											<td className="pl-4 py-3 font-sans text-sm text-muted-foreground">
												{new Date(payment.created_at).toLocaleDateString(
													undefined,
													{
														month: 'short',
														day: 'numeric',
														year: 'numeric',
													},
												)}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>

					{totalPages > 1 && (
						<div className="mt-6 flex items-center justify-between">
							<p className="font-sans text-sm text-muted-foreground">
								{t('paymentPageInfo', {
									page: String(page),
									total: String(totalPages),
								})}
							</p>
							<div className="flex gap-2">
								{page > 1 && (
									<Button variant="ghost" size="sm" asChild>
										<Link href={`/admin/payments?page=${page - 1}`}>
											{t('previousPage')}
										</Link>
									</Button>
								)}
								{page < totalPages && (
									<Button variant="ghost" size="sm" asChild>
										<Link href={`/admin/payments?page=${page + 1}`}>
											{t('nextPage')}
										</Link>
									</Button>
								)}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}
