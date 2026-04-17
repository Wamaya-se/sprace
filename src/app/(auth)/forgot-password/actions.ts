'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import type { ActionResult } from '@/types/actions'

const emailSchema = z.object({
	email: z.string().email().max(255),
})

export async function requestPasswordReset(
	formData: FormData,
): Promise<ActionResult<{ sent: boolean }>> {
	const parsed = emailSchema.safeParse({
		email: formData.get('email'),
	})

	if (!parsed.success) {
		return { success: false, error: 'errors.invalidEmail' }
	}

	const h = await headers()
	const ip = getClientIp(h)
	const rl = await checkRateLimit(
		'auth',
		`forgot-password:${ip}:${parsed.data.email}`,
	)
	if (!rl.success) {
		return { success: false, error: 'errors.tooManyRequests' }
	}

	const supabase = await createClient()
	const { error } = await supabase.auth.resetPasswordForEmail(
		parsed.data.email,
		{ redirectTo: `${env.siteUrl}/auth/callback?next=/reset-password` },
	)

	if (error) {
		console.error('[requestPasswordReset]', error.message)
	}

	return { success: true, data: { sent: true } }
}
