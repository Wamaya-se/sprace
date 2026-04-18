'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'
import type { ActionResult } from '@/types/actions'
import type { Database } from '@/types/supabase'

const bookingIdSchema = z.string().uuid()
const disputeIdSchema = z.string().uuid()
const reasonSchema = z.string().min(10).max(2000).trim()

export async function openDispute(
	bookingId: string,
	reason: string,
): Promise<ActionResult<{ id: string }>> {
	const parsedBookingId = bookingIdSchema.safeParse(bookingId)
	if (!parsedBookingId.success) {
		return { success: false, error: 'errors.invalidBookingId' }
	}

	const parsedReason = reasonSchema.safeParse(reason)
	if (!parsedReason.success) {
		return {
			success: false,
			error: 'errors.disputeReasonRequired',
			field: 'reason',
		}
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) redirect('/login')

	const role = user.app_metadata?.role as string
	if (role !== 'business' && role !== 'creator') {
		return { success: false, error: 'errors.notAuthorized' }
	}

	const { data: booking } = await supabase
		.from('bookings')
		.select(
			`id, status, title, business_id, creator_id,
			business:businesses!bookings_business_id_fkey(profile_id),
			creator:creators!bookings_creator_id_fkey(profile_id)`,
		)
		.eq('id', parsedBookingId.data)
		.single()

	if (!booking) {
		return { success: false, error: 'errors.bookingNotFound' }
	}

	const business = booking.business as unknown as { profile_id: string } | null
	const creator = booking.creator as unknown as { profile_id: string } | null

	const isParticipant =
		(role === 'business' && business?.profile_id === user.id) ||
		(role === 'creator' && creator?.profile_id === user.id)

	if (!isParticipant) {
		return { success: false, error: 'errors.notAuthorized' }
	}

	if (!['in_progress', 'delivered'].includes(booking.status)) {
		return { success: false, error: 'errors.disputeOnlyForActive' }
	}

	const { data: existingDispute } = await supabase
		.from('disputes')
		.select('id')
		.eq('booking_id', parsedBookingId.data)
		.in('status', ['open', 'under_review'])
		.limit(1)
		.single()

	if (existingDispute) {
		return { success: false, error: 'errors.activeDisputeExists' }
	}

	const { data: dispute, error: insertError } = await supabase
		.from('disputes')
		.insert({
			booking_id: parsedBookingId.data,
			opened_by: user.id,
			reason: parsedReason.data,
			status: 'open',
		})
		.select('id')
		.single()

	if (insertError || !dispute) {
		if (insertError?.code === '23505') {
			return { success: false, error: 'errors.activeDisputeExists' }
		}
		console.error('[openDispute]', insertError)
		return { success: false, error: 'errors.couldNotOpenDispute' }
	}

	const { error: statusError } = await supabase
		.from('bookings')
		.update({ status: 'disputed' })
		.eq('id', parsedBookingId.data)

	if (statusError) {
		console.error('[openDispute] status update failed', statusError)
	}

	const t = await getTranslations('bookings')
	const { data: conversation } = await supabase
		.from('conversations')
		.select('id')
		.eq('booking_id', parsedBookingId.data)
		.single()

	if (conversation) {
		await supabase
			.from('messages')
			.insert({
				conversation_id: conversation.id,
				sender_id: user.id,
				content: t('systemDisputeOpened'),
				is_system: true,
			})
			.then(() =>
				supabase
					.from('conversations')
					.update({ last_message_at: new Date().toISOString() })
					.eq('id', conversation.id),
			)
	}

	const otherUserId =
		role === 'business' ? creator?.profile_id : business?.profile_id
	if (otherUserId) {
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await createNotification({
			userId: otherUserId,
			type: 'dispute_opened',
			title: nt('disputeOpened'),
			body: nt('disputeOpenedBody', { title: booking.title }),
			link: `/dashboard/bookings/${parsedBookingId.data}`,
		}).catch((err) => console.error('[openDispute] notification failed', err))
	}

	revalidatePath(`/dashboard/bookings/${parsedBookingId.data}`)
	revalidatePath('/dashboard/bookings')
	revalidatePath('/admin/disputes')
	return { success: true, data: { id: dispute.id } }
}

const resolveSchema = z.object({
	resolution: z.enum([
		'resolved_refund',
		'resolved_release',
		'resolved_partial',
		'dismissed',
	]),
	adminNote: z.string().max(2000).trim().optional(),
})

