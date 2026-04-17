import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type NotificationItem = {
	id: string
	type: string
	title: string
	body: string
	link: string | null
	read_at: string | null
	created_at: string
}

const PAGE_SIZE = 20

export async function getNotifications(
	cursor?: string,
	unreadOnly = false,
): Promise<{ items: NotificationItem[]; nextCursor: string | null }> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return { items: [], nextCursor: null }

	let query = supabase
		.from('notifications')
		.select('id, type, title, body, link, read_at, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(PAGE_SIZE + 1)

	if (unreadOnly) {
		query = query.is('read_at', null)
	}

	if (cursor) {
		query = query.lt('created_at', cursor)
	}

	const { data } = await query
	const items = data ?? []
	const hasMore = items.length > PAGE_SIZE
	const page = hasMore ? items.slice(0, PAGE_SIZE) : items
	const nextCursor = hasMore ? page[page.length - 1].created_at : null

	return { items: page, nextCursor }
}
