'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { resetOnboardingTour } from '@/lib/actions/onboarding'

/**
 * Settings → "Replay product tour" action. Clears the stored tour
 * version and re-navigates to the dashboard so the launcher mounts
 * fresh. Shown in the Data & Privacy-adjacent "Getting started"
 * section.
 */
export function ReplayTourSection() {
	const t = useTranslations('settings')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function handleReplay() {
		setError(null)
		startTransition(async () => {
			const result = await resetOnboardingTour()
			if (!result.success) {
				setError(t('replayTourFailed'))
				return
			}
			router.push('/dashboard')
			router.refresh()
		})
	}

	return (
		<div>
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('replayTourDescription')}
			</p>
			<div className="mt-3">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleReplay}
					disabled={isPending}
				>
					{isPending ? t('replayingTour') : t('replayTour')}
				</Button>
			</div>
			{error && (
				<p role="alert" className="mt-2 font-sans text-sm text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
