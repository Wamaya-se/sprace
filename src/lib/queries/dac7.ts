import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * Reads the current user's creator DAC7 record. Returns null when the
 * user is not a creator or hasn't started filling in DAC7 fields.
 * Decryption is deliberately NOT done here — the raw ciphertext never
 * leaves the server, and there is no use-case for exposing it.
 */
export interface CreatorDac7Summary {
	creatorId: string
	hasPersonalNumber: boolean
	personalNumberLast4: string | null
	birthDate: string | null
	addressLine1: string | null
	addressLine2: string | null
	postalCode: string | null
	city: string | null
	countryCode: string
}

export async function getMyCreatorDac7(
	creatorId: string,
): Promise<CreatorDac7Summary | null> {
	const supabase = await createClient()
	const { data, error } = await supabase
		.from('creator_dac7')
		.select(
			'creator_id, personal_number_encrypted, personal_number_last4, birth_date, address_line1, address_line2, postal_code, city, country_code',
		)
		.eq('creator_id', creatorId)
		.maybeSingle()

	if (error) {
		console.error('[getMyCreatorDac7]', error)
		return null
	}

	if (!data) {
		return {
			creatorId,
			hasPersonalNumber: false,
			personalNumberLast4: null,
			birthDate: null,
			addressLine1: null,
			addressLine2: null,
			postalCode: null,
			city: null,
			countryCode: 'SE',
		}
	}

	return {
		creatorId: data.creator_id,
		hasPersonalNumber: Boolean(data.personal_number_encrypted),
		personalNumberLast4: data.personal_number_last4,
		birthDate: data.birth_date,
		addressLine1: data.address_line1,
		addressLine2: data.address_line2,
		postalCode: data.postal_code,
		city: data.city,
		countryCode: data.country_code ?? 'SE',
	}
}

export function isCreatorDac7Complete(dac7: CreatorDac7Summary): boolean {
	return (
		dac7.hasPersonalNumber &&
		Boolean(dac7.birthDate) &&
		Boolean(dac7.addressLine1?.trim()) &&
		Boolean(dac7.postalCode?.trim()) &&
		Boolean(dac7.city?.trim()) &&
		/^[A-Z]{2}$/.test(dac7.countryCode ?? '')
	)
}

export interface BusinessDac7Summary {
	id: string
	orgNumber: string | null
	orgNumberVerification: 'unverified' | 'pending' | 'verified' | 'rejected'
	vatNumber: string | null
	addressLine1: string | null
	addressLine2: string | null
	postalCode: string | null
	city: string | null
	countryCode: string
}

export function isBusinessDac7Complete(biz: BusinessDac7Summary): boolean {
	return (
		Boolean(biz.orgNumber?.trim()) &&
		Boolean(biz.addressLine1?.trim()) &&
		Boolean(biz.postalCode?.trim()) &&
		Boolean(biz.city?.trim()) &&
		/^[A-Z]{2}$/.test(biz.countryCode ?? '')
	)
}
