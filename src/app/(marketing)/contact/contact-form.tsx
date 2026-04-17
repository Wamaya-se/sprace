'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { useActionError } from '@/hooks/use-action-error'
import { submitContactForm } from './actions'

const SUBJECT_KEYS = [
	'general',
	'support',
	'press',
	'partnership',
	'other',
] as const

export function ContactForm() {
	const t = useTranslations('contactPage')
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
			const result = await submitContactForm(formData)
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
			<div
				role="status"
				aria-live="polite"
				className="flex flex-col items-center gap-4 rounded-2xl bg-surface-container px-8 py-12 text-center"
			>
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
					<svg
						className="h-6 w-6 text-brand"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
				<h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
					{t('sentTitle')}
				</h3>
				<p className="max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
					{t('sentBody')}
				</p>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
			{error && (
				<div
					id="contact-error"
					role="alert"
					className="rounded-lg bg-destructive/10 px-4 py-3 font-sans text-sm text-destructive"
				>
					{error}
				</div>
			)}

			{/* Honeypot — real users never see this field; bots fill it in. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
			>
				<label>
					Website
					<input type="text" name="website" tabIndex={-1} autoComplete="off" />
				</label>
			</div>

			<div className="grid gap-5 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<Label htmlFor="name">{t('nameLabel')}</Label>
					<Input
						id="name"
						name="name"
						type="text"
						required
						minLength={2}
						maxLength={120}
						autoComplete="name"
						aria-invalid={!!error}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="email">{t('emailLabel')}</Label>
					<Input
						id="email"
						name="email"
						type="email"
						required
						maxLength={255}
						autoComplete="email"
						aria-invalid={!!error}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="company">{t('companyLabel')}</Label>
				<Input
					id="company"
					name="company"
					type="text"
					maxLength={255}
					autoComplete="organization"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="subject">{t('subjectLabel')}</Label>
				<NativeSelect id="subject" name="subject" required defaultValue="">
					<option value="" disabled>
						{t('subjectPlaceholder')}
					</option>
					{SUBJECT_KEYS.map((key) => (
						<option key={key} value={key}>
							{t(`subject_${key}`)}
						</option>
					))}
				</NativeSelect>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="message">{t('messageLabel')}</Label>
				<Textarea
					id="message"
					name="message"
					required
					minLength={20}
					maxLength={5000}
					rows={6}
					aria-invalid={!!error}
					aria-describedby={error ? 'contact-error' : undefined}
					placeholder={t('messagePlaceholder')}
				/>
				<p className="font-sans text-xs text-muted-foreground">
					{t('messageHelper')}
				</p>
			</div>

			<Button
				type="submit"
				disabled={isLoading}
				size="lg"
				className="mt-2 w-full sm:w-auto"
			>
				{isLoading ? t('sending') : t('submit')}
			</Button>
		</form>
	)
}
