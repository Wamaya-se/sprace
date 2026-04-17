'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useActionError } from '@/hooks/use-action-error'
import { AboutStep } from './steps/about-step'
import { SpecialtiesStep } from './steps/specialties-step'
import { RatesStep } from './steps/rates-step'
import { PhotoStep } from './steps/photo-step'
import { saveCreatorProfile } from './actions'

interface CreatorData {
	id: string
	display_name: string
	bio: string | null
	portfolio_url: string | null
	instagram_handle: string | null
	tiktok_handle: string | null
	youtube_handle: string | null
	hourly_rate: number | null
	slug: string | null
}

interface OnboardingWizardProps {
	creator: CreatorData
	avatarUrl: string | null
	specialties: { id: string; name: string; slug: string }[]
	markets: {
		id: string
		name: string
		slug: string
		flag_emoji: string | null
	}[]
	selectedSpecialtyIds: string[]
	selectedMarketIds: string[]
}

const TOTAL_STEPS = 4

export function OnboardingWizard({
	creator,
	avatarUrl,
	specialties,
	markets,
	selectedSpecialtyIds: initialSpecialtyIds,
	selectedMarketIds: initialMarketIds,
}: OnboardingWizardProps) {
	const t = useTranslations('onboarding')
	const te = useActionError()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const [step, setStep] = useState(0)
	const [errors, setErrors] = useState<Record<string, string | undefined>>({})
	const [serverError, setServerError] = useState<string | null>(null)
	const [isSuccess, setIsSuccess] = useState(false)

	const [displayName, setDisplayName] = useState(creator.display_name || '')
	const [bio, setBio] = useState(creator.bio || '')
	const [specialtyIds, setSpecialtyIds] =
		useState<string[]>(initialSpecialtyIds)
	const [marketIds, setMarketIds] = useState<string[]>(initialMarketIds)
	const [hourlyRate, setHourlyRate] = useState(
		creator.hourly_rate?.toString() || '',
	)
	const [portfolioUrl, setPortfolioUrl] = useState(creator.portfolio_url || '')
	const [instagramHandle, setInstagramHandle] = useState(
		creator.instagram_handle || '',
	)
	const [tiktokHandle, setTiktokHandle] = useState(creator.tiktok_handle || '')
	const [youtubeHandle, setYoutubeHandle] = useState(
		creator.youtube_handle || '',
	)
	const [avatarFile, setAvatarFile] = useState<File | null>(null)
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

	const handleAvatarChange = useCallback((file: File | null) => {
		setAvatarFile(file)
		if (file) {
			const url = URL.createObjectURL(file)
			setAvatarPreview(url)
		} else {
			setAvatarPreview(null)
		}
	}, [])

	const handleToggleSpecialty = useCallback((id: string) => {
		setSpecialtyIds((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		)
		setErrors((prev) => ({ ...prev, specialtyIds: undefined }))
	}, [])

	const handleToggleMarket = useCallback((id: string) => {
		setMarketIds((prev) =>
			prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
		)
		setErrors((prev) => ({ ...prev, marketIds: undefined }))
	}, [])

	const handleFieldChange = useCallback((field: string, value: string) => {
		switch (field) {
			case 'hourlyRate':
				setHourlyRate(value)
				break
			case 'portfolioUrl':
				setPortfolioUrl(value)
				break
			case 'instagramHandle':
				setInstagramHandle(value)
				break
			case 'tiktokHandle':
				setTiktokHandle(value)
				break
			case 'youtubeHandle':
				setYoutubeHandle(value)
				break
		}
		setErrors((prev) => ({ ...prev, [field]: undefined }))
	}, [])

	const validateStep = useCallback(
		(stepIndex: number): boolean => {
			const newErrors: Record<string, string | undefined> = {}

			if (stepIndex === 0) {
				if (!displayName.trim())
					newErrors.displayName = t('displayNameRequired')
				if (!bio.trim()) newErrors.bio = t('bioRequired')
			}

			if (stepIndex === 1) {
				if (specialtyIds.length === 0)
					newErrors.specialtyIds = t('specialtiesMin')
				if (specialtyIds.length > 5)
					newErrors.specialtyIds = t('specialtiesMax')
				if (marketIds.length === 0) newErrors.marketIds = t('marketsMin')
			}

			if (stepIndex === 2) {
				if (portfolioUrl && !/^https?:\/\/.+/.test(portfolioUrl)) {
					newErrors.portfolioUrl = t('portfolioUrlInvalid')
				}
			}

			setErrors(newErrors)
			return Object.keys(newErrors).length === 0
		},
		[displayName, bio, specialtyIds, marketIds, portfolioUrl, t],
	)

	const goNext = useCallback(() => {
		if (!validateStep(step)) return
		setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
	}, [step, validateStep])

	const goBack = useCallback(() => {
		setErrors({})
		setStep((s) => Math.max(s - 1, 0))
	}, [])

	const handleSubmit = () => {
		if (!validateStep(step)) return
		setServerError(null)

		const formData = new FormData()
		formData.set('displayName', displayName.trim())
		formData.set('bio', bio.trim())
		specialtyIds.forEach((id) => formData.append('specialtyIds', id))
		marketIds.forEach((id) => formData.append('marketIds', id))
		formData.set('hourlyRate', hourlyRate)
		formData.set('portfolioUrl', portfolioUrl)
		formData.set('instagramHandle', instagramHandle)
		formData.set('tiktokHandle', tiktokHandle)
		formData.set('youtubeHandle', youtubeHandle)
		if (avatarFile) {
			formData.set('avatar', avatarFile)
		}

		startTransition(async () => {
			const result = await saveCreatorProfile(formData)
			if (result.success) {
				setIsSuccess(true)
			} else {
				setServerError(te(result.error))
			}
		})
	}

	const progressValue = ((step + 1) / TOTAL_STEPS) * 100

	if (isSuccess) {
		return (
			<div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-12 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/15">
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
							d="M4.5 12.75l6 6 9-13.5"
						/>
					</svg>
				</div>
				<h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
					{t('successTitle')}
				</h2>
				<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
					{t('successDescription')}
				</p>
				<Button variant="brand" onClick={() => router.push('/dashboard')}>
					{t('goToDashboard')}
				</Button>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-lg">
			<div className="mb-8">
				<h2 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground">
					{t('title')}
				</h2>
				<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
					{t('subtitle')}
				</p>
			</div>

			<div className="mb-8">
				<Progress
					value={progressValue}
					aria-label={t('stepOf', { current: step + 1, total: TOTAL_STEPS })}
				>
					<span className="font-sans text-xs text-muted-foreground">
						{t('stepOf', { current: step + 1, total: TOTAL_STEPS })}
					</span>
				</Progress>
			</div>

			<div className="relative overflow-hidden">
				<div
					key={step}
					className="animate-in fade-in"
					style={{
						animationDuration: '300ms',
						animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
					}}
				>
					{step === 0 && (
						<AboutStep
							displayName={displayName}
							bio={bio}
							onDisplayNameChange={(v) => {
								setDisplayName(v)
								setErrors((p) => ({ ...p, displayName: undefined }))
							}}
							onBioChange={(v) => {
								setBio(v)
								setErrors((p) => ({ ...p, bio: undefined }))
							}}
							errors={errors}
						/>
					)}

					{step === 1 && (
						<SpecialtiesStep
							specialties={specialties}
							markets={markets}
							selectedSpecialtyIds={specialtyIds}
							selectedMarketIds={marketIds}
							onToggleSpecialty={handleToggleSpecialty}
							onToggleMarket={handleToggleMarket}
							errors={errors}
						/>
					)}

					{step === 2 && (
						<RatesStep
							hourlyRate={hourlyRate}
							portfolioUrl={portfolioUrl}
							instagramHandle={instagramHandle}
							tiktokHandle={tiktokHandle}
							youtubeHandle={youtubeHandle}
							onFieldChange={handleFieldChange}
							errors={errors}
						/>
					)}

					{step === 3 && (
						<PhotoStep
							avatarPreview={avatarPreview}
							existingAvatarUrl={avatarUrl}
							onAvatarChange={handleAvatarChange}
							displayName={displayName}
							bio={bio}
							specialties={specialties}
							markets={markets}
							selectedSpecialtyIds={specialtyIds}
							selectedMarketIds={marketIds}
							hourlyRate={hourlyRate}
							portfolioUrl={portfolioUrl}
							instagramHandle={instagramHandle}
							tiktokHandle={tiktokHandle}
							youtubeHandle={youtubeHandle}
							errors={errors}
						/>
					)}
				</div>
			</div>

			{serverError && (
				<div role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3">
					<p className="font-sans text-sm text-destructive">{serverError}</p>
				</div>
			)}

			<div className="mt-8 flex items-center justify-between">
				{step > 0 ? (
					<Button
						type="button"
						variant="ghost"
						onClick={goBack}
						disabled={isPending}
					>
						{t('back')}
					</Button>
				) : (
					<div />
				)}

				{step < TOTAL_STEPS - 1 ? (
					<Button type="button" variant="brand" onClick={goNext}>
						{t('continue')}
					</Button>
				) : (
					<Button
						type="button"
						variant="brand"
						onClick={handleSubmit}
						disabled={isPending}
					>
						{isPending ? t('saving') : t('completeProfile')}
					</Button>
				)}
			</div>
		</div>
	)
}
