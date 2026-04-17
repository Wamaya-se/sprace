'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import * as notificationsQuery from '@/lib/queries/notifications'
import type { NotificationItem as QueryNotificationItem } from '@/lib/queries/notifications'
import type { ActionResult } from '@/types/actions'

export type NotificationItem = QueryNotificationItem

const notificationIdSchema = z.string().uuid()

export async function getNotifications(
	cursor?: string,
	unreadOnly = false,
): Promise<{
	items: QueryNotificationItem[]
	nextCursor: string | null
}> {
	return notificationsQuery.getNotifications(cursor, unreadOnly)
}

export async function markNotificationRead(
	notificationId: string,
): Promise<ActionResult> {
	const parsed = notificationIdSchema.safeParse(notificationId)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidNotificationId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const { error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('id', parsed.data)
		.eq('user_id', user.id)

	if (error) {
		console.error('[markNotificationRead]', error)
		return { success: false, error: 'errors.couldNotMarkNotification' }
	}

	revalidatePath('/dashboard/notifications')
	return { success: true, data: undefined }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const { error } = await supabase
		.from('notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('user_id', user.id)
		.is('read_at', null)

	if (error) {
		console.error('[markAllNotificationsRead]', error)
		return { success: false, error: 'errors.couldNotMarkNotifications' }
	}

	revalidatePath('/dashboard/notifications')
	return { success: true, data: undefined }
}
