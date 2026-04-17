import { getTranslations } from 'next-intl/server'
import { Separator } from '@/components/ui/separator'
import { DeliveryForm } from '@/components/dashboard/delivery-form'
import { DeliveryHistory } from '@/components/dashboard/delivery-history'
import { DisputeSection } from '@/components/dashboard/dispute-section'
import { ReviewSection } from '@/components/dashboard/review-section'
import { getBookingReviews } from '@/lib/queries/reviews'
import type { getDeliveries } from '@/lib/queries/deliveries'
import type { getDisputeForBooking } from '@/lib/queries/disputes'

export async function DeliverySectionWrapper({
	deliveries,
	bookingId,
	bookingStatus,
	userRole,
	revisionsUsed,
	maxRevisions,
	showForm,
}: {
	deliveries: Awaited<ReturnType<typeof getDeliveries>>
	bookingId: string
	bookingStatus: string
	userRole: string
	revisionsUsed: number
	maxRevisions: number
	showForm: boolean
}) {
	const td = await getTranslations('deliveries')

	return (
		<>
			<Separator className="my-6" />
			<div>
				<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
					{td('deliveryHistory')}
				</h3>

				{showForm && (
					<div className="mt-3">
						<DeliveryForm bookingId={bookingId} />
					</div>
				)}

				<div className="mt-4">
					<DeliveryHistory
						deliveries={deliveries}
						bookingStatus={bookingStatus}
						userRole={userRole}
						revisionsUsed={revisionsUsed}
						maxRevisions={maxRevisions}
					/>
				</div>
			</div>
		</>
	)
}

export async function DisputeSectionWrapper({
	bookingId,
	bookingStatus,
	dispute,
}: {
	bookingId: string
	bookingStatus: string
	dispute: Awaited<ReturnType<typeof getDisputeForBooking>>
}) {
	const td = await getTranslations('disputes')

	return (
		<>
			<Separator className="my-6" />
			<div>
				<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
					{td('title')}
				</h3>
				<div className="mt-3">
					<DisputeSection
						bookingId={bookingId}
						bookingStatus={bookingStatus}
						dispute={dispute}
					/>
				</div>
			</div>
		</>
	)
}

export async function ReviewSectionWrapper({
	bookingId,
	updatedAt,
	userId,
}: {
	bookingId: string
	updatedAt: string
	userId: string
}) {
	const reviews = await getBookingReviews(bookingId)
	const hasReviewed = reviews.some((r) => r.reviewer?.id === userId)
	const tr = await getTranslations('reviews')

	return (
		<>
			<Separator className="my-6" />
			<div>
				<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
					{tr('title')}
				</h3>
				<div className="mt-3">
					<ReviewSection
						bookingId={bookingId}
						existingReviews={reviews}
						hasReviewed={hasReviewed}
						completedAt={updatedAt}
					/>
				</div>
			</div>
		</>
	)
}
