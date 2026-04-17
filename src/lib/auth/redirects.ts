/**
 * Safe redirect helpers. Centralised here so auth callbacks, middleware, and
 * any future entry points share the same allowlist and validation rules.
 *
 * Rule: never trust a user-supplied redirect target. Must be a same-origin
 * absolute path that matches (or is under) one of the allowed prefixes.
 */

export const ALLOWED_REDIRECTS = [
	'/dashboard',
	'/dashboard/profile',
	'/dashboard/services',
	'/dashboard/settings',
	'/dashboard/discover',
	'/dashboard/campaigns',
	'/dashboard/bookings',
	'/dashboard/messages',
	'/dashboard/notifications',
	'/dashboard/reviews',
	'/dashboard/saved',
	'/admin',
	'/admin/users',
	'/admin/settings',
	'/admin/content',
	'/admin/creators',
	'/admin/payments',
	'/admin/disputes',
	'/reset-password',
] as const

export function getSafeRedirectPath(raw: string | null): string | null {
	if (!raw) return null
	if (!raw.startsWith('/')) return null
	if (raw.startsWith('//')) return null
	if (
		ALLOWED_REDIRECTS.some(
			(allowed) => raw === allowed || raw.startsWith(allowed + '/'),
		)
	) {
		return raw
	}
	return null
}
