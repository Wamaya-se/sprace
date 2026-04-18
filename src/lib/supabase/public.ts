import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'

/**
 * Cookie-less anon Supabase client for public, non-personalised reads
 * wrapped in `unstable_cache()`.
 *
 * Next.js 16 forbids reading dynamic sources (including `cookies()`) inside
 * a cached scope — the regular `createClient()` from `./server` binds to
 * the request cookie store and therefore cannot be used here. This client
 * uses the anon key directly with no session persistence, so it's safe
 * inside `unstable_cache(fn, key, { tags, revalidate })`.
 *
 * Only use for data that is equally visible to every visitor (RLS anon
 * policies must allow the reads). For any user-scoped read, use
 * `createClient()` from `./server`.
 */
export function createPublicClient() {
	return createSupabaseClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	})
}
