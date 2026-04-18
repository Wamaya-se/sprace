'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'
import { createServiceClient } from '@/lib/supabase/service'
import { logAuditEvent } from '@/lib/audit/log'
import {
	createBroadcastSchema,
	sendBroadcastSchema,
} from '@/lib/validation/admin'
import type { ActionResult } from '@/types/actions'

const CHUNK_SIZE = 200

function formDataRecord(formData: FormData): Record<string, unknown> {
	const raw: Record<string, unknown> = {}
	for (const [key, value] of formData.entries()) {
		raw[key] = typeof value === 'string' ? value : value
	}
	return raw
}

export async function createBroadcast(
	formData: FormData,
): Promise<ActionResult<{ id: string }>> {
	const { user, supabase } = await requireAdmin()

	const parsed = createBroadcastSchema.safeParse(formDataRecord(formData))
	if (!parsed.success) {
		const field = parsed.error.issues[0]?.path[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			...(typeof field === 'string' ? { field } : {}),
		}
	}

	const { data, error } = await supabase
		.from('admin_broadcasts')
		.insert({
			author_id: user.id,
			title: parsed.data.title,
			body: parsed.data.body,
			audience: parsed.data.audience,
			link: parsed.data.link ?? null,
			status: 'draft',
		})
		.select('id')
		.single()

	if (error || !data) {
		console.error('[createBroadcast]', error)
		return { success: false, error: 'errors.couldNotCreateBroadcast' }
	}

	revalidatePath('/admin/broadcasts')
	return { success: true, data: { id: data.id } }
}

export async function deleteBroadcast(
	broadcastId: string,
): Promise<ActionResult> {
	const { supabase } = await requireAdmin()

	if (!z.string().uuid().safeParse(broadcastId).success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const { data: existing } = await supabase
		.from('admin_broadcasts')
		.select('id, status')
		.eq('id', broadcastId)
		.single()

	if (!existing) {
		return { success: false, error: 'errors.broadcastNotFound' }
	}

	if (existing.status === 'sent') {
		return { success: false, error: 'errors.broadcastAlreadySent' }
	}

	const { error } = await supabase
		.from('admin_broadcasts')
		.delete()
		.eq('id', broadcastId)

	if (error) {
		console.error('[deleteBroadcast]', error)
		return { success: false, error: 'errors.couldNotDeleteBroadcast' }
	}

	revalidatePath('/admin/broadcasts')
	return { success: true, data: undefined }
}

export async function sendBroadcast(
	broadcastId: string,
): Promise<ActionResult<{ recipients: number }>> {
	const { user, supabase } = await requireAdmin()

	const parsed = sendBroadcastSchema.safeParse({ broadcastId })
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	const { data: broadcast, error: readError } = await supabase
		.from('admin_broadcasts')
		.select('id, title, body, audience, link, status, author_id')
		.eq('id', parsed.data.broadcastId)
		.single()

	if (readError || !broadcast) {
		return { success: false, error: 'errors.broadcastNotFound' }
	}

	if (broadcast.status === 'sent') {
		return { success: false, error: 'errors.broadcastAlreadySent' }
	}

	// Fetch recipient IDs via service role so we can reach across
	// everyone regardless of role. RLS on `profiles` permits admins
	// via `is_admin()`, but using the service client keeps this path
	// consistent with the notification insert below.
	const service = createServiceClient()
	let query = service.from('profiles').select('id').eq('is_suspended', false)

	if (broadcast.audience === 'creators') {
		query = query.eq('role', 'creator')
	} else if (broadcast.audience === 'businesses') {
		query = query.eq('role', 'business')
	}

	const { data: recipients, error: recipientsError } = await query

	if (recipientsError) {
		console.error('[sendBroadcast] recipients', recipientsError)
		return { success: false, error: 'errors.couldNotSendBroadcast' }
	}

	const ids = (recipients ?? []).map((r) => r.id)

	let inserted = 0
	for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
		const chunk = ids.slice(i, i + CHUNK_SIZE).map((userId) => ({
			user_id: userId,
			type: 'admin_broadcast' as const,
			title: broadcast.title,
			body: broadcast.body,
			link: broadcast.link,
		}))
		const { error: insertError } = await service
			.from('notifications')
			.insert(chunk)
		if (insertError) {
			console.error('[sendBroadcast] chunk insert', insertError)
			return {
				success: false,
				error: 'errors.couldNotSendBroadcast',
			}
		}
		inserted += chunk.length
	}

	const { error: updateError } = await supabase
		.from('admin_broadcasts')
		.update({
			status: 'sent',
			sent_at: new Date().toISOString(),
			recipients_count: inserted,
		})
		.eq('id', broadcast.id)

	if (updateError) {
		console.error('[sendBroadcast] update status', updateError)
	}

	await logAuditEvent({
		actorId: user.id,
		action: 'broadcast.sent',
		targetType: 'broadcast',
		targetId: broadcast.id,
		metadata: {
			title: broadcast.title,
			audience: broadcast.audience,
			recipients: inserted,
		},
	})

	revalidatePath('/admin/broadcasts')
	return { success: true, data: { recipients: inserted } }
}
