import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('env getters', () => {
	const ORIGINAL = { ...process.env }

	beforeEach(() => {
		for (const key of Object.keys(process.env)) {
			if (
				key.startsWith('NEXT_PUBLIC_SUPABASE_') ||
				key === 'SUPABASE_SERVICE_ROLE_KEY' ||
				key.startsWith('STRIPE_') ||
				key === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' ||
				key === 'RESEND_API_KEY' ||
				key === 'NEXT_PUBLIC_SITE_URL' ||
				key === 'EMAIL_FROM_ADDRESS'
			) {
				delete process.env[key]
			}
		}
	})

	afterEach(() => {
		process.env = { ...ORIGINAL }
	})

	it('throws when a required variable is missing', async () => {
		const { env } = await import('@/lib/env')
		expect(() => env.supabaseUrl).toThrow(/Missing required/)
	})

	it('returns the value when set', async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
		const { env } = await import('@/lib/env')
		expect(env.supabaseUrl).toBe('https://example.supabase.co')
	})

	it('uses a default for optional vars', async () => {
		const { env } = await import('@/lib/env')
		expect(env.siteUrl).toBe('http://localhost:3000')
	})
})
