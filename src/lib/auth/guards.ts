import 'server-only'

import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type AuthedContext = {
	user: User
	supabase: SupabaseClient<Database>
}

/**
 * Returns the current authed user + client, or redirects to /login if
 * there is no session. Use in Server Actions and Server Components that
 * require an authenticated caller. The underlying getUser() call is
 * deduped per request via src/lib/auth/session.ts.
 */
export async function requireUser(): Promise<AuthedContext> {
	const [user, supabase] = await Promise.all([getCurrentUser(), createClient()])

	if (!user) {
		redirect('/login')
	}

	return { user, supabase }
}

/**
 * Soft variant — returns null instead of redirecting. Use in places that
 * need the user but handle the logged-out case explicitly.
 */
export async function getOptionalUser(): Promise<AuthedContext | null> {
	const [user, supabase] = await Promise.all([getCurrentUser(), createClient()])
	if (!user) return null
	return { user, supabase }
}

/**
 * Returns the current user + client and ensures they are an admin.
 * Redirects to /login or /dashboard otherwise.
 */
export async function requireAdmin(): Promise<AuthedContext> {
	const ctx = await requireUser()
	if (ctx.user.app_metadata?.role !== 'admin') {
		redirect('/dashboard')
	}
	return ctx
}

export { isAdmin, getUserRole } from '@/lib/auth/roles'
export type { UserRole } from '@/lib/auth/roles'
