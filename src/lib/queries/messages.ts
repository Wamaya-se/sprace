import 'server-only'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { participantOrFilter } from '@/lib/db/filters'

const uuidSchema = z.string().uuid()

export type ConversationListItem = {
	id: string
	booking_id: string | null
	last_message_at: string
	other_participant: {
		id: string
		full_name: string | null
		avatar_url: string | null
	}
	last_message: {
		content: string
		sender_id: string
		is_system: boolean
		created_at: string
	} | null
	unread_count: number
}

export async function getConversations(): Promise<ConversationListItem[]> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return []

	const { data, error } = await supabase.rpc(
		'get_user_conversations_with_last_message',
	)

	if (error || !data) {
		console.error('[getConversations]', error)
		return []
	}

	return data.map((row) => ({
		id: row.id,
		booking_id: row.booking_id,
		last_message_at: row.last_message_at,
		other_participant: {
			id: row.other_participant_id ?? '',
			full_name: row.other_participant_full_name,
			avatar_url: row.other_participant_avatar_url,
		},
		last_message:
			row.last_message_content !== null &&
			row.last_message_sender_id !== null &&
			row.last_message_created_at !== null
				? {
						content: row.last_message_content,
						sender_id: row.last_message_sender_id,
						is_system: row.last_message_is_system ?? false,
						created_at: row.last_message_created_at,
					}
				: null,
		unread_count: Number(row.unread_count ?? 0),
	}))
}

export type MessageItem = {
	id: string
	content: string
	sender_id: string
	is_system: boolean
	read_at: string | null
	created_at: string
}

export async function getMessages(
	conversationId: string,
): Promise<MessageItem[]> {
	const parsed = uuidSchema.safeParse(conversationId)
	if (!parsed.success) return []

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return []

	const { data, error } = await supabase
		.from('messages')
		.select('id, content, sender_id, is_system, read_at, created_at')
		.eq('conversation_id', parsed.data)
		.order('created_at', { ascending: true })

	if (error) return []

	return data ?? []
}

export async function getUnreadCount(): Promise<number> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return 0

	const { data: conversations } = await supabase
		.from('conversations')
		.select('id')
		.or(participantOrFilter(user.id))

	if (!conversations || conversations.length === 0) return 0

	const conversationIds = conversations.map((c) => c.id)

	const { count } = await supabase
		.from('messages')
		.select('id', { count: 'exact', head: true })
		.in('conversation_id', conversationIds)
		.neq('sender_id', user.id)
		.is('read_at', null)

	return count ?? 0
}
