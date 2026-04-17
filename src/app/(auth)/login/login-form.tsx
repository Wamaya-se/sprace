'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useActionError } from '@/hooks/use-action-error'
import { loginWithEmail, loginWithGoogle } from './actions'

export function LoginForm() {
	const t = useTranslations('auth')
	const te = useActionError()
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsLoading(true)
		setError(null)

		try {
			const formData = new FormData(e.currentTarget)
			const result = await loginWithEmail(formData)

			if (result && !result.success) {
				setError(te(result.error))
			}
		} finally {
			setIsLoading(false)
		}
	}

	async function handleGoogleLogin() {
		setIsLoading(true)
		setError(null)
		try {
			const result = await loginWithGoogle()
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
					aria-describedby={error ? 'login-error' : undefined}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<Label htmlFor="password">{t('password')}</Label>
					<Link
						href="/forgot-password"
						className="rounded-sm font-sans text-xs text-muted-foreground transition-opacity duration-200 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
					>
						{t('forgotPassword')}
					</Link>
				</div>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder={t('passwordPlaceholder')}
					required
					autoComplete="current-password"
					aria-invalid={!!error}
				/>
			</div>

			<Button
				type="submit"
				disabled={isLoading}
				size="lg"
				className="mt-2 w-full"
			>
				{isLoading ? t('loggingIn') : t('loginTitle')}
			</Button>

			<div className="relative my-2 flex items-center">
				<Separator className="flex-1" />
				<span className="px-3 font-sans text-xs text-muted-foreground">
					{t('orContinueWith')}
				</span>
				<Separator className="flex-1" />
			</div>

			<Button
				type="button"
				variant="outline"
				disabled={isLoading}
				onClick={handleGoogleLogin}
				size="lg"
				className="w-full"
			>
				<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
				Google
			</Button>
		</form>
	)
}
