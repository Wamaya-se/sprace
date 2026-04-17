'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function MarketingError({ error, reset }: ErrorPageProps) {
	const t = useTranslations('common')

	useEffect(() => {
		console.error('[MarketingError]', error)
	}, [error])

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
			<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
				{t('errorTitle')}
			</h1>
			<p className="max-w-md text-center font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('errorDescription')}
			</p>
			<Button onClick={reset}>{t('tryAgain')}</Button>
		</div>
	)
}
