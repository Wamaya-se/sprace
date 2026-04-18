'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
	statusTransitions,
	roleAllowedTransitions,
} from '@/lib/bookings/state-machine'
import type { ActionResult } from '@/types/actions'

const createBookingSchema = z.object({
	creatorId: z.string().uuid(),
	serviceId: z.string().uuid().optional(),
	title: z.string().min(1).max(200).trim(),
	description: z.string().min(1).max(5000).trim(),
	budget: z.coerce.number().positive().max(10_000_000).optional(),
	deadline: z.string().date().optional(),
})

const bookingIdSchema = z.string().uuid()

export async function createBooking(
	formData: FormData,
): Promise<ActionResult<{ id: string }>> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.onlyBusinessCanCreateBookings' }
	}

	const raw = {
		creatorId: formData.get('creatorId'),
		serviceId: formData.get('serviceId') || undefined,
		title: formData.get('title'),
		description: formData.get('description'),
		budget: formData.get('budget') || undefined,
		deadline: formData.get('deadline') || undefined,
	}

	const parsed = createBookingSchema.safeParse(raw)
	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue.path[0] as string,
		}
	}

	const { data: business } = await supabase
		.from('businesses')
		.select('id')
		.eq('profile_id', user.id)
		.single()

	if (!business) {
		return { success: false, error: 'errors.businessProfileNotFound' }
	}

	if (parsed.data.serviceId) {
		const { data: service } = await supabase
			.from('services')
			.select('id')
			.eq('id', parsed.data.serviceId)
			.eq('creator_id', parsed.data.creatorId)
			.eq('is_active', true)
			.single()

		if (!service) {
			return {
				success: false,
				error: 'errors.serviceNotFoundOrUnavailable',
				field: 'serviceId',
			}
		}
	}

	const { data: booking, error } = await supabase
		.from('bookings')
		.insert({
			business_id: business.id,
			creator_id: parsed.data.creatorId,
			service_id: parsed.data.serviceId ?? null,
			title: parsed.data.title,
			description: parsed.data.description,
			budget: parsed.data.budget ?? null,
			deadline: parsed.data.deadline ?? null,
		})
		.select('id')
		.single()

	if (error) {
		console.error('[createBooking]', error)
		return { success: false, error: 'errors.couldNotCreateBooking' }
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('profile_id')
		.eq('id', parsed.data.creatorId)
		.single()

	if (creator) {
		const { data: conversation, error: convError } = await supabase
			.from('conversations')
			.insert({
				booking_id: booking.id,
				participant_one: user.id,
				participant_two: creator.profile_id,
			})
			.select('id')
			.single()

		if (convError) {
			console.error('[createBooking] conversation creation failed', convError)
		} else if (conversation) {
			const t = await getTranslations('bookings')
			const { error: msgError } = await supabase.from('messages').insert({
				conversation_id: conversation.id,
				sender_id: user.id,
				content: t('systemBookingCreated', { title: parsed.data.title }),
				is_system: true,
			})
			if (msgError) {
				console.error(
					'[createBooking] system message creation failed',
					msgError,
				)
			}
		}
	} else {
		console.error(
			'[createBooking] creator profile not found for conversation',
			parsed.data.creatorId,
		)
	}

	if (creator) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await createNotification({
			userId: creator.profile_id,
			type: 'booking_created',
			title: nt('bookingCreated'),
			body: nt('bookingCreatedBody', { name: '', title: parsed.data.title }),
			link: `/dashboard/bookings/${booking.id}`,
		}).catch((err) => console.error('[createBooking] notification failed', err))
	}

	revalidatePath('/dashboard/bookings')
	revalidatePath('/dashboard/messages')
	return { success: true, data: { id: booking.id } }
}

const bookingStatusSchema = z.enum([
	'pending',
	'awaiting_payment',
	'accepted',
	'in_progress',
	'delivered',
	'completed',
	'declined',
	'cancelled',
	'disputed',
])

