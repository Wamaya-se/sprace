import 'server-only'

import type { AuthError } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserRole = 'creator' | 'business' | 'admin'

interface RoleSyncOptions {
	userId: string
	role: UserRole
	maxAttempts?: number
	baseDelayMs?: number
}

export interface RoleSyncResult {
	ok: boolean
	attempts: number
	error?: AuthError | null
}

function wait(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/**
 * Sync a user's role into their JWT via the Supabase Auth Admin API.
 *
 * The Auth Admin API is a network call with its own transient failure
 * modes (rate limits, timeouts, race conditions). The app-level source
 * of truth is `profiles.role`, so if this fails the caller must decide
 * whether to roll back. We retry transient errors with exponential
 * backoff before surfacing failure to the caller.
 */
export async function syncAppMetadataRole({
	userId,
	role,
	maxAttempts = 3,
	baseDelayMs = 250,
}: RoleSyncOptions): Promise<RoleSyncResult> {
	const admin = createAdminClient()
	let lastError: AuthError | null = null

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const { error } = await admin.auth.admin.updateUserById(userId, {
			app_metadata: { role },
		})

		if (!error) {
			return { ok: true, attempts: attempt }
		}

		lastError = error
		console.warn(
			`[syncAppMetadataRole] attempt ${attempt}/${maxAttempts} failed`,
			{
				userId,
				role,
				status: error.status,
				message: error.message,
			},
		)

		if (attempt < maxAttempts) {
			// Exponential backoff with jitter: 250ms → ~500ms → ~1000ms.
			const jitter = Math.floor(Math.random() * 100)
			await wait(baseDelayMs * 2 ** (attempt - 1) + jitter)
		}
	}

	return { ok: false, attempts: maxAttempts, error: lastError }
}
