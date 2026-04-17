'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const uuidSchema = z.string().uuid()
const sendMessageSchema = z.object({
	conversationId: z.string().uuid(),
	content: z.string().min(1).max(5000).trim(),
})

export async function sendMessage(formData: FormData): Promise<ActionResult> {
	const raw = {
		conversationId: formData.get('conversationId'),
		content: formData.get('content'),
	}

	const parsed = sendMessageSchema.safeParse(raw)
	if (!parsed.success) {
		const issue = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: issue.path[0] as string,
		}
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const { error } = await supabase.from('messages').insert({
		conversation_id: parsed.data.conversationId,
		sender_id: user.id,
		content: parsed.data.content,
	})

	if (error) {
		console.error('[sendMessage]', error)
		return { success: false, error: 'errors.couldNotSendMessage' }
	}

	await supabase
		.from('conversations')
		.update({ last_message_at: new Date().toISOString() })
		.eq('id', parsed.data.conversationId)

	const { data: conv } = await supabase
		.from('conversations')
		.select('participant_one, participant_two')
		.eq('id', parsed.data.conversationId)
		.single()

	if (conv) {
		const recipientId =
			conv.participant_one === user.id
				? conv.participant_two
				: conv.participant_one
		const { data: senderProfile } = await supabase
			.from('profiles')
			.select('full_name')
			.eq('id', user.id)
			.single()
		const { getTranslations } = await import('next-intl/server')
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		await createNotification({
			userId: recipientId,
			type: 'new_message',
			title: nt('newMessage'),
			body: nt('newMessageBody', { name: senderProfile?.full_name ?? '' }),
			link: `/dashboard/messages/${parsed.data.conversationId}`,
		}).catch((err) => console.error('[sendMessage] notification failed', err))
	}

	revalidatePath('/dashboard/messages')
	revalidatePath(`/dashboard/messages/${parsed.data.conversationId}`)
	revalidatePath(`/dashboard/bookings`)
	return { success: true, data: undefined }
}

export async function markAsRead(conversationId: string): Promise<void> {
	const parsed = uuidSchema.safeParse(conversationId)
	if (!parsed.success) return

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return

	await supabase.rpc('mark_messages_read', {
		p_conversation_id: parsed.data,
	})
}

export async function startConversation(
	otherUserId: string,
	bookingId?: string,
): Promise<ActionResult<{ conversationId: string }>> {
	const parsedUser = uuidSchema.safeParse(otherUserId)
	if (!parsedUser.success) {
		return { success: false, error: 'errors.invalidUserId' }
	}

	if (bookingId) {
		const parsedBooking = uuidSchema.safeParse(bookingId)
		if (!parsedBooking.success) {
			return { success: false, error: 'errors.invalidBookingId' }
		}
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	if (bookingId) {
		const { data: booking } = await supabase
			.from('bookings')
			.select(
				`
				id,
				business:businesses!bookings_business_id_fkey(profile_id),
				creator:creators!bookings_creator_id_fkey(profile_id)
			`,
			)
			.eq('id', bookingId)
			.single()

		if (!booking) {
			return { success: false, error: 'errors.bookingNotFound' }
		}

		const biz = booking.business as unknown as { profile_id: string } | null
		const crt = booking.creator as unknown as { profile_id: string } | null
		const bookingParticipants = [biz?.profile_id, crt?.profile_id].filter(
			Boolean,
		)

		if (
			!bookingParticipants.includes(user.id) ||
			!bookingParticipants.includes(parsedUser.data)
		) {
			return { success: false, error: 'errors.notBookingParticipant' }
		}

		const { data: existing } = await supabase
			.from('conversations')
			.select('id')
			.eq('booking_id', bookingId)
			.single()

		if (existing) {
			return { success: true, data: { conversationId: existing.id } }
		}
	} else {
		const { data: existing } = await supabase
			.from('conversations')
			.select('id')
			.is('booking_id', null)
			.or(
				`and(participant_one.eq.${user.id},participant_two.eq.${parsedUser.data}),and(participant_one.eq.${parsedUser.data},participant_two.eq.${user.id})`,
			)
			.single()

		if (existing) {
			return { success: true, data: { conversationId: existing.id } }
		}
	}

	const { data: conversation, error } = await supabase
		.from('conversations')
		.insert({
			participant_one: user.id,
			participant_two: parsedUser.data,
			booking_id: bookingId ?? null,
		})
		.select('id')
		.single()

	if (error) {
		if (error.code === '23505') {
			const { data: existing } = await supabase
				.from('conversations')
				.select('id')
				.or(
					`and(participant_one.eq.${user.id},participant_two.eq.${parsedUser.data}),and(participant_one.eq.${parsedUser.data},participant_two.eq.${user.id})`,
				)
				.single()

			if (existing) {
				return { success: true, data: { conversationId: existing.id } }
			}
		}
		console.error('[startConversation]', error)
		return { success: false, error: 'errors.couldNotStartConversation' }
	}

	return { success: true, data: { conversationId: conversation.id } }
}
