'use client'

import { useRealtimeConversations } from '@/hooks/use-realtime-conversations'

interface RealtimeInboxProps {
	userId: string
}

export function RealtimeInbox({ userId }: RealtimeInboxProps) {
	useRealtimeConversations({ userId })
	return null
}
