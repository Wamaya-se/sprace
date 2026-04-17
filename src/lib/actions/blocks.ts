'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/guards'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import type { ActionResult } from '@/types/actions'

const profileIdSchema = z.string().uuid()

export async function blockUser(
	profileId: string,
): Promise<ActionResult<{ blocked: true }>> {
	const parsed = profileIdSchema.safeParse(profileId)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidProfileId' }
	}

	const { user, supabase } = await requireUser()

	if (parsed.data === user.id) {
		return { success: false, error: 'errors.cannotBlockSelf' }
	}

	const h = await headers()
	const rl = await checkRateLimit(
		'action',
		`block:${getClientIp(h)}:${user.id}`,
	)
	if (!rl.success) {
		return { success: false, error: 'errors.tooManyRequests' }
	}

	const { data: target } = await supabase
		.from('profiles')
		.select('id')
		.eq('id', parsed.data)
		.single()

	if (!target) {
		return { success: false, error: 'errors.profileNotFound' }
	}

	const { error } = await supabase.from('user_blocks').insert({
		blocker_id: user.id,
		blocked_id: parsed.data,
	})

	if (error && error.code !== '23505') {
		console.error('[blockUser]', error)
		return { success: false, error: 'errors.couldNotBlockUser' }
	}

	revalidatePath('/dashboard/discover')
	revalidatePath('/dashboard/saved')
	revalidatePath('/creators')

	return { success: true, data: { blocked: true } }
}

export async function unblockUser(
	profileId: string,
): Promise<ActionResult<{ blocked: false }>> {
	const parsed = profileIdSchema.safeParse(profileId)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidProfileId' }
	}

	const { user, supabase } = await requireUser()

	const h = await headers()
	const rl = await checkRateLimit(
		'action',
		`unblock:${getClientIp(h)}:${user.id}`,
	)
	if (!rl.success) {
		return { success: false, error: 'errors.tooManyRequests' }
	}

	const { error } = await supabase
		.from('user_blocks')
		.delete()
		.eq('blocker_id', user.id)
		.eq('blocked_id', parsed.data)

	if (error) {
		console.error('[unblockUser]', error)
		return { success: false, error: 'errors.couldNotUnblockUser' }
	}

	revalidatePath('/dashboard/discover')
	revalidatePath('/dashboard/saved')
	revalidatePath('/creators')

	return { success: true, data: { blocked: false } }
}
