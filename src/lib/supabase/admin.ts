import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'

export function createAdminClient() {
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
