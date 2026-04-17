'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionError } from '@/hooks/use-action-error'
import { requestPasswordReset } from './actions'

export function ForgotPasswordForm() {
	const t = useTranslations('auth')
	const te = useActionError()
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [sent, setSent] = useState(false)

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsLoading(true)
		setError(null)

		try {
			const formData = new FormData(e.currentTarget)
			const result = await requestPasswordReset(formData)

			if (result.success) {
				setSent(true)
			} else {
				setError(te(result.error))
			}
		} finally {
			setIsLoading(false)
		}
	}

	if (sent) {
		return (
			<div className="flex flex-col items-center gap-4 py-8 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
					<svg
						className="h-8 w-8 text-brand"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<h2 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground">
					{t('resetEmailSent')}
				</h2>
				<p className="max-w-xs font-sans text-sm leading-[1.7] text-muted-foreground">
					{t('resetEmailSentDescription')}
				</p>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{error && (
				<div
					id="forgot-error"
					role="alert"
					className="rounded-lg bg-destructive/10 px-4 py-3 font-sans text-sm text-destructive"
				>
					{error}
				</div>
			)}

			<div className="flex flex-col gap-2">
				<Label htmlFor="email">{t('email')}</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder={t('emailPlaceholder')}
					required
					autoComplete="email"
					aria-invalid={!!error}
					aria-describedby={error ? 'forgot-error' : undefined}
				/>
			</div>

			<Button
				type="submit"
				disabled={isLoading}
				size="lg"
				className="mt-2 w-full"
			>
				{isLoading ? t('sendingResetLink') : t('sendResetLink')}
			</Button>
		</form>
	)
}
