import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDisputes } from '@/lib/queries/disputes'
import { DisputeResolveActions } from './dispute-resolve-actions'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('disputesAdminTitle') }
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
	open: 'default',
	under_review: 'default',
	resolved_refund: 'secondary',
	resolved_release: 'secondary',
	resolved_partial: 'secondary',
	dismissed: 'outline',
}

const statusKeys: Record<string, string> = {
	open: 'statusOpen',
	under_review: 'statusUnderReview',
	resolved_refund: 'statusResolvedRefund',
	resolved_release: 'statusResolvedRelease',
	resolved_partial: 'statusResolvedPartial',
	dismissed: 'statusDismissed',
}

interface PageProps {
	searchParams: Promise<{ filter?: string }>
}

export default async function AdminDisputesPage({ searchParams }: PageProps) {
	const params = await searchParams
	const t = await getTranslations('disputes')
	const filter = params.filter || 'all'
	const disputes = await getDisputes()

	const filteredDisputes =
		filter === 'open'
			? disputes.filter((d) => ['open', 'under_review'].includes(d.status))
			: filter === 'resolved'
				? disputes.filter((d) => !['open', 'under_review'].includes(d.status))
				: disputes

	const filters = ['all', 'open', 'resolved']

	return (
		<div className="mx-auto max-w-5xl">
			<p className="font-sans text-base leading-[1.7] text-muted-foreground">
				{t('description')}
			</p>

			{/* Filter tabs */}
			<div className="mt-4 flex flex-wrap gap-2">
				{filters.map((f) => (
					<Button
						key={f}
						variant={filter === f ? 'chip' : 'ghost'}
						size="sm"
						asChild
					>
						<Link
							href={
								f === 'all' ? '/admin/disputes' : `/admin/disputes?filter=${f}`
							}
						>
							{t(`filter${f.charAt(0).toUpperCase() + f.slice(1)}` as never)}
						</Link>
					</Button>
				))}
			</div>

			{filteredDisputes.length === 0 ? (
				<div className="mt-12 text-center">
					<p className="font-sans text-sm text-muted-foreground">
						{t('noDisputes')}
					</p>
				</div>
			) : (
				<div className="mt-6 flex flex-col gap-4">
					{filteredDisputes.map((dispute) => (
						<div
							key={dispute.id}
							className="rounded-xl bg-surface-container p-5"
						>
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<h3 className="truncate font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
											{dispute.booking.title}
										</h3>
										<Badge
											variant={statusVariants[dispute.status] ?? 'outline'}
										>
											{t(statusKeys[dispute.status] as never)}
										</Badge>
									</div>

									<div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 font-sans text-xs text-muted-foreground">
										<span>
											{t('openedBy')}: {dispute.opened_by_name}
										</span>
										<span>
											{t('businessLabel')}: {dispute.business_name}
										</span>
										<span>
											{t('creatorLabel')}: {dispute.creator_name}
										</span>
										<span>
											{t('dateOpened')}:{' '}
											{new Date(dispute.created_at).toLocaleDateString(
												undefined,
												{
													month: 'short',
													day: 'numeric',
													year: 'numeric',
												},
											)}
										</span>
									</div>
								</div>

								<Button variant="ghost" size="sm" asChild>
									<Link href={`/dashboard/bookings/${dispute.booking.id}`}>
										{t('viewBooking')}
									</Link>
								</Button>
							</div>

							<div className="mt-3">
								<span className="font-sans text-xs font-medium text-muted-foreground">
									{t('disputeReason')}
								</span>
								<p className="mt-0.5 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
									{dispute.reason}
								</p>
							</div>

							{dispute.admin_note && (
								<div className="mt-3 rounded-lg bg-surface-container-low p-3">
									<span className="font-sans text-xs font-medium text-muted-foreground">
										{t('disputeAdminNote')}
									</span>
									<p className="mt-0.5 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
										{dispute.admin_note}
									</p>
								</div>
							)}

							{['open', 'under_review'].includes(dispute.status) && (
								<div className="mt-4">
									<DisputeResolveActions disputeId={dispute.id} />
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
