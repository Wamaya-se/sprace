import type { User } from '@supabase/supabase-js'

/**
 * Pure predicate — no server-only deps — so it can be shared with tests,
 * middleware, and components that just need to check a role claim.
 */
export function isAdmin(user: Pick<User, 'app_metadata'>): boolean {
	return user.app_metadata?.role === 'admin'
}

export type UserRole = 'admin' | 'creator' | 'business'

export function getUserRole(
	user: Pick<User, 'app_metadata'>,
): UserRole | undefined {
	const role = user.app_metadata?.role
	if (role === 'admin' || role === 'creator' || role === 'business') return role
	return undefined
}
