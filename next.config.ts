import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '20mb',
		},
	},
	images: {
		dangerouslyAllowSVG: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'placehold.co',
			},
			{
				protocol: 'https',
				hostname: '*.supabase.co',
			},
		],
	},
}

const sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)

const withSentry = (config: NextConfig): NextConfig =>
	sentryConfigured
		? withSentryConfig(config, {
				silent: true,
				org: process.env.SENTRY_ORG,
				project: process.env.SENTRY_PROJECT,
				widenClientFileUpload: true,
				disableLogger: true,
				sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
			})
		: config

export default withSentry(withNextIntl(nextConfig))
