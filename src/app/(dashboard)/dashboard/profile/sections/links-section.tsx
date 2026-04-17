'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SectionEditorHeader } from './section-editor-header'

interface LinksState {
	hourlyRate: string
	portfolioUrl: string
	instagramHandle: string
	tiktokHandle: string
	youtubeHandle: string
}

interface LinksSectionProps extends LinksState {
	setHourlyRate: (value: string) => void
	setPortfolioUrl: (value: string) => void
	setInstagramHandle: (value: string) => void
	setTiktokHandle: (value: string) => void
	setYoutubeHandle: (value: string) => void
	persistedRate: number | null
	persistedPortfolioUrl: string | null
	persistedInstagram: string | null
	persistedTiktok: string | null
	persistedYoutube: string | null
	isEditing: boolean
	onEdit: () => void
	onSave: () => void
	onCancel: () => void
	isPending: boolean
	otherEditing: boolean
}

export function LinksSection({
	hourlyRate,
	portfolioUrl,
	instagramHandle,
	tiktokHandle,
	youtubeHandle,
	setHourlyRate,
	setPortfolioUrl,
	setInstagramHandle,
	setTiktokHandle,
	setYoutubeHandle,
	persistedRate,
	persistedPortfolioUrl,
	persistedInstagram,
	persistedTiktok,
	persistedYoutube,
	isEditing,
	onEdit,
	onSave,
	onCancel,
	isPending,
	otherEditing,
}: LinksSectionProps) {
	const t = useTranslations('onboarding')
	const td = useTranslations('dashboard')

	const hasNoLinks =
		!persistedRate &&
		!persistedPortfolioUrl &&
		!persistedInstagram &&
		!persistedTiktok &&
		!persistedYoutube

	return (
		<Card>
			<CardContent>
				<SectionEditorHeader
					title={td('sectionLinks')}
					isEditing={isEditing}
					onEdit={onEdit}
					onSave={onSave}
					onCancel={onCancel}
					isPending={isPending}
					editLabel={td('editSection')}
					saveLabel={isPending ? td('savingSection') : td('saveSection')}
					cancelLabel={td('cancelEdit')}
					disabled={otherEditing}
					canSave={true}
				/>

				{isEditing ? (
					<div className="mt-4 space-y-4">
						<div>
							<Label htmlFor="edit-rate">{t('hourlyRate')}</Label>
							<Input
								id="edit-rate"
								type="number"
								value={hourlyRate}
								onChange={(e) => setHourlyRate(e.target.value)}
								placeholder={t('hourlyRatePlaceholder')}
								className="mt-1.5"
							/>
						</div>
						<div>
							<Label htmlFor="edit-portfolio">{t('portfolioUrl')}</Label>
							<Input
								id="edit-portfolio"
								value={portfolioUrl}
								onChange={(e) => setPortfolioUrl(e.target.value)}
								placeholder={t('portfolioUrlPlaceholder')}
								className="mt-1.5"
							/>
						</div>
						<Separator />
						<p className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
							{t('socialLinks')}
						</p>
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label htmlFor="edit-ig">{t('instagramHandle')}</Label>
								<Input
									id="edit-ig"
									value={instagramHandle}
									onChange={(e) => setInstagramHandle(e.target.value)}
									placeholder={t('instagramPlaceholder')}
									className="mt-1.5"
								/>
							</div>
							<div>
								<Label htmlFor="edit-tt">{t('tiktokHandle')}</Label>
								<Input
									id="edit-tt"
									value={tiktokHandle}
									onChange={(e) => setTiktokHandle(e.target.value)}
									placeholder={t('tiktokPlaceholder')}
									className="mt-1.5"
								/>
							</div>
							<div>
								<Label htmlFor="edit-yt">{t('youtubeHandle')}</Label>
								<Input
									id="edit-yt"
									value={youtubeHandle}
									onChange={(e) => setYoutubeHandle(e.target.value)}
									placeholder={t('youtubePlaceholder')}
									className="mt-1.5"
								/>
							</div>
						</div>
					</div>
				) : (
					<div className="mt-3 space-y-2">
						{persistedRate && (
							<div className="flex justify-between">
								<span className="font-sans text-xs text-muted-foreground">
									{t('reviewRate')}
								</span>
								<span className="font-sans text-sm text-foreground/70">
									{t('rateFormatted', { rate: persistedRate })}
								</span>
							</div>
						)}
						{persistedPortfolioUrl && (
							<div className="flex justify-between">
								<span className="font-sans text-xs text-muted-foreground">
									{t('reviewPortfolio')}
								</span>
								<a
									href={persistedPortfolioUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="truncate font-sans text-sm text-brand hover:underline"
								>
									{persistedPortfolioUrl}
								</a>
							</div>
						)}
						{(persistedInstagram || persistedTiktok || persistedYoutube) && (
							<>
								<Separator className="my-2" />
								<div className="flex flex-wrap gap-3">
									{persistedInstagram && (
										<span className="font-sans text-sm text-foreground/70">
											{t('instagramDisplay', { handle: persistedInstagram })}
										</span>
									)}
									{persistedTiktok && (
										<span className="font-sans text-sm text-foreground/70">
											{t('tiktokDisplay', { handle: persistedTiktok })}
										</span>
									)}
									{persistedYoutube && (
										<span className="font-sans text-sm text-foreground/70">
											{t('youtubeDisplay', { handle: persistedYoutube })}
										</span>
									)}
								</div>
							</>
						)}
						{hasNoLinks && (
							<p className="font-sans text-sm text-muted-foreground">
								{t('notSet')}
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
