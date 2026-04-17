'use client'

import { useEffect, useCallback, useState } from 'react'
import { useSupabase } from '@/hooks/use-supabase'
import type { MessageItem } from '@/lib/queries/messages'

interface UseRealtimeMessagesOptions {
	conversationId: string
	currentUserId: string
	initialMessages: MessageItem[]
}

export function useRealtimeMessages({
	conversationId,
	currentUserId,
	initialMessages,
}: UseRealtimeMessagesOptions) {
	const supabase = useSupabase()
	const [messages, setMessages] = useState<MessageItem[]>(initialMessages)

	useEffect(() => {
		setMessages(initialMessages)
	}, [initialMessages])

	const addOptimisticMessage = useCallback((msg: MessageItem) => {
		setMessages((prev) => [...prev, msg])
	}, [])

	const removeOptimisticMessage = useCallback((id: string) => {
		setMessages((prev) => prev.filter((m) => m.id !== id))
	}, [])

	useEffect(() => {
		const channel = supabase
			.channel(`messages:${conversationId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `conversation_id=eq.${conversationId}`,
				},
				(payload) => {
					const newMsg = payload.new as {
						id: string
						content: string
						sender_id: string
						is_system: boolean
						read_at: string | null
						created_at: string
					}

					if (newMsg.sender_id === currentUserId) return

					setMessages((prev) => {
						if (prev.some((m) => m.id === newMsg.id)) return prev
						return [
							...prev,
							{
								id: newMsg.id,
								content: newMsg.content,
								sender_id: newMsg.sender_id,
								is_system: newMsg.is_system,
								read_at: newMsg.read_at,
								created_at: newMsg.created_at,
							},
						]
					})
				},
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [supabase, conversationId, currentUserId])

	return { messages, addOptimisticMessage, removeOptimisticMessage }
}
