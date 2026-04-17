'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import type { ActionResult } from '@/types/actions'

const baseSchema = z.object({
	email: z.string().email().max(255),
	password: z.string().min(10).max(128),
	fullName: z.string().trim().min(1).max(100),
})

const creatorSchema = baseSchema.extend({
	role: z.literal('creator'),
	displayName: z.string().trim().min(1).max(100),
})

const businessSchema = baseSchema.extend({
	role: z.literal('business'),
	companyName: z.string().trim().min(1).max(200),
})

const registerSchema = z.discriminatedUnion('role', [
	creatorSchema,
	businessSchema,
])

export async function registerWithEmail(
	formData: FormData,
): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
	const parsed = registerSchema.safeParse({
		email: formData.get('email'),
		password: formData.get('password'),
		fullName: formData.get('fullName'),
		role: formData.get('role'),
		displayName: formData.get('displayName'),
		companyName: formData.get('companyName'),
	})

	if (!parsed.success) {
		const firstError = parsed.error.issues[0]
		return {
			success: false,
			error: 'errors.invalidInput',
			field: firstError?.path[0] as string | undefined,
		}
	}

	const { email, password, fullName, role } = parsed.data

	const h = await headers()
	const ip = getClientIp(h)
	const rl = await checkRateLimit('auth', `register:${ip}`)
	if (!rl.success) {
		return { success: false, error: 'errors.tooManyRequests' }
	}

	const userMetadata: Record<string, string> = {
		full_name: fullName,
		role,
		tos_version: '1.0',
	}

	if (role === 'creator') {
		userMetadata.display_name = parsed.data.displayName
	} else {
		userMetadata.company_name = parsed.data.companyName
	}

	const supabase = await createClient()
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: { data: userMetadata },
	})

	if (error) {
		console.error('[registerWithEmail]', error.message)
		return { success: false, error: 'errors.registrationFailed' }
	}

	if (data.user && !data.session) {
		return { success: true, data: { needsEmailConfirmation: true } }
	}

	redirect('/dashboard')
}
