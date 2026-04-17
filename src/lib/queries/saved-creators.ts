import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function getSavedCreatorIds(): Promise<string[]> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return []

	const { data } = await supabase
		.from('saved_creators')
		.select('creator_id')
		.eq('business_profile_id', user.id)

	return (data ?? []).map((row) => row.creator_id)
}
