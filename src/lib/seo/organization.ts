import 'server-only'

import { env } from '@/lib/env'
import { getPlatformEntity } from '@/lib/queries/platform-entity'

/**
 * Canonical Schema.org `Organization` object for Sprace. Sourced from
 * `platform_settings` so admins can edit the legal entity without a deploy.
 *
 * Keep output serializable — it's rendered server-side inside a
 * `<script type="application/ld+json">` tag.
 */
export async function getOrganizationJsonLd(): Promise<
	Record<string, unknown>
> {
	const entity = await getPlatformEntity()
	const siteUrl = env.siteUrl

	const sameAs = [
		'https://instagram.com',
		'https://tiktok.com',
		'https://linkedin.com',
	]

	const addressParts: Record<string, string> = {}
	if (entity.addressLine1) addressParts.streetAddress = entity.addressLine1
	if (entity.postalCode) addressParts.postalCode = entity.postalCode
	if (entity.city) addressParts.addressLocality = entity.city
	if (entity.countryCode) addressParts.addressCountry = entity.countryCode

	const contactPoints: Array<Record<string, unknown>> = []
	if (entity.billingEmail) {
		contactPoints.push({
			'@type': 'ContactPoint',
			email: entity.billingEmail,
			contactType: 'customer support',
			areaServed: entity.countryCode || 'SE',
			availableLanguage: ['English', 'Swedish'],
		})
	}

	const identifiers: Array<Record<string, string>> = []
	if (entity.orgNumber && entity.orgNumber !== '—') {
		identifiers.push({
			'@type': 'PropertyValue',
			propertyID: 'SE-ORG',
			value: entity.orgNumber,
		})
	}
	if (entity.vatNumber && entity.vatNumber !== '—') {
		identifiers.push({
			'@type': 'PropertyValue',
			propertyID: 'VAT',
			value: entity.vatNumber,
		})
	}

	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${siteUrl}/#organization`,
		name: entity.legalName,
		url: siteUrl,
		logo: `${siteUrl}/sprace-logo.png`,
		sameAs,
		...(Object.keys(addressParts).length > 0
			? { address: { '@type': 'PostalAddress', ...addressParts } }
			: {}),
		...(contactPoints.length > 0 ? { contactPoint: contactPoints } : {}),
		...(identifiers.length > 0 ? { identifier: identifiers } : {}),
	}
}