export async function resolveDispute(
	disputeId: string,
	resolution: string,
	adminNote?: string,
): Promise<ActionResult> {
	const parsedId = disputeIdSchema.safeParse(disputeId)
	if (!parsedId.success) {
		return { success: false, error: 'errors.invalidDisputeId' }
	}

	const parsed = resolveSchema.safeParse({ resolution, adminNote })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidResolution' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) redirect('/login')

	if (user.app_metadata?.role !== 'admin') {
		return { success: false, error: 'errors.onlyAdminCanResolve' }
	}

	const { data: dispute } = await supabase
		.from('disputes')
		.select(
			`id, status, booking_id, opened_by,
			booking:bookings!disputes_booking_id_fkey(
				id, title, status,
				business:businesses!bookings_business_id_fkey(profile_id),
				creator:creators!bookings_creator_id_fkey(profile_id)
			)`,
		)
		.eq('id', parsedId.data)
		.single()

	if (!dispute) {
		return { success: false, error: 'errors.disputeNotFound' }
	}

	if (!['open', 'under_review'].includes(dispute.status)) {
		return { success: false, error: 'errors.disputeAlreadyResolved' }
	}

	const { error: updateError } = await supabase
		.from('disputes')
		.update({
			status: parsed.data.resolution,
			admin_note: parsed.data.adminNote ?? null,
			resolved_by: user.id,
			resolved_at: new Date().toISOString(),
		})
		.eq('id', parsedId.data)

	if (updateError) {
		console.error('[resolveDispute]', updateError)
		return { success: false, error: 'errors.couldNotResolveDispute' }
	}

	const booking = dispute.booking as unknown as {
		id: string
		title: string
		status: string
		business: { profile_id: string } | null
		creator: { profile_id: string } | null
	}

	let newBookingStatus: Database['public']['Enums']['booking_status'] | null =
		null
	if (parsed.data.resolution === 'resolved_refund') {
		newBookingStatus = 'cancelled'
		const { refundPayment } = await import('@/lib/actions/stripe')
		await refundPayment(booking.id).catch((err) =>
			console.error('[resolveDispute] refund failed', err),
		)
	} else if (parsed.data.resolution === 'resolved_release') {
		newBookingStatus = 'completed'
		const { processPayoutForBooking } = await import('@/lib/actions/stripe')
		await processPayoutForBooking(booking.id).catch((err) =>
			console.error('[resolveDispute] payout failed', err),
		)
	} else if (parsed.data.resolution === 'resolved_partial') {
		newBookingStatus = 'completed'
	} else if (parsed.data.resolution === 'dismissed') {
		newBookingStatus = 'in_progress'
	}

	if (newBookingStatus) {
		await supabase
			.from('bookings')
			.update({ status: newBookingStatus })
			.eq('id', booking.id)
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
				content: t('systemDisputeResolved'),
				is_system: true,
			})
			.then(() =>
				supabase
					.from('conversations')
					.update({ last_message_at: new Date().toISOString() })
					.eq('id', conversation.id),
			)
	}

	const nt = await getTranslations('notifications')
	const { createNotification } = await import('@/lib/notifications')
	const notifyUsers = [
		booking.business?.profile_id,
		booking.creator?.profile_id,
	].filter(Boolean) as string[]

	await Promise.all(
		notifyUsers.map((userId) =>
			createNotification({
				userId,
				type: 'dispute_resolved',
				title: nt('disputeResolved'),
				body: nt('disputeResolvedBody', { title: booking.title }),
				link: `/dashboard/bookings/${booking.id}`,
			}),
		),
	).catch((err) => console.error('[resolveDispute] notifications failed', err))

	await logAuditEvent({
		actorId: user.id,
		action: 'dispute.resolved',
		targetType: 'dispute',
		targetId: parsedId.data,
		metadata: {
			bookingId: booking.id,
			resolution: parsed.data.resolution,
			note: parsed.data.adminNote ?? null,
		},
	})

	revalidatePath(`/dashboard/bookings/${booking.id}`)
	revalidatePath('/dashboard/bookings')
	revalidatePath('/admin/disputes')
	return { success: true, data: undefined }
}

export type { DisputeListItem, DisputeDetail } from '@/lib/queries/disputes'
