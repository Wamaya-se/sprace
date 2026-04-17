'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { AuthApiError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const resetSchema = z.object({
	password: z.string().min(10).max(128),
})

export async function updatePassword(
	formData: FormData,
): Promise<ActionResult> {
	const parsed = resetSchema.safeParse({
		password: formData.get('password'),
	})

	if (!parsed.success) {
		return { success: false, error: 'errors.passwordMinLength' }
	}

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return { success: false, error: 'errors.sessionExpired' }
	}

	const { error } = await supabase.auth.updateUser({
		password: parsed.data.password,
	})

	if (error) {
		console.error('[updatePassword]', error.message)
		const code = error instanceof AuthApiError ? error.code : undefined
		if (code === 'same_password') {
			return { success: false, error: 'errors.samePassword' }
		}
		return { success: false, error: 'errors.couldNotUpdatePassword' }
	}

	redirect('/login?reset=success')
}
