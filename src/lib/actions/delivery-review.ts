'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const deliveryIdSchema = z.string().uuid()
const revisionCommentSchema = z.string().min(1).max(2000).trim()

export async function approveDelivery(
	deliveryId: string,
): Promise<ActionResult> {
	const parsedId = deliveryIdSchema.safeParse(deliveryId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidDeliveryId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) redirect('/login')

	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.onlyBusinessCanApprove' }
	}

	const { data: delivery } = await supabase
		.from('booking_deliveries')
		.select(
			`id, status, booking_id,
			booking:bookings!booking_deliveries_booking_id_fkey(
				id, status, title, business_id, creator_id,
				business:businesses!bookings_business_id_fkey(profile_id),
				creator:creators!bookings_creator_id_fkey(profile_id)
			)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!delivery) {
		return { success: false, error: 'errors.deliveryNotFound' }
	}

	if (delivery.status !== 'submitted') {
		return { success: false, error: 'errors.deliveryAlreadyReviewed' }
	}

	const booking = delivery.booking as unknown as {
		id: string
		status: string
		title: string
		business_id: string
		creator_id: string
		business: { profile_id: string } | null
		creator: { profile_id: string } | null
	}

	if (booking.business?.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	if (booking.status !== 'delivered') {
		return { success: false, error: 'errors.bookingNotInDeliveredState' }
	}

	const { error: updateError } = await supabase
		.from('booking_deliveries')
		.update({
			status: 'approved',
			reviewed_by: user.id,
			reviewed_at: new Date().toISOString(),
		})
		.eq('id', parsedId.data)

	if (updateError) {
		console.error('[approveDelivery]', updateError)
		return { success: false, error: 'errors.couldNotApproveDelivery' }
	}

	const { error: statusError } = await supabase
		.from('bookings')
		.update({ status: 'completed' })
		.eq('id', booking.id)

	if (statusError) {
		console.error('[approveDelivery] status update failed', statusError)
		return { success: false, error: 'errors.couldNotCompleteBooking' }
	}

	const { processPayoutForBooking } = await import('@/lib/actions/stripe')
	await processPayoutForBooking(booking.id).catch((err) =>
		console.error('[approveDelivery] payout failed', err),
	)

	const t = await getTranslations('bookings')
	const { data: conversation } = await supabase
		.from('conversations')
		.select('id')
		.eq('booking_id', booking.id)
		.single()

	if (conversation) {
		await supabase
			.from('messages')
			.insert({
				conversation_id: conversation.id,
				sender_id: user.id,
				content: t('systemDeliveryApproved'),
				is_system: true,
			})
			.then(() =>
				supabase
					.from('conversations')
					.update({ last_message_at: new Date().toISOString() })
					.eq('id', conversation.id),
			)
	}

	if (booking.creator?.profile_id) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await Promise.all([
			createNotification({
				userId: booking.creator.profile_id,
				type: 'delivery_approved',
				title: nt('deliveryApproved'),
				body: nt('deliveryApprovedBody', { title: booking.title }),
				link: `/dashboard/bookings/${booking.id}`,
			}),
			createNotification({
				userId: booking.creator.profile_id,
				type: 'booking_completed',
				title: nt('bookingCompleted'),
				body: nt('bookingCompletedBody', { title: booking.title }),
				link: `/dashboard/bookings/${booking.id}`,
			}),
		]).catch((err) =>
			console.error('[approveDelivery] notification failed', err),
		)
	}

	revalidatePath(`/dashboard/bookings/${booking.id}`)
	revalidatePath('/dashboard/bookings')
	revalidatePath('/dashboard/messages')
	return { success: true, data: undefined }
}

export async function requestRevision(
	deliveryId: string,
	comment: string,
): Promise<ActionResult> {
	const parsedId = deliveryIdSchema.safeParse(deliveryId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidDeliveryId' }
	}

	const parsedComment = revisionCommentSchema.safeParse(comment)
	if (!parsedComment.success) {
		return {
			success: false,
			error: 'errors.revisionCommentRequired',
			field: 'revisionComment',
		}
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) redirect('/login')

	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.onlyBusinessCanRevision' }
	}

	const { data: delivery } = await supabase
		.from('booking_deliveries')
		.select(
			`id, status, booking_id,
			booking:bookings!booking_deliveries_booking_id_fkey(
				id, status, title, business_id, creator_id, revision_count, max_revisions,
				business:businesses!bookings_business_id_fkey(profile_id),
				creator:creators!bookings_creator_id_fkey(profile_id)
			)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!delivery) {
		return { success: false, error: 'errors.deliveryNotFound' }
	}

	if (delivery.status !== 'submitted') {
		return { success: false, error: 'errors.deliveryAlreadyReviewed' }
	}

	const booking = delivery.booking as unknown as {
		id: string
		status: string
		title: string
		business_id: string
		creator_id: string
		revision_count: number
		max_revisions: number
		business: { profile_id: string } | null
		creator: { profile_id: string } | null
	}

	if (booking.business?.profile_id !== user.id) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	if (booking.status !== 'delivered') {
		return { success: false, error: 'errors.bookingNotInDeliveredState' }
	}

	if (booking.revision_count >= booking.max_revisions) {
		return { success: false, error: 'errors.maxRevisionsReached' }
	}

	const { error: updateError } = await supabase
		.from('booking_deliveries')
		.update({
			status: 'revision_requested',
			revision_comment: parsedComment.data,
			reviewed_by: user.id,
			reviewed_at: new Date().toISOString(),
		})
		.eq('id', parsedId.data)

	if (updateError) {
		console.error('[requestRevision]', updateError)
		return { success: false, error: 'errors.couldNotRequestRevision' }
	}

	const newRevisionCount = booking.revision_count + 1
	const { error: statusError } = await supabase
		.from('bookings')
		.update({
			status: 'in_progress',
			revision_count: newRevisionCount,
		})
		.eq('id', booking.id)

	if (statusError) {
		console.error('[requestRevision] status update failed', statusError)
	}

	const t = await getTranslations('bookings')
	const { data: conversation } = await supabase
		.from('conversations')
		.select('id')
		.eq('booking_id', booking.id)
		.single()

	if (conversation) {
		await supabase
			.from('messages')
			.insert({
				conversation_id: conversation.id,
				sender_id: user.id,
				content: t('systemRevisionRequested'),
				is_system: true,
			})
			.then(() =>
				supabase
					.from('conversations')
					.update({ last_message_at: new Date().toISOString() })
					.eq('id', conversation.id),
			)
	}

	if (booking.creator?.profile_id) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await createNotification({
			userId: booking.creator.profile_id,
			type: 'revision_requested',
			title: nt('revisionRequested'),
			body: nt('revisionRequestedBody', { title: booking.title }),
			link: `/dashboard/bookings/${booking.id}`,
		}).catch((err) =>
			console.error('[requestRevision] notification failed', err),
		)
	}

	revalidatePath(`/dashboard/bookings/${booking.id}`)
	revalidatePath('/dashboard/bookings')
	revalidatePath('/dashboard/messages')
	return { success: true, data: undefined }
}
