'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AboutStepProps {
	displayName: string
	bio: string
	onDisplayNameChange: (value: string) => void
	onBioChange: (value: string) => void
	errors: Record<string, string | undefined>
}

const BIO_MAX = 500

export function AboutStep({
	displayName,
	bio,
	onDisplayNameChange,
	onBioChange,
	errors,
}: AboutStepProps) {
	const t = useTranslations('onboarding')

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Label htmlFor="displayName">{t('displayName')}</Label>
				<Input
					id="displayName"
					type="text"
					value={displayName}
					onChange={(e) => onDisplayNameChange(e.target.value)}
					placeholder={t('displayNamePlaceholder')}
					maxLength={100}
					aria-invalid={!!errors.displayName}
					aria-describedby={
						errors.displayName ? 'displayName-error' : 'displayName-hint'
					}
					autoComplete="off"
				/>
				{errors.displayName ? (
					<p
						id="displayName-error"
						role="alert"
						className="font-sans text-xs text-destructive"
					>
						{errors.displayName}
					</p>
				) : (
					<p
						id="displayName-hint"
						className="font-sans text-xs text-muted-foreground"
					>
						{t('displayNameHint')}
					</p>
				)}
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="bio">{t('bio')}</Label>
				<Textarea
					id="bio"
					value={bio}
					onChange={(e) => {
						if (e.target.value.length <= BIO_MAX) {
							onBioChange(e.target.value)
						}
					}}
					placeholder={t('bioPlaceholder')}
					rows={5}
					maxLength={BIO_MAX}
					aria-invalid={!!errors.bio}
					aria-describedby={errors.bio ? 'bio-error' : 'bio-hint'}
				/>
				{errors.bio ? (
					<p
						id="bio-error"
						role="alert"
						className="font-sans text-xs text-destructive"
					>
						{errors.bio}
					</p>
				) : (
					<p id="bio-hint" className="font-sans text-xs text-muted-foreground">
						{t('bioHint', { count: bio.length })}
					</p>
				)}
			</div>
		</div>
	)
}
