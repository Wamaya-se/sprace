'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	createStripeConnectAccount,
	getStripeOnboardingLink,
} from '@/lib/actions/stripe'

interface StripeConnectBannerProps {
	hasAccount: boolean
}

export function StripeConnectBanner({ hasAccount }: StripeConnectBannerProps) {
	const t = useTranslations('stripe')
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
				setError(t('connectFailed'))
			}
		})
	}

	return (
		<Card className="bg-gradient-to-r from-brand/10 to-brand-container/10">
			<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
						{hasAccount ? t('incompleteTitle') : t('connectTitle')}
					</h2>
					<p className="mt-1 font-sans text-sm leading-[1.7] text-muted-foreground">
						{hasAccount ? t('incompleteDescription') : t('connectDescription')}
					</p>
					{error && (
						<p role="alert" className="mt-1 font-sans text-sm text-destructive">
							{error}
						</p>
					)}
				</div>
				<Button
					variant="brand"
					className="shrink-0"
					disabled={isPending}
					onClick={handleConnect}
				>
					{isPending
						? t('connecting')
						: hasAccount
							? t('resumeOnboarding')
							: t('connectCta')}
				</Button>
			</CardContent>
		</Card>
	)
}
