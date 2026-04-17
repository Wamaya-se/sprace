import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getBooking } from '@/lib/queries/bookings'
import { getDeliveries } from '@/lib/queries/deliveries'
import { markAsRead, startConversation } from '@/lib/actions/messages'
import { getMessages } from '@/lib/queries/messages'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookingActions } from '@/components/dashboard/booking-actions'
import { MessageThread } from '@/components/dashboard/message-thread'
import { PaymentCard } from '@/components/dashboard/payment-card'
import { ReportDialog } from '@/components/shared/report-dialog'
import { getDisputeForBooking } from '@/lib/queries/disputes'
import {
	DeliverySectionWrapper,
	DisputeSectionWrapper,
	ReviewSectionWrapper,
} from './section-wrappers'

interface PageProps {
	params: Promise<{ id: string }>
	searchParams: Promise<{ payment?: string }>
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params
	const booking = await getBooking(id)
	const t = await getTranslations('metadata')

	if (!booking) {
		return { title: t('bookingsTitle') }
	}

	return {
		title: t('bookingDetailTitle', { title: booking.title }),
	}
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
	pending: 'outline',
	awaiting_payment: 'outline',
	accepted: 'secondary',
	in_progress: 'default',
	delivered: 'default',
	completed: 'secondary',
	declined: 'outline',
	cancelled: 'outline',
	disputed: 'default',
}

