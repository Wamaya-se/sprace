'use client'

import { useState, useTransition, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useActionError } from '@/hooks/use-action-error'
import { FormAlert } from '@/components/shared/form-alert'
import {
	updateCreatorAbout,
	updateCreatorSpecialtiesMarkets,
	updateCreatorLinks,
	updateCreatorAvatar,
} from './edit-actions'
import { SectionEditorHeader } from './sections/section-editor-header'
import { PhotoSection } from './sections/photo-section'
import { LinksSection } from './sections/links-section'
import { SpecialtiesSection } from './sections/specialties-section'

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
	status: string
}

interface ProfileViewProps {
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

type EditingSection = 'about' | 'specialties' | 'links' | 'photo' | null

export function ProfileView({
	creator,
	avatarUrl,
	specialties,
	markets,
	selectedSpecialtyIds,
	selectedMarketIds,
}: ProfileViewProps) {
	const t = useTranslations('onboarding')
	const td = useTranslations('dashboard')
	const te = useActionError()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [editing, setEditing] = useState<EditingSection>(null)
	const [error, setError] = useState<string | null>(null)

	const [displayName, setDisplayName] = useState(creator.display_name)
	const [bio, setBio] = useState(creator.bio || '')

	const [specIds, setSpecIds] = useState<string[]>(selectedSpecialtyIds)
	const [mktIds, setMktIds] = useState<string[]>(selectedMarketIds)

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

	const startEdit = useCallback((section: EditingSection) => {
		setEditing(section)
		setError(null)
	}, [])

	const cancelEdit = useCallback(() => {
		setDisplayName(creator.display_name)
		setBio(creator.bio || '')
		setSpecIds(selectedSpecialtyIds)
		setMktIds(selectedMarketIds)
		setHourlyRate(creator.hourly_rate?.toString() || '')
		setPortfolioUrl(creator.portfolio_url || '')
		setInstagramHandle(creator.instagram_handle || '')
		setTiktokHandle(creator.tiktok_handle || '')
		setYoutubeHandle(creator.youtube_handle || '')
		setAvatarFile(null)
		setEditing(null)
		setError(null)
	}, [creator, selectedSpecialtyIds, selectedMarketIds])

	function handleSave() {
		setError(null)
		startTransition(async () => {
			let result

			switch (editing) {
				case 'about':
					result = await updateCreatorAbout(displayName.trim(), bio.trim())
					break
				case 'specialties':
					result = await updateCreatorSpecialtiesMarkets(specIds, mktIds)
					break
				case 'links':
					result = await updateCreatorLinks({
						hourlyRate,
						portfolioUrl,
						instagramHandle,
						tiktokHandle,
						youtubeHandle,
					})
					break
				case 'photo': {
					const formData = new FormData()
					if (avatarFile) formData.set('avatar', avatarFile)
					result = await updateCreatorAvatar(formData)
					break
				}
				default:
					return
			}

			if (!result.success) {
				setError(te(result.error))
			} else {
				setEditing(null)
				setAvatarFile(null)
				router.refresh()
			}
		})
	}

	const initial = creator.display_name?.charAt(0)?.toUpperCase() || '?'

	const statusLabel =
		{
			draft: td('statusDraft'),
			pending_review: td('statusPendingReview'),
			active: td('statusActive'),
			suspended: td('statusSuspended'),
		}[creator.status] || creator.status

	const statusVariant =
		{
			active: 'default' as const,
			pending_review: 'secondary' as const,
			suspended: 'outline' as const,
			draft: 'outline' as const,
		}[creator.status] || ('outline' as const)

	const selectedSpecialties = specialties.filter((s) =>
		selectedSpecialtyIds.includes(s.id),
	)
	const selectedMarkets = markets.filter((m) =>
		selectedMarketIds.includes(m.id),
	)

	return (
		<div className="mx-auto max-w-lg space-y-4">
			<div className="flex items-center gap-4">
				{avatarUrl ? (
					<Image
						src={avatarUrl}
						alt={creator.display_name}
						width={64}
						height={64}
						className="h-16 w-16 rounded-full object-cover"
					/>
				) : (
					<Avatar className="h-16 w-16">
						<AvatarFallback className="text-lg">{initial}</AvatarFallback>
					</Avatar>
				)}
				<div className="min-w-0 flex-1">
					<h2 className="truncate font-heading text-lg font-bold tracking-[-0.02em] text-foreground">
						{creator.display_name}
					</h2>
					{creator.slug && (
						<p className="font-sans text-xs text-muted-foreground">
							@{creator.slug}
						</p>
					)}
					<div className="mt-1">
						<Badge variant={statusVariant}>{statusLabel}</Badge>
					</div>
				</div>
			</div>

			{error && <FormAlert variant="error">{error}</FormAlert>}

			<Card>
				<CardContent>
					<SectionEditorHeader
						title={td('sectionAbout')}
						isEditing={editing === 'about'}
						onEdit={() => startEdit('about')}
						onSave={handleSave}
						onCancel={cancelEdit}
						isPending={isPending}
						editLabel={td('editSection')}
						saveLabel={isPending ? td('savingSection') : td('saveSection')}
						cancelLabel={td('cancelEdit')}
						disabled={editing !== null && editing !== 'about'}
						canSave={!!displayName.trim() && !!bio.trim()}
					/>

					{editing === 'about' ? (
						<div className="mt-4 space-y-4">
							<div>
								<Label htmlFor="edit-display-name">{t('displayName')}</Label>
								<Input
									id="edit-display-name"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									placeholder={t('displayNamePlaceholder')}
									className="mt-1.5"
								/>
							</div>
							<div>
								<Label htmlFor="edit-bio">{t('bio')}</Label>
								<Textarea
									id="edit-bio"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									placeholder={t('bioPlaceholder')}
									maxLength={500}
									className="mt-1.5"
									rows={4}
								/>
								<p className="mt-1 font-sans text-xs text-muted-foreground">
									{t('bioHint', { count: bio.length })}
								</p>
							</div>
						</div>
					) : (
						<div className="mt-3">
							<p className="font-sans text-sm font-medium text-foreground">
								{creator.display_name}
							</p>
							{creator.bio && (
								<p className="mt-1 font-sans text-sm leading-[1.7] text-foreground/60">
									{creator.bio}
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			<SpecialtiesSection
				specialties={specialties}
				markets={markets}
				specIds={specIds}
				mktIds={mktIds}
				setSpecIds={setSpecIds}
				setMktIds={setMktIds}
				selectedSpecialties={selectedSpecialties}
				selectedMarkets={selectedMarkets}
				isEditing={editing === 'specialties'}
				onEdit={() => startEdit('specialties')}
				onSave={handleSave}
				onCancel={cancelEdit}
				isPending={isPending}
				otherEditing={editing !== null && editing !== 'specialties'}
			/>

			<LinksSection
				hourlyRate={hourlyRate}
				portfolioUrl={portfolioUrl}
				instagramHandle={instagramHandle}
				tiktokHandle={tiktokHandle}
				youtubeHandle={youtubeHandle}
				setHourlyRate={setHourlyRate}
				setPortfolioUrl={setPortfolioUrl}
				setInstagramHandle={setInstagramHandle}
				setTiktokHandle={setTiktokHandle}
				setYoutubeHandle={setYoutubeHandle}
				persistedRate={creator.hourly_rate}
				persistedPortfolioUrl={creator.portfolio_url}
				persistedInstagram={creator.instagram_handle}
				persistedTiktok={creator.tiktok_handle}
				persistedYoutube={creator.youtube_handle}
				isEditing={editing === 'links'}
				onEdit={() => startEdit('links')}
				onSave={handleSave}
				onCancel={cancelEdit}
				isPending={isPending}
				otherEditing={editing !== null && editing !== 'links'}
			/>

			<PhotoSection
				displayName={creator.display_name}
				initial={initial}
				avatarUrl={avatarUrl}
				avatarFile={avatarFile}
				setAvatarFile={setAvatarFile}
				isEditing={editing === 'photo'}
				onEdit={() => startEdit('photo')}
				onSave={handleSave}
				onCancel={cancelEdit}
				isPending={isPending}
				otherEditing={editing !== null && editing !== 'photo'}
			/>
		</div>
	)
}
