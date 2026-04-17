'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/actions'

const emailSchema = z.string().email().max(255)

export async function resendVerificationEmail(
	email: string,
): Promise<ActionResult> {
	const parsed = emailSchema.safeParse(email)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidEmailAddress' }
	}

	const supabase = await createClient()
	const { error } = await supabase.auth.resend({
		type: 'signup',
		email: parsed.data,
	})

	if (error) {
		console.error('[resendVerificationEmail]', error.message)
	}

	return { success: true, data: undefined }
}
