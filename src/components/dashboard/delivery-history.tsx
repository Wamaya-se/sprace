import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { DeliveryItem } from '@/lib/queries/deliveries'
import { DeliveryReview } from '@/components/dashboard/delivery-review'
import { DeliveryFileGrid } from '@/components/dashboard/delivery-file-grid'

interface DeliveryHistoryProps {
	deliveries: DeliveryItem[]
	bookingStatus: string
	userRole: string
	revisionsUsed: number
	maxRevisions: number
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
	submitted: 'default',
	approved: 'secondary',
	revision_requested: 'outline',
}

export async function DeliveryHistory({
	deliveries,
	bookingStatus,
	userRole,
	revisionsUsed,
	maxRevisions,
}: DeliveryHistoryProps) {
	const t = await getTranslations('deliveries')

	if (deliveries.length === 0) {
		return (
			<Card>
				<CardContent className="py-6">
					<p className="text-center font-sans text-sm text-muted-foreground">
						{userRole === 'creator'
							? t('noDeliveriesCreator')
							: t('noDeliveriesBusiness')}
					</p>
				</CardContent>
			</Card>
		)
	}

	const latestDelivery = deliveries[0]
	const previousDeliveries = deliveries.slice(1)
	const showReviewActions =
		userRole === 'business' &&
		latestDelivery.status === 'submitted' &&
		bookingStatus === 'delivered'

	return (
		<div className="flex flex-col gap-4">
			{/* Latest delivery */}
			<div>
				<div className="mb-2 flex items-center gap-2">
					<h4 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
						{t('currentDelivery')}
					</h4>
					<Badge variant={statusVariants[latestDelivery.status] ?? 'outline'}>
						{t(
							`status${latestDelivery.status.charAt(0).toUpperCase() + latestDelivery.status.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as never,
						)}
					</Badge>
				</div>

				<Card>
					<CardContent className="py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="font-sans text-xs font-medium text-brand">
									{t('version', { version: latestDelivery.version })}
								</span>
								<span className="font-sans text-xs text-muted-foreground">
									{t('submittedAt', {
										date: new Date(
											latestDelivery.created_at,
										).toLocaleDateString(undefined, {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										}),
									})}
								</span>
							</div>
						</div>

						{latestDelivery.comment && (
							<p className="mt-2 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
								{latestDelivery.comment}
							</p>
						)}

						{latestDelivery.files.length > 0 && (
							<div className="mt-3">
								<DeliveryFileGrid
									files={latestDelivery.files}
									deliveryStatus={latestDelivery.status}
									userRole={userRole}
								/>
							</div>
						)}

						{latestDelivery.revision_comment && (
							<div className="mt-3 rounded-lg bg-surface-container-low p-3">
								<span className="font-sans text-xs font-medium text-muted-foreground">
									{t('revisionNote')}
								</span>
								<p className="mt-1 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
									{latestDelivery.revision_comment}
								</p>
							</div>
						)}

						{showReviewActions && (
							<>
								<Separator className="my-4" />
								<DeliveryReview
									deliveryId={latestDelivery.id}
									revisionsUsed={revisionsUsed}
									maxRevisions={maxRevisions}
								/>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Previous deliveries */}
			{previousDeliveries.length > 0 && (
				<div>
					<h4 className="mb-2 font-heading text-sm font-semibold tracking-[-0.03em] text-muted-foreground">
						{t('previousDeliveries')}
					</h4>
					<div className="flex flex-col gap-3">
						{previousDeliveries.map((delivery) => (
							<Card key={delivery.id} className="opacity-70">
								<CardContent className="py-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="font-sans text-xs font-medium text-muted-foreground">
												{t('version', { version: delivery.version })}
											</span>
											<Badge
												variant={statusVariants[delivery.status] ?? 'outline'}
												className="text-xs"
											>
												{t(
													`status${delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as never,
												)}
											</Badge>
											<span className="font-sans text-xs text-muted-foreground">
												{t('submittedAt', {
													date: new Date(
														delivery.created_at,
													).toLocaleDateString(undefined, {
														month: 'short',
														day: 'numeric',
													}),
												})}
											</span>
										</div>
									</div>

									{delivery.comment && (
										<p className="mt-1.5 whitespace-pre-wrap font-sans text-xs leading-[1.7] text-muted-foreground">
											{delivery.comment}
										</p>
									)}

									{delivery.files.length > 0 && (
										<div className="mt-2">
											<DeliveryFileGrid
												files={delivery.files}
												deliveryStatus={delivery.status}
												userRole={userRole}
												compact
											/>
										</div>
									)}

									{delivery.revision_comment && (
										<div className="mt-2 rounded-lg bg-surface-container-low p-2">
											<span className="font-sans text-xs font-medium text-muted-foreground">
												{t('revisionNote')}
											</span>
											<p className="mt-0.5 whitespace-pre-wrap font-sans text-xs leading-[1.7] text-muted-foreground">
												{delivery.revision_comment}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