export default async function BookingDetailPage({
	params,
	searchParams,
}: PageProps) {
	const { id } = await params
	const { payment: paymentStatus } = await searchParams
	const booking = await getBooking(id)
	const t = await getTranslations('bookings')
	const tm = await getTranslations('messages')
	const ts = await getTranslations('stripe')

	if (!booking) {
		redirect('/dashboard/bookings')
	}

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/login')
	const role = (user.app_metadata?.role as string) ?? 'creator'

	const counterpartName =
		role === 'business'
			? booking.creator?.display_name
			: booking.business?.company_name

	const otherProfileId =
		role === 'business'
			? booking.creator?.profile_id
			: booking.business?.profile_id

	const showDeliverySection = [
		'in_progress',
		'delivered',
		'completed',
		'disputed',
	].includes(booking.status)
	const showDeliveryForm =
		role === 'creator' && booking.status === 'in_progress'
	const showDisputeSection = ['in_progress', 'delivered', 'disputed'].includes(
		booking.status,
	)

	const conversationPromise = (async () => {
		if (!otherProfileId) {
			return {
				conversationId: null as string | null,
				messages: [] as Awaited<ReturnType<typeof getMessages>>,
			}
		}
		const convResult = await startConversation(otherProfileId, booking.id)
		if (!convResult.success) {
			return {
				conversationId: null as string | null,
				messages: [] as Awaited<ReturnType<typeof getMessages>>,
			}
		}
		const cid = convResult.data.conversationId
		const [, messages] = await Promise.all([markAsRead(cid), getMessages(cid)])
		return { conversationId: cid as string | null, messages }
	})()

	const [deliveries, dispute, conversation] = await Promise.all([
		showDeliverySection
			? getDeliveries(booking.id)
			: Promise.resolve([] as Awaited<ReturnType<typeof getDeliveries>>),
		showDisputeSection
			? getDisputeForBooking(booking.id)
			: Promise.resolve(
					null as Awaited<ReturnType<typeof getDisputeForBooking>>,
				),
		conversationPromise,
	])

	const conversationId = conversation.conversationId
	const conversationMessages = conversation.messages

	const statusKey =
		`status${booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as never

	return (
		<div className="mx-auto max-w-3xl">
			{/* Back link */}
			<Link
				href="/dashboard/bookings"
				className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-foreground/70"
			>
				<svg
					className="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
					/>
				</svg>
				{t('backToBookings')}
			</Link>

			{/* Payment status feedback */}
			{paymentStatus === 'success' && (
				<Card className="mt-4 border-brand/20 bg-brand/5">
					<CardContent className="py-3">
						<p className="font-sans text-sm font-medium text-foreground">
							{ts('paymentSuccess')}
						</p>
						<p className="mt-0.5 font-sans text-sm text-muted-foreground">
							{ts('paymentSuccessDescription')}
						</p>
					</CardContent>
				</Card>
			)}
			{paymentStatus === 'cancelled' && (
				<Card className="mt-4 border-outline-variant/20">
					<CardContent className="py-3">
						<p className="font-sans text-sm font-medium text-foreground">
							{ts('paymentCancelled')}
						</p>
						<p className="mt-0.5 font-sans text-sm text-muted-foreground">
							{ts('paymentCancelledDescription')}
						</p>
					</CardContent>
				</Card>
			)}

			{/* Header */}
			<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex items-center gap-3">
						<h2 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground lg:text-2xl">
							{booking.title}
						</h2>
						<Badge variant={statusVariants[booking.status] ?? 'outline'}>
							{t(statusKey)}
						</Badge>
					</div>
					<p className="mt-1 font-sans text-sm text-muted-foreground">
						{role === 'business'
							? t('sentTo', { name: counterpartName ?? '' })
							: t('sentBy', { name: counterpartName ?? '' })}
						{' · '}
						{t('createdAt', {
							date: new Date(booking.created_at).toLocaleDateString(undefined, {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
							}),
						})}
					</p>
				</div>

				<ReportDialog targetType="booking" targetId={booking.id} />
			</div>

			{/* Contextual status banners */}
			{booking.status === 'awaiting_payment' && role === 'creator' && (
				<Card className="mt-4 border-outline-variant/20">
					<CardContent className="py-3">
						<p className="font-sans text-sm font-medium text-foreground">
							{t('creatorAwaitingPaymentTitle')}
						</p>
						<p className="mt-0.5 font-sans text-sm text-muted-foreground">
							{t('creatorAwaitingPaymentDescription')}
						</p>
					</CardContent>
				</Card>
			)}
			{booking.status === 'awaiting_payment' && role === 'business' && (
				<Card className="mt-4 border-brand/20 bg-brand/5">
					<CardContent className="py-3">
						<p className="font-sans text-sm font-medium text-foreground">
							{ts('paymentRequired')}
						</p>
						<p className="mt-0.5 font-sans text-sm text-muted-foreground">
							{ts('paymentRequiredDescription')}
						</p>
					</CardContent>
				</Card>
			)}

			{/* Actions */}
			<div className="mt-6">
				<BookingActions
					bookingId={booking.id}
					status={booking.status}
					userRole={role}
				/>
			</div>

			<Separator className="my-6" />

			{/* Brief content */}
			<div>
				<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
					{t('briefSection')}
				</h3>
				<Card className="mt-3">
					<CardContent className="py-4">
						<p className="whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
							{booking.description}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Meta info */}
			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				{booking.budget && (
					<Card>
						<CardContent className="py-3">
							<span className="font-sans text-xs text-muted-foreground">
								{t('budget')}
							</span>
							<p className="mt-0.5 font-sans text-sm font-medium text-foreground">
								{t('budgetFormatted', {
									amount: booking.budget.toLocaleString(),
								})}
							</p>
						</CardContent>
					</Card>
				)}
				{booking.deadline && (
					<Card>
						<CardContent className="py-3">
							<span className="font-sans text-xs text-muted-foreground">
								{t('deadline')}
							</span>
							<p className="mt-0.5 font-sans text-sm font-medium text-foreground">
								{new Date(booking.deadline).toLocaleDateString(undefined, {
									month: 'long',
									day: 'numeric',
									year: 'numeric',
								})}
							</p>
						</CardContent>
					</Card>
				)}
				{booking.service && (
					<Card>
						<CardContent className="py-3">
							<span className="font-sans text-xs text-muted-foreground">
								{t('service')}
							</span>
							<p className="mt-0.5 font-sans text-sm font-medium text-foreground">
								{t('serviceFormatted', {
									name: booking.service.name,
									price: booking.service.price.toLocaleString(),
								})}
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Payment section */}
			<PaymentCard
				bookingId={booking.id}
				bookingStatus={booking.status}
				userRole={role}
			/>

			{/* Delivery section */}
			{showDeliverySection && (
				<DeliverySectionWrapper
					deliveries={deliveries}
					bookingId={booking.id}
					bookingStatus={booking.status}
					userRole={role}
					revisionsUsed={booking.revision_count}
					maxRevisions={booking.max_revisions}
					showForm={showDeliveryForm}
				/>
			)}

			{/* Dispute section */}
			{showDisputeSection && (
				<DisputeSectionWrapper
					bookingId={booking.id}
					bookingStatus={booking.status}
					dispute={dispute}
				/>
			)}

			{/* Reviews section (completed bookings only) */}
			{booking.status === 'completed' && (
				<ReviewSectionWrapper
					bookingId={booking.id}
					updatedAt={booking.updated_at}
					userId={user.id}
				/>
			)}

			{/* Embedded message thread */}
			{conversationId && (
				<>
					<Separator className="my-6" />
					<div>
						<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
							{tm('title')}
						</h3>
						<div className="mt-3">
							<MessageThread
								conversationId={conversationId}
								currentUserId={user.id}
								initialMessages={conversationMessages}
								otherParticipantName={counterpartName ?? tm('unknownUser')}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	)
}
