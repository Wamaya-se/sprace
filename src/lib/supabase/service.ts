import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'

/**
 * Supabase service-role client for DB writes that are authorised at the
 * application layer (Server Actions, webhooks) rather than via RLS policies.
 *
 * Use this ONLY for tables where RLS is intentionally SELECT-only for end
 * users and the write path is guarded by server-side checks, e.g.:
 *
 *   - `payments`      — business/creator can read own, but all writes are
 *                       done by checkout + webhook logic (service client)
 *   - `notifications` — user can read/ack own, but insert is always done by
 *                       server-side business logic (service client)
 *   - `stripe_webhook_events` — idempotency ledger, only webhook writes
 *
 * For Auth Admin API calls (create/update users, set app_metadata) use
 * `createAdminClient` from `./admin` instead. Conceptually same credentials
 * but we keep the names distinct so code reviewers can see intent at a
 * glance.
 *
 * NEVER use this client for operations that should respect user ownership
 * via RLS (bookings, messages, reviews, etc.) — that would defeat the RLS
 * safety net for those tables.
 */
export function createServiceClient() {
	return createSupabaseClient<Database>(
		env.supabaseUrl,
		env.supabaseServiceRoleKey,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		},
	)
}
