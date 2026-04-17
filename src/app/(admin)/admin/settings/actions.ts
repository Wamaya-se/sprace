'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'
import type { ActionResult } from '@/types/actions'

const VALID_KEYS = [
	'platform_name',
	'contact_email',
	'active_locales',
	'support_url',
	'terms_url',
	'privacy_url',
] as const

const settingSchema = z.object({
	key: z.enum(VALID_KEYS),
	value: z.string().max(500),
})

const batchSchema = z.array(settingSchema).min(1).max(VALID_KEYS.length)

export async function updatePlatformSettings(
	settings: { key: string; value: string }[],
): Promise<ActionResult> {
	const { supabase } = await requireAdmin()

	const parsed = batchSchema.safeParse(settings)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	for (const { key, value } of parsed.data) {
		const { error } = await supabase
			.from('platform_settings')
			.update({ value })
			.eq('key', key)

		if (error) {
			console.error(`[updatePlatformSettings] key=${key}`, error)
			return { success: false, error: 'errors.couldNotSaveSettings' }
		}
	}

	revalidatePath('/admin/settings')
	return { success: true, data: undefined }
}
