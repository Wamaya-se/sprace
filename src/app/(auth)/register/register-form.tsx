'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionError } from '@/hooks/use-action-error'
import { registerWithEmail } from './actions'

interface RegisterFormProps {
	role: 'creator' | 'business'
}

export function RegisterForm({ role }: RegisterFormProps) {
	const t = useTranslations('auth')
	const te = useActionError()
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsLoading(true)
		setError(null)

		const formData = new FormData(e.currentTarget)
		const password = formData.get('password') as string
		const confirmPassword = formData.get('confirmPassword') as string

		if (password !== confirmPassword) {
			setError(t('passwordsNoMatch'))
			setIsLoading(false)
			return
		}

		try {
			const result = await registerWithEmail(formData)

			if (result && !result.success) {
				setError(te(result.error))
			} else if (result?.success && result.data.needsEmailConfirmation) {
				const email = formData.get('email') as string
				router.push(
					`/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`,
				)
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<input type="hidden" name="role" value={role} />

			{error && (
				<div
					role="alert"
					className="rounded-lg bg-destructive/10 px-4 py-3 font-sans text-sm text-destructive"
				>
					{error}
				</div>
			)}

			<div className="flex flex-col gap-2">
				<Label htmlFor="fullName">{t('fullName')}</Label>
				<Input
					id="fullName"
					name="fullName"
					type="text"
					placeholder={t('fullNamePlaceholder')}
					required
					autoComplete="name"
				/>
			</div>

			{role === 'creator' && (
				<div className="flex flex-col gap-2">
					<Label htmlFor="displayName">{t('displayName')}</Label>
					<Input
						id="displayName"
						name="displayName"
						type="text"
						placeholder={t('displayNamePlaceholder')}
						required
						autoComplete="off"
					/>
				</div>
			)}

			{role === 'business' && (
				<div className="flex flex-col gap-2">
					<Label htmlFor="companyName">{t('companyName')}</Label>
					<Input
						id="companyName"
						name="companyName"
						type="text"
						placeholder={t('companyNamePlaceholder')}
						required
						autoComplete="organization"
					/>
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
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="password">{t('password')}</Label>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder={t('passwordPlaceholder')}
					required
					autoComplete="new-password"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					placeholder={t('passwordPlaceholder')}
					required
					autoComplete="new-password"
				/>
			</div>

			<div className="flex items-start gap-3">
				<input
					id="tosConsent"
					name="tosConsent"
					type="checkbox"
					required
					className="mt-1 h-4 w-4 shrink-0 rounded border-outline-variant/20 bg-surface-dim text-brand accent-brand focus:ring-2 focus:ring-tertiary/20"
				/>
				<Label htmlFor="tosConsent" className="text-xs leading-relaxed">
					{t('tosConsentPrefix')}{' '}
					<Link
						href="/terms"
						target="_blank"
						className="text-brand hover:text-brand-container"
					>
						{t('termsOfService')}
					</Link>{' '}
					{t('tosConsentAnd')}{' '}
					<Link
						href="/privacy"
						target="_blank"
						className="text-brand hover:text-brand-container"
					>
						{t('privacyPolicy')}
					</Link>
				</Label>
			</div>

			<Button
				type="submit"
				disabled={isLoading}
				size="lg"
				className="mt-2 w-full"
			>
				{isLoading ? t('creatingAccount') : t('createAccount')}
			</Button>
		</form>
	)
}
