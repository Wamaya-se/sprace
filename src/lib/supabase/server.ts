import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'

export const createClient = cache(async () => {
	const cookieStore = await cookies()

	return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll()
			},
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) =>
						cookieStore.set(name, value, options),
					)
				} catch {
					// setAll called from Server Component — safe to ignore
					// the cookies will be set by the middleware instead
				}
			},
		},
	})
})
