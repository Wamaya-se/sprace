'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/use-supabase'

interface UseRealtimeUnreadMessagesOptions {
	userId: string
	initialCount: number
}

export function useRealtimeUnreadMessages({
	userId,
	initialCount,
}: UseRealtimeUnreadMessagesOptions) {
	const supabase = useSupabase()
	const [unreadCount, setUnreadCount] = useState(initialCount)

	useEffect(() => {
		setUnreadCount(initialCount)
	}, [initialCount])

	useEffect(() => {
		if (!userId) return

		const channel = supabase
			.channel(`unread-messages:${userId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
				},
				(payload) => {
					const msg = payload.new as { sender_id: string }
					if (msg.sender_id !== userId) {
						setUnreadCount((prev) => prev + 1)
					}
				},
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'messages',
				},
				(payload) => {
					const updated = payload.new as {
						read_at: string | null
						sender_id: string
					}
					const old = payload.old as { read_at: string | null }
					if (updated.sender_id !== userId && !old.read_at && updated.read_at) {
						setUnreadCount((prev) => Math.max(0, prev - 1))
					}
				},
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [supabase, userId])

	return unreadCount
}
