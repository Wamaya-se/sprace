'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'
import type { ActionResult } from '@/types/actions'
import { isValidOrgNumber } from '@/lib/validation/se-identifiers'

const VALID_KEYS = [
	'platform_name',
	'contact_email',
	'active_locales',
	'support_url',
	'terms_url',
	'privacy_url',
	'platform_legal_name',
	'platform_org_number',
	'platform_vat_number',
	'platform_address_line1',
	'platform_address_line2',
	'platform_postal_code',
	'platform_city',
	'platform_country_code',
	'platform_billing_email',
	'platform_website',
] as const

const settingSchema = z.object({
	key: z.enum(VALID_KEYS),
	value: z.string().max(500),
})

const batchSchema = z.array(settingSchema).min(1).max(VALID_KEYS.length)

function validateSetting(
	key: (typeof VALID_KEYS)[number],
	value: string,
): string | null {
	if (value === '') return null
	if (key === 'platform_org_number') {
		return isValidOrgNumber(value) ? null : 'errors.invalidOrgNumber'
	}
	if (key === 'platform_country_code') {
		return /^[A-Z]{2}$/.test(value) ? null : 'errors.invalidCountryCode'
	}
	if (key === 'platform_billing_email' || key === 'contact_email') {
		return z.string().email().safeParse(value).success
			? null
			: 'errors.invalidEmail'
	}
	if (key === 'support_url' || key === 'terms_url' || key === 'privacy_url') {
		return z.string().url().safeParse(value).success
			? null
			: 'errors.invalidUrl'
	}
	return null
}

export async function updatePlatformSettings(
	settings: { key: string; value: string }[],
): Promise<ActionResult> {
	const { supabase } = await requireAdmin()

	const parsed = batchSchema.safeParse(settings)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidInput' }
	}

	for (const { key, value } of parsed.data) {
		const validationError = validateSetting(key, value)
		if (validationError) {
			return { success: false, error: validationError, field: key }
		}
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
	revalidateTag('platform-entity', 'max')
	return { success: true, data: undefined }
}
