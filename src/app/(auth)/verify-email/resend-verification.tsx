'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { resendVerificationEmail } from './actions'

interface ResendVerificationProps {
	email: string
}

export function ResendVerification({ email }: ResendVerificationProps) {
	const t = useTranslations('auth')
	const [isPending, startTransition] = useTransition()
	const [sent, setSent] = useState(false)

	function handleResend() {
		startTransition(async () => {
			await resendVerificationEmail(email)
			setSent(true)
		})
	}

	if (sent) {
		return (
			<p className="font-sans text-sm text-brand">{t('verificationResent')}</p>
		)
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<p className="font-sans text-xs text-muted-foreground">
				{t('didntReceiveEmail')}
			</p>
			<Button
				variant="ghost"
				size="sm"
				onClick={handleResend}
				disabled={isPending}
			>
				{isPending ? t('resending') : t('resendVerification')}
			</Button>
		</div>
	)
}
