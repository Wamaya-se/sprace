'use client'

import { useReportWebVitals } from 'next/web-vitals'

/**
 * Captures Web Vitals (CLS, LCP, FCP, INP, TTFB) and forwards them to Sentry
 * (if configured). No-op if Sentry DSN is missing. Runs only in browser.
 */
export function WebVitalsReporter() {
	useReportWebVitals(async (metric) => {
		if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
		try {
			const Sentry = await import('@sentry/nextjs')
			Sentry.captureMessage(`web-vital:${metric.name}`, {
				level: 'info',
				tags: {
					vital: metric.name,
					rating: metric.rating ?? 'unknown',
				},
				extra: {
					id: metric.id,
					value: metric.value,
					delta: metric.delta,
					navigationType: metric.navigationType,
				},
			})
		} catch {
			// Sentry not available — silently drop.
		}
	})

	return null
}
