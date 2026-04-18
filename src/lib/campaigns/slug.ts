/**
 * Pure slug generator for campaigns.
 *
 * Produces a URL-safe slug by lowercasing, stripping diacritics, and
 * suffixing with 6 random alphanumeric characters so collisions are
 * astronomically unlikely (>2 billion permutations).
 */

const SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SUFFIX_LENGTH = 6

function baseSlug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[åä]/g, 'a')
		.replace(/ö/g, 'o')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80)
}

function randomSuffix(length = SUFFIX_LENGTH): string {
	let out = ''
	for (let i = 0; i < length; i += 1) {
		out += SUFFIX_ALPHABET.charAt(
			Math.floor(Math.random() * SUFFIX_ALPHABET.length),
		)
	}
	return out
}

export function generateCampaignSlug(title: string): string {
	const base = baseSlug(title) || 'campaign'
	return `${base}-${randomSuffix()}`
}

export const __test = { baseSlug, randomSuffix }
