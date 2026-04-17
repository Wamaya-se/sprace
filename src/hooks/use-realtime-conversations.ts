'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/hooks/use-supabase'

interface UseRealtimeConversationsOptions {
	userId: string
}

export function useRealtimeConversations({
	userId,
}: UseRealtimeConversationsOptions) {
	const supabase = useSupabase()
	const router = useRouter()

	const refresh = useCallback(() => {
		router.refresh()
	}, [router])

	useEffect(() => {
		if (!userId) return

		const channel = supabase
			.channel(`conversations:${userId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'conversations',
				},
				(payload) => {
					const row = (payload.new ?? payload.old) as {
						participant_one?: string
						participant_two?: string
					} | null

					if (
						row &&
						(row.participant_one === userId || row.participant_two === userId)
					) {
						refresh()
					}
				},
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [supabase, userId, refresh])
}
