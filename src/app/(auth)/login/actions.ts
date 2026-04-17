'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import type { ActionResult } from '@/types/actions'

const loginSchema = z.object({
	email: z.string().email().max(255),
	password: z.string().min(1).max(128),
})

export async function loginWithEmail(
	formData: FormData,
): Promise<ActionResult> {
	const parsed = loginSchema.safeParse({
		email: formData.get('email'),
		password: formData.get('password'),
	})

	if (!parsed.success) {
		return { success: false, error: 'errors.invalidEmailOrPassword' }
	}

	const h = await headers()
	const ip = getClientIp(h)
	const rl = await checkRateLimit('auth', `login:${ip}:${parsed.data.email}`)
	if (!rl.success) {
		return { success: false, error: 'errors.tooManyRequests' }
	}

	const supabase = await createClient()
	const { data: authData, error } = await supabase.auth.signInWithPassword(
		parsed.data,
	)

	if (error) {
		console.error('[loginWithEmail]', error.message)
		return { success: false, error: 'errors.invalidEmailOrPassword' }
	}

	const role = authData.user.app_metadata?.role as string | undefined
	redirect(role === 'admin' ? '/admin' : '/dashboard')
}

export async function loginWithGoogle(): Promise<ActionResult> {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${env.siteUrl}/auth/callback`,
		},
	})

	if (error) {
		console.error('[loginWithGoogle]', error.message)
		return { success: false, error: 'errors.couldNotConnectGoogle' }
	}

	if (!data.url) {
		return { success: false, error: 'errors.couldNotConnectGoogle' }
	}

	redirect(data.url)
}
