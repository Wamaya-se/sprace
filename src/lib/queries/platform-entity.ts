import 'server-only'

import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Legal-entity details for "Sprace AB" used on receipts, payout statements
 * and other billing documents. Sourced from the `platform_settings`
 * key-value table so admins can edit without a deploy.
 *
 * Cached with `unstable_cache` under the `platform-entity` tag — admin
 * saves revalidate that tag so fresh values appear without full restarts.
 */

export interface PlatformEntity {
	legalName: string
	orgNumber: string
	vatNumber: string
	addressLine1: string
	addressLine2: string
	postalCode: string
	city: string
	countryCode: string
	billingEmail: string
	website: string
}

const FALLBACK: PlatformEntity = {
	legalName: 'Sprace AB',
	orgNumber: '—',
	vatNumber: '—',
	addressLine1: '',
	addressLine2: '',
	postalCode: '',
	city: 'Stockholm',
	countryCode: 'SE',
	billingEmail: 'billing@sprace.com',
	website: 'sprace.com',
}

async function fetchPlatformEntity(): Promise<PlatformEntity> {
	const supabase = await createClient()
	const { data, error } = await supabase
		.from('platform_settings')
		.select('key, value')
		.in('key', [
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
		])

	if (error || !data) {
		return FALLBACK
	}

	const map = new Map(data.map((row) => [row.key, row.value]))
	const pick = (key: string, fallback: string) => {
		const v = map.get(key)
		return v && v.trim() ? v.trim() : fallback
	}

	return {
		legalName: pick('platform_legal_name', FALLBACK.legalName),
		orgNumber: pick('platform_org_number', FALLBACK.orgNumber),
		vatNumber: pick('platform_vat_number', FALLBACK.vatNumber),
		addressLine1: pick('platform_address_line1', FALLBACK.addressLine1),
		addressLine2: pick('platform_address_line2', FALLBACK.addressLine2),
		postalCode: pick('platform_postal_code', FALLBACK.postalCode),
		city: pick('platform_city', FALLBACK.city),
		countryCode: pick('platform_country_code', FALLBACK.countryCode),
		billingEmail: pick('platform_billing_email', FALLBACK.billingEmail),
		website: pick('platform_website', FALLBACK.website),
	}
}

export const getPlatformEntity = unstable_cache(
	fetchPlatformEntity,
	['platform-entity'],
	{ tags: ['platform-entity'], revalidate: 3600 },
)

/**
 * Joins the address parts into lines suitable for PDF rendering.
 * Skips empty segments.
 */
export function formatPlatformAddress(entity: PlatformEntity): string[] {
	const lines: string[] = []
	if (entity.addressLine1) lines.push(entity.addressLine1)
	if (entity.addressLine2) lines.push(entity.addressLine2)
	const cityLine = [entity.postalCode, entity.city].filter(Boolean).join(' ')
	if (cityLine) lines.push(cityLine)
	if (entity.countryCode) lines.push(entity.countryCode)
	return lines
}