export async function updateBookingStatus(
	bookingId: string,
	newStatus: string,
): Promise<ActionResult> {
	const parsedId = bookingIdSchema.safeParse(bookingId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidBookingId' }
	}

	const parsedStatus = bookingStatusSchema.safeParse(newStatus)
	if (!parsedStatus.success) {
		return { success: false, error: 'errors.invalidStatus' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const role = user.app_metadata?.role as string

	const { data: booking, error: fetchError } = await supabase
		.from('bookings')
		.select(
			`id, status, title, business_id, creator_id, campaign_id,
			business:businesses!bookings_business_id_fkey(profile_id),
			creator:creators!bookings_creator_id_fkey(profile_id)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (fetchError || !booking) {
		return { success: false, error: 'errors.bookingNotFound' }
	}

	const validStatus = parsedStatus.data

	const transition = statusTransitions[booking.status]
	if (!transition || !transition.allowedNext.includes(validStatus)) {
		return { success: false, error: 'errors.invalidStatusTransition' }
	}

	if (role === 'business' && !roleAllowedTransitions.business[validStatus]) {
		return { success: false, error: 'errors.notAllowedForRole' }
	}
	if (role === 'creator' && !roleAllowedTransitions.creator[validStatus]) {
		return { success: false, error: 'errors.notAllowedForRole' }
	}

	if (validStatus === 'accepted' && booking.status === 'awaiting_payment') {
		const { data: payment } = await supabase
			.from('payments')
			.select('status')
			.eq('booking_id', parsedId.data)
			.eq('status', 'captured')
			.limit(1)
			.single()

		if (!payment) {
			return { success: false, error: 'errors.paymentMustBeCaptured' }
		}
	}

	const { error: updateError } = await supabase
		.from('bookings')
		.update({ status: validStatus })
		.eq('id', parsedId.data)

	if (updateError) {
		console.error('[updateBookingStatus]', updateError)
		return { success: false, error: 'errors.couldNotUpdateBooking' }
	}

	if (validStatus === 'completed') {
		const { processPayoutForBooking } = await import('@/lib/actions/stripe')
		await processPayoutForBooking(parsedId.data).catch((err) =>
			console.error('[updateBookingStatus] payout failed', err),
		)

		if (booking.campaign_id) {
			const { completeCampaignIfDone } = await import('@/lib/actions/campaigns')
			await completeCampaignIfDone(booking.campaign_id).catch((err) =>
				console.error('[updateBookingStatus] campaign auto-complete', err),
			)
		}
	}

	if (
		validStatus === 'cancelled' &&
		['awaiting_payment', 'accepted', 'in_progress'].includes(booking.status)
	) {
		const { refundPayment } = await import('@/lib/actions/stripe')
		await refundPayment(parsedId.data).catch((err) =>
			console.error('[updateBookingStatus] refund failed', err),
		)
	}

	const t = await getTranslations('bookings')
	const isRevision =
		validStatus === 'in_progress' && booking.status === 'delivered'
	const systemMessages: Record<string, string> = {
		awaiting_payment: t('systemAwaitingPayment'),
		accepted: t('systemBookingAccepted'),
		declined: t('systemBookingDeclined'),
		in_progress: isRevision
			? t('systemRevisionRequested')
			: t('systemWorkStarted'),
		delivered: t('systemDeliverables'),
		completed: t('systemBookingCompleted'),
		cancelled: t('systemBookingCancelled'),
	}

	const systemContent = systemMessages[validStatus]
	if (systemContent) {
		const { data: conversation } = await supabase
			.from('conversations')
			.select('id')
			.eq('booking_id', parsedId.data)
			.single()

		if (conversation) {
			await supabase.from('messages').insert({
				conversation_id: conversation.id,
				sender_id: user.id,
				content: systemContent,
				is_system: true,
			})

			await supabase
				.from('conversations')
				.update({ last_message_at: new Date().toISOString() })
				.eq('id', conversation.id)
		}
	}

	const biz = booking.business as unknown as { profile_id: string } | null
	const crt = booking.creator as unknown as { profile_id: string } | null
	const otherUserId = role === 'business' ? crt?.profile_id : biz?.profile_id

	if (otherUserId) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')

		const notifMap: Record<
			string,
			{
				type: Parameters<typeof createNotification>[0]['type']
				titleKey: string
				bodyKey: string
			}
		> = {
			awaiting_payment: {
				type: 'awaiting_payment',
				titleKey: 'awaitingPayment',
				bodyKey: 'awaitingPaymentBody',
			},
			accepted: {
				type: 'booking_accepted',
				titleKey: 'bookingAccepted',
				bodyKey: 'bookingAcceptedBody',
			},
			declined: {
				type: 'booking_declined',
				titleKey: 'bookingDeclined',
				bodyKey: 'bookingDeclinedBody',
			},
			in_progress: isRevision
				? {
						type: 'revision_requested',
						titleKey: 'revisionRequested',
						bodyKey: 'revisionRequestedBody',
					}
				: {
						type: 'work_started',
						titleKey: 'workStarted',
						bodyKey: 'workStartedBody',
					},
			delivered: {
				type: 'deliverables_submitted',
				titleKey: 'deliverablesSubmitted',
				bodyKey: 'deliverablesSubmittedBody',
			},
			completed: {
				type: 'booking_completed',
				titleKey: 'bookingCompleted',
				bodyKey: 'bookingCompletedBody',
			},
			cancelled: {
				type: 'booking_cancelled',
				titleKey: 'bookingCancelled',
				bodyKey: 'bookingCancelledBody',
			},
		}

		const notif = notifMap[validStatus]
		if (notif) {
			await createNotification({
				userId: otherUserId,
				type: notif.type,
				title: nt(notif.titleKey as Parameters<typeof nt>[0]),
				body: nt(
					notif.bodyKey as Parameters<typeof nt>[0],
					{ title: booking.title } as never,
				),
				link: `/dashboard/bookings/${parsedId.data}`,
			}).catch((err) =>
				console.error('[updateBookingStatus] notification failed', err),
			)
		}
	}

	revalidatePath('/dashboard/bookings')
	revalidatePath(`/dashboard/bookings/${parsedId.data}`)
	revalidatePath('/dashboard/messages')
	return { success: true, data: undefined }
}
