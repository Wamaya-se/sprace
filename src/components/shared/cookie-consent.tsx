'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'sprace-cookie-consent'
const CONSENT_VERSION = '1'

function subscribe(onChange: () => void) {
	window.addEventListener('storage', onChange)
	return () => {
		window.removeEventListener('storage', onChange)
	}
}

function getSnapshot(): string | null {
	try {
		return window.localStorage.getItem(STORAGE_KEY)
	} catch {
		return null
	}
}

// During SSR, pretend consent is already given so nothing renders on the
// server. React will re-evaluate on the client after hydration and show the
// banner if localStorage actually has no consent recorded.
function getServerSnapshot(): string {
	return CONSENT_VERSION
}

export function CookieConsent() {
	const t = useTranslations('cookieConsent')
	const consent = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	)
	const [dismissed, setDismissed] = useState(false)
	const visible = consent !== CONSENT_VERSION && !dismissed

	const handleDismiss = useCallback(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, CONSENT_VERSION)
		} catch {
			// localStorage unavailable (private mode, quota full) — dismiss for
			// this session only; banner will reappear on next load.
		}
		setDismissed(true)
	}, [])

	useEffect(() => {
		if (!visible) return
		function handleKey(e: KeyboardEvent) {
			if (e.key === 'Escape') handleDismiss()
		}
		window.addEventListener('keydown', handleKey)
		return () => {
			window.removeEventListener('keydown', handleKey)
		}
	}, [visible, handleDismiss])

	if (!visible) return null

	return (
		<div
			role="region"
			aria-label={t('ariaLabel')}
			className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-outline-variant/30 bg-surface-container shadow-lg backdrop-blur-sm sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
		>
			<div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
				<div className="flex-1 space-y-1">
					<p className="font-heading text-base font-semibold text-foreground">
						{t('title')}
					</p>
					<p className="font-sans text-sm text-muted-foreground">
						{t.rich('description', {
							link: (chunks) => (
								<Link
									href="/privacy"
									className="text-brand underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
								>
									{chunks}
								</Link>
							),
						})}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/privacy">{t('learnMore')}</Link>
					</Button>
					<Button variant="brand" size="sm" onClick={handleDismiss} autoFocus>
						{t('accept')}
					</Button>
				</div>
			</div>
		</div>
	)
}
