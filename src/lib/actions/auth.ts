'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logOut() {
	const supabase = await createClient()
	const { error } = await supabase.auth.signOut()

	if (error) {
		console.error('[logOut]', error.message)
	}

	redirect('/login')
}
