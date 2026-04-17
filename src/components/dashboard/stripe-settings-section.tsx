'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	createStripeConnectAccount,
	getStripeOnboardingLink,
} from '@/lib/actions/stripe'

interface StripeSettingsSectionProps {
	hasAccount: boolean
	isComplete: boolean
}

export function StripeSettingsSection({
	hasAccount,
	isComplete,
}: StripeSettingsSectionProps) {
	const t = useTranslations('settings')
	const ts = useTranslations('stripe')
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function handleConnect() {
		setError(null)
		startTransition(async () => {
			const result = hasAccount
				? await getStripeOnboardingLink()
				: await createStripeConnectAccount()

			if (result.success) {
				window.location.href = result.data.url
			} else {
				setError(ts('connectFailed'))
			}
		})
	}

	if (isComplete) {
		return (
			<div className="flex items-center justify-between">
				<div>
					<p className="font-sans text-sm font-medium text-foreground">
						{t('stripeConnected')}
					</p>
					<p className="mt-0.5 font-sans text-sm text-muted-foreground">
						{t('stripeConnectedDescription')}
					</p>
				</div>
				<Badge variant="secondary">{t('active')}</Badge>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="font-sans text-sm font-medium text-foreground">
					{hasAccount ? ts('incompleteTitle') : ts('connectTitle')}
				</p>
				<p className="mt-0.5 font-sans text-sm text-muted-foreground">
					{hasAccount ? ts('incompleteDescription') : ts('connectDescription')}
				</p>
				{error && (
					<p role="alert" className="mt-1 font-sans text-sm text-destructive">
						{error}
					</p>
				)}
			</div>
			<Button
				variant="brand"
				size="sm"
				className="shrink-0"
				disabled={isPending}
				onClick={handleConnect}
			>
				{isPending
					? ts('connecting')
					: hasAccount
						? ts('resumeOnboarding')
						: ts('connectCta')}
			</Button>
		</div>
	)
}
