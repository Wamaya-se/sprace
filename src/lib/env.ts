function getRequiredEnv(name: string): string {
	const value = process.env[name]
	if (!value) {
		throw new Error(
			`Missing required environment variable: ${name}. ` +
				'Check your .env.local file.',
		)
	}
	return value
}

export const env = {
	get supabaseUrl() {
		return getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
	},
	get supabaseAnonKey() {
		return getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
	},
	get supabaseServiceRoleKey() {
		return getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
	},
	get siteUrl() {
		return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
	},
	get stripeSecretKey() {
		return getRequiredEnv('STRIPE_SECRET_KEY')
	},
	get stripePublishableKey() {
		return getRequiredEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
	},
	get stripeWebhookSecret() {
		return getRequiredEnv('STRIPE_WEBHOOK_SECRET')
	},
	get resendApiKey() {
		return getRequiredEnv('RESEND_API_KEY')
	},
	get emailFromAddress() {
		return process.env.EMAIL_FROM_ADDRESS || 'noreply@sprace.com'
	},
	get upstashRedisUrl() {
		return process.env.UPSTASH_REDIS_REST_URL
	},
	get upstashRedisToken() {
		return process.env.UPSTASH_REDIS_REST_TOKEN
	},
	get sentryDsn() {
		return process.env.NEXT_PUBLIC_SENTRY_DSN
	},
	get sentryEnvironment() {
		return (
			process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'
		)
	},
	/**
	 * Base64-encoded 32-byte AES-256-GCM key used to encrypt PII at rest
	 * (currently: creators' Swedish personnummer). Treat like SUPABASE_SERVICE_ROLE_KEY.
	 *
	 * Generate a new key:
	 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
	 *
	 * Rotating the key requires re-encrypting existing ciphertext with
	 * the old key first — don't swap it without a migration plan.
	 */
	get piiEncryptionKey() {
		return getRequiredEnv('PII_ENCRYPTION_KEY')
	},
}
