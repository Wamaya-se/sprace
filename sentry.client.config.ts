import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
	Sentry.init({
		dsn,
		environment:
			process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
			process.env.NODE_ENV ||
			'development',
		// Performance sampling — start conservative, tune in production.
		tracesSampleRate: 0.1,
		// Session Replay — capture 0% normally, 100% when an error occurs.
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 1.0,
		integrations: [
			Sentry.replayIntegration({
				maskAllText: true,
				blockAllMedia: true,
			}),
		],
	})
}
