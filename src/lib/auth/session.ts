import 'server-only'

import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the current authenticated user (or null) for the active
 * request. Wrapped in React.cache so repeated calls within the same
 * request dedupe into a single supabase.auth.getUser() call.
 *
 * Do NOT use the returned user object for client-trust decisions
 * outside the active server render — re-fetch on mutation paths.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	return user ?? null
})
