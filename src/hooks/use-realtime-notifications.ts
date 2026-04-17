'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/use-supabase'

interface UseRealtimeNotificationsOptions {
	userId: string
	initialCount: number
}

export function useRealtimeNotifications({
	userId,
	initialCount,
}: UseRealtimeNotificationsOptions) {
	const supabase = useSupabase()
	const [unreadCount, setUnreadCount] = useState(initialCount)

	useEffect(() => {
		setUnreadCount(initialCount)
	}, [initialCount])

	useEffect(() => {
		if (!userId) return

		const channel = supabase
			.channel(`notifications:${userId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${userId}`,
				},
				() => {
					setUnreadCount((prev) => prev + 1)
				},
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${userId}`,
				},
				(payload) => {
					const updated = payload.new as { read_at: string | null }
					const old = payload.old as { read_at: string | null }
					if (!old.read_at && updated.read_at) {
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
