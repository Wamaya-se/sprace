import 'server-only'

import { cache } from 'react'
import { requireAdmin } from '@/lib/auth/guards'
import type { Database } from '@/types/supabase'

export type BroadcastAudience =
	Database['public']['Enums']['broadcast_audience']
export type BroadcastStatus = Database['public']['Enums']['broadcast_status']

export interface BroadcastListItem {
	id: string
	title: string
	body: string
	audience: BroadcastAudience
	link: string | null
	status: BroadcastStatus
	sent_at: string | null
	recipients_count: number
	created_at: string
	updated_at: string
	author: {
		id: string
		full_name: string | null
		email: string | null
	} | null
}

export const listBroadcasts = cache(async (): Promise<BroadcastListItem[]> => {
	const { supabase } = await requireAdmin()

	const { data, error } = await supabase
		.from('admin_broadcasts')
		.select(
			`id, title, body, audience, link, status, sent_at, recipients_count,
			 created_at, updated_at,
			 author:profiles!admin_broadcasts_author_id_fkey(id, full_name, email)`,
		)
		.order('created_at', { ascending: false })

	if (error) {
		console.error('[listBroadcasts]', error)
		return []
	}

	return (data ?? []).map((row) => {
		const author = Array.isArray(row.author)
			? (row.author[0] ?? null)
			: (row.author ?? null)
		return {
			id: row.id,
			title: row.title,
			body: row.body,
			audience: row.audience,
			link: row.link,
			status: row.status,
			sent_at: row.sent_at,
			recipients_count: row.recipients_count,
			created_at: row.created_at,
			updated_at: row.updated_at,
			author: author
				? {
						id: author.id,
						full_name: author.full_name,
						email: author.email,
					}
				: null,
		}
	})
})
