import 'server-only'

import type { Database } from '@/types/supabase'
import { createServiceClient } from '@/lib/supabase/service'

type NotificationType = Database['public']['Enums']['notification_type']

interface CreateNotificationParams {
	userId: string
	type: NotificationType
	title: string
	body: string
	link?: string
}

const DEBOUNCE_TYPES: Set<NotificationType> = new Set(['new_message'])
const DEBOUNCE_WINDOW_MS = 5 * 60 * 1000

export async function createNotification({
	userId,
	type,
	title,
	body,
	link,
}: CreateNotificationParams) {
	// Notifications have RLS policies that are SELECT/UPDATE-only for users.
	// INSERT is always driven by server-side business logic (bookings,
	// payments, webhooks) so we use the service-role client to bypass RLS
	// safely. Authorisation is implicit: we only call this function from
	// trusted server-side code that has already validated who should be
	// notified.
	const supabase = createServiceClient()

	if (DEBOUNCE_TYPES.has(type)) {
		const cutoff = new Date(Date.now() - DEBOUNCE_WINDOW_MS).toISOString()
		const { count } = await supabase
			.from('notifications')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('type', type)
			.is('read_at', null)
			.gte('created_at', cutoff)

		if (count && count > 0) {
			return
		}
	}

	const { error } = await supabase.from('notifications').insert({
		user_id: userId,
		type,
		title,
		body,
		link: link ?? null,
	})

	if (error) {
		console.error('[createNotification]', error)
		return
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('email, email_notifications')
		.eq('id', userId)
		.single()

	if (profile?.email_notifications && profile.email) {
		const { getTranslations } = await import('next-intl/server')
		const { sendEmail, buildNotificationEmail } = await import('@/lib/email')
		const t = await getTranslations('notifications')
		const html = buildNotificationEmail(title, body, link, t('viewDetails'))
		await sendEmail({
			to: profile.email,
			subject: title,
			html,
		})
	}
}

export async function getUnreadNotificationCount(): Promise<number> {
	const { createClient } = await import('@/lib/supabase/server')
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return 0

	const { count } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.is('read_at', null)

	return count ?? 0
}
