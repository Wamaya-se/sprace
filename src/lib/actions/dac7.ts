'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/guards'
import type { ActionResult } from '@/types/actions'
import { encryptPii } from '@/lib/crypto/pii'
import {
	isValidSwedishVatNumberFormat,
	normalizeSwedishVatNumber,
	parsePersonalNumber,
} from '@/lib/validation/se-identifiers'

// ---------- Schemas ----------

const addressSchema = z.object({
	addressLine1: z.string().trim().min(1).max(200),
	addressLine2: z.preprocess(
		(v) => (v === '' ? undefined : v),
		z.string().trim().max(200).optional(),
	),
	postalCode: z
		.string()
		.trim()
		.min(1)
		.max(20)
		.regex(/^[A-Za-z0-9 \-]+$/),
	city: z.string().trim().min(1).max(100),
	countryCode: z
		.string()
		.trim()
		.toUpperCase()
		.regex(/^[A-Z]{2}$/),
})

const creatorDac7Schema = addressSchema.extend({
	personalNumber: z.string().trim().min(10).max(13),
})

const creatorDac7AddressOnlySchema = addressSchema

const businessDac7Schema = addressSchema.extend({
	vatNumber: z.preprocess(
		(v) => (v === '' ? undefined : v),
		z.string().trim().max(20).optional(),
	),
})

// ---------- Creator DAC7 ----------

export async function updateCreatorDac7(input: unknown): Promise<ActionResult> {
	const { supabase, user } = await requireUser()

	if (user.app_metadata?.role !== 'creator') {
		return { success: false, error: 'errors.forbidden' }
	}

	const parsed = creatorDac7Schema.safeParse(input)
	if (!parsed.success) {
		const field = parsed.error.issues[0]?.path[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: typeof field === 'string' ? field : undefined,
		}
	}

	const personInfo = parsePersonalNumber(parsed.data.personalNumber)
	if (!personInfo) {
		return {
			success: false,
			error: 'errors.invalidPersonalNumber',
			field: 'personalNumber',
		}
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('id')
		.eq('profile_id', user.id)
		.single()

	if (!creator) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	const encrypted = encryptPii(personInfo.normalized12)

	const { error } = await supabase.from('creator_dac7').upsert(
		{
			creator_id: creator.id,
			personal_number_encrypted: encrypted,
			personal_number_last4: personInfo.normalized12.slice(-4),
			birth_date: personInfo.birthDate,
			address_line1: parsed.data.addressLine1,
			address_line2: parsed.data.addressLine2 ?? null,
			postal_code: parsed.data.postalCode,
			city: parsed.data.city,
			country_code: parsed.data.countryCode,
		},
		{ onConflict: 'creator_id' },
	)

	if (error) {
		console.error('[updateCreatorDac7]', error.code, error.message)
		return { success: false, error: 'errors.couldNotSaveDac7' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}

export async function updateCreatorDac7Address(
	input: unknown,
): Promise<ActionResult> {
	const { supabase, user } = await requireUser()

	if (user.app_metadata?.role !== 'creator') {
		return { success: false, error: 'errors.forbidden' }
	}

	const parsed = creatorDac7AddressOnlySchema.safeParse(input)
	if (!parsed.success) {
		const field = parsed.error.issues[0]?.path[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: typeof field === 'string' ? field : undefined,
		}
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('id')
		.eq('profile_id', user.id)
		.single()

	if (!creator) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	const { data: existing } = await supabase
		.from('creator_dac7')
		.select('creator_id')
		.eq('creator_id', creator.id)
		.maybeSingle()

	if (!existing) {
		return { success: false, error: 'errors.personalNumberRequiredFirst' }
	}

	const { error } = await supabase
		.from('creator_dac7')
		.update({
			address_line1: parsed.data.addressLine1,
			address_line2: parsed.data.addressLine2 ?? null,
			postal_code: parsed.data.postalCode,
			city: parsed.data.city,
			country_code: parsed.data.countryCode,
		})
		.eq('creator_id', creator.id)

	if (error) {
		console.error('[updateCreatorDac7Address]', error.code, error.message)
		return { success: false, error: 'errors.couldNotSaveDac7' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}

// ---------- Business DAC7 address + VAT ----------

export async function updateBusinessBillingDetails(
	input: unknown,
): Promise<ActionResult> {
	const { supabase, user } = await requireUser()

	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.forbidden' }
	}

	const parsed = businessDac7Schema.safeParse(input)
	if (!parsed.success) {
		const field = parsed.error.issues[0]?.path[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: typeof field === 'string' ? field : undefined,
		}
	}

	if (parsed.data.vatNumber) {
		if (!isValidSwedishVatNumberFormat(parsed.data.vatNumber)) {
			return {
				success: false,
				error: 'errors.invalidVatNumber',
				field: 'vatNumber',
			}
		}
	}

	const { data: business } = await supabase
		.from('businesses')
		.select('id')
		.eq('profile_id', user.id)
		.single()

	if (!business) {
		return { success: false, error: 'errors.businessNotFound' }
	}

	const { error } = await supabase
		.from('businesses')
		.update({
			vat_number: parsed.data.vatNumber
				? normalizeSwedishVatNumber(parsed.data.vatNumber)
				: null,
			address_line1: parsed.data.addressLine1,
			address_line2: parsed.data.addressLine2 ?? null,
			postal_code: parsed.data.postalCode,
			city: parsed.data.city,
			country_code: parsed.data.countryCode,
		})
		.eq('id', business.id)

	if (error) {
		console.error('[updateBusinessBillingDetails]', error.code, error.message)
		return { success: false, error: 'errors.couldNotSaveBusinessBilling' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}
