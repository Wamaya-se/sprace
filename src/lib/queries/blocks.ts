import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'

export const getBlockedProfileIds = cache(
	async function getBlockedProfileIds(): Promise<string[]> {
		const user = await getCurrentUser()
		if (!user) return []

		const supabase = await createClient()
		const { data } = await supabase
			.from('user_blocks')
			.select('blocked_id')
			.eq('blocker_id', user.id)

		return (data ?? []).map((row) => row.blocked_id)
	},
)

export const isBlockedByCurrentUser = cache(
	async function isBlockedByCurrentUser(profileId: string): Promise<boolean> {
		const ids = await getBlockedProfileIds()
		return ids.includes(profileId)
	},
)
