'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionError } from '@/hooks/use-action-error'
import { updatePassword } from './actions'

export function ResetPasswordForm() {
	const t = useTranslations('auth')
	const te = useActionError()
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsLoading(true)
		setError(null)

		const formData = new FormData(e.currentTarget)
		const password = String(formData.get('password') ?? '')
		const confirmPassword = String(formData.get('confirmPassword') ?? '')

		if (password !== confirmPassword) {
			setError(t('passwordsNoMatch'))
			setIsLoading(false)
			return
		}

		try {
			const result = await updatePassword(formData)

			if (result && !result.success) {
				setError(te(result.error))
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{error && (
				<div
					id="reset-error"
					role="alert"
					className="rounded-lg bg-destructive/10 px-4 py-3 font-sans text-sm text-destructive"
				>
					{error}
				</div>
			)}

			<div className="flex flex-col gap-2">
				<Label htmlFor="password">{t('newPassword')}</Label>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder={t('passwordPlaceholder')}
					required
					minLength={6}
					autoComplete="new-password"
					aria-invalid={!!error}
					aria-describedby={error ? 'reset-error' : undefined}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					placeholder={t('passwordPlaceholder')}
					required
					minLength={6}
					autoComplete="new-password"
				/>
			</div>

			<Button
				type="submit"
				disabled={isLoading}
				size="lg"
				className="mt-2 w-full"
			>
				{isLoading ? t('updatingPassword') : t('updatePassword')}
			</Button>
		</form>
	)
}
