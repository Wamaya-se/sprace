'use client'

import { useRef, useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface PhotoStepProps {
	avatarPreview: string | null
	existingAvatarUrl: string | null
	onAvatarChange: (file: File | null) => void
	displayName: string
	bio: string
	specialties: { id: string; name: string }[]
	markets: { id: string; name: string; flag_emoji: string | null }[]
	selectedSpecialtyIds: string[]
	selectedMarketIds: string[]
	hourlyRate: string
	portfolioUrl: string
	instagramHandle: string
	tiktokHandle: string
	youtubeHandle: string
	errors: Record<string, string | undefined>
}

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function PhotoStep({
	avatarPreview,
	existingAvatarUrl,
	onAvatarChange,
	displayName,
	bio,
	specialties,
	markets,
	selectedSpecialtyIds,
	selectedMarketIds,
	hourlyRate,
	portfolioUrl,
	instagramHandle,
	tiktokHandle,
	youtubeHandle,
	errors,
}: PhotoStepProps) {
	const t = useTranslations('onboarding')
	const inputRef = useRef<HTMLInputElement>(null)
	const [isDragging, setIsDragging] = useState(false)

	const previewSrc = avatarPreview || existingAvatarUrl

	const handleFile = useCallback(
		(file: File | null) => {
			if (!file) return
			if (file.size > MAX_SIZE || !ALLOWED_TYPES.includes(file.type)) return
			onAvatarChange(file)
		},
		[onAvatarChange],
	)

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setIsDragging(false)
			const file = e.dataTransfer.files[0]
			if (file) handleFile(file)
		},
		[handleFile],
	)

	const selectedSpecialtyNames = specialties
		.filter((s) => selectedSpecialtyIds.includes(s.id))
		.map((s) => s.name)

	const selectedMarketNames = markets
		.filter((m) => selectedMarketIds.includes(m.id))
		.map((m) => `${m.flag_emoji ? m.flag_emoji + ' ' : ''}${m.name}`)

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-3">
				<Label>{t('avatar')}</Label>
				<p className="font-sans text-xs text-muted-foreground">
					{t('avatarHint')}
				</p>

				<div
					role="button"
					tabIndex={0}
					aria-label={t('avatarDrop')}
					onClick={() => inputRef.current?.click()}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							inputRef.current?.click()
						}
					}}
					onDragOver={(e) => {
						e.preventDefault()
						setIsDragging(true)
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={handleDrop}
					className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 ${
						isDragging
							? 'border-tertiary/60 bg-tertiary/5'
							: 'border-outline-variant/20 bg-surface-container hover:border-outline-variant/40'
					} ${errors.avatar ? 'border-destructive/50' : ''} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50`}
				>
					{previewSrc ? (
						<div className="flex flex-col items-center gap-3">
							{/* eslint-disable-next-line @next/next/no-img-element -- previewSrc may be a blob: URL from a local File */}
							<img
								src={previewSrc}
								alt={displayName}
								className="h-24 w-24 rounded-full object-cover"
							/>
							<span className="font-sans text-sm text-brand">
								{t('avatarChange')}
							</span>
						</div>
					) : (
						<>
							<svg
								className="h-10 w-10 text-foreground/20"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
								/>
							</svg>
							<span className="font-sans text-sm text-muted-foreground">
								{t('avatarDrop')}
							</span>
						</>
					)}
				</div>

				<input
					ref={inputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					className="sr-only"
					aria-hidden="true"
					tabIndex={-1}
					onChange={(e) => {
						const file = e.target.files?.[0]
						if (file) handleFile(file)
					}}
				/>
				{errors.avatar && (
					<p role="alert" className="font-sans text-xs text-destructive">
						{errors.avatar}
					</p>
				)}
			</div>

			<div className="flex flex-col gap-4">
				<h3 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
					{t('reviewTitle')}
				</h3>

				<div className="rounded-xl bg-surface-container p-5">
					<div className="flex flex-col gap-4">
						<ReviewRow label={t('displayName')} value={displayName} />
						<ReviewRow label={t('bio')} value={bio} />

						<div>
							<p className="mb-1.5 font-sans text-xs font-medium text-muted-foreground">
								{t('reviewSpecialties')}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{selectedSpecialtyNames.length > 0 ? (
									selectedSpecialtyNames.map((n) => (
										<Badge key={n} variant="default">
											{n}
										</Badge>
									))
								) : (
									<span className="font-sans text-sm text-muted-foreground">
										{t('notSet')}
									</span>
								)}
							</div>
						</div>

						<div>
							<p className="mb-1.5 font-sans text-xs font-medium text-muted-foreground">
								{t('reviewMarkets')}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{selectedMarketNames.length > 0 ? (
									selectedMarketNames.map((n) => (
										<Badge key={n} variant="secondary">
											{n}
										</Badge>
									))
								) : (
									<span className="font-sans text-sm text-muted-foreground">
										{t('notSet')}
									</span>
								)}
							</div>
						</div>

						<ReviewRow
							label={t('reviewRate')}
							value={
								hourlyRate
									? t('rateFormatted', { rate: hourlyRate })
									: undefined
							}
						/>
						<ReviewRow
							label={t('reviewPortfolio')}
							value={portfolioUrl || undefined}
						/>

						{(instagramHandle || tiktokHandle || youtubeHandle) && (
							<div>
								<p className="mb-1.5 font-sans text-xs font-medium text-muted-foreground">
									{t('reviewSocial')}
								</p>
								<div className="flex flex-wrap gap-2">
									{instagramHandle && (
										<Badge variant="outline">
											@{instagramHandle.replace(/^@/, '')}
										</Badge>
									)}
									{tiktokHandle && (
										<Badge variant="outline">
											@{tiktokHandle.replace(/^@/, '')}
										</Badge>
									)}
									{youtubeHandle && (
										<Badge variant="outline">
											{youtubeHandle.replace(/^@/, '')}
										</Badge>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
	const t = useTranslations('onboarding')
	return (
		<div>
			<p className="mb-0.5 font-sans text-xs font-medium text-muted-foreground">
				{label}
			</p>
			<p className="font-sans text-sm text-foreground/80">
				{value || t('notSet')}
			</p>
		</div>
	)
}
