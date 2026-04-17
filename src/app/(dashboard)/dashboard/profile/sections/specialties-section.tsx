'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SectionEditorHeader } from './section-editor-header'

interface SpecialtyOption {
	id: string
	name: string
	slug: string
}

interface MarketOption {
	id: string
	name: string
	slug: string
	flag_emoji: string | null
}

interface SpecialtiesSectionProps {
	specialties: SpecialtyOption[]
	markets: MarketOption[]
	specIds: string[]
	mktIds: string[]
	setSpecIds: (updater: (prev: string[]) => string[]) => void
	setMktIds: (updater: (prev: string[]) => string[]) => void
	selectedSpecialties: SpecialtyOption[]
	selectedMarkets: MarketOption[]
	isEditing: boolean
	onEdit: () => void
	onSave: () => void
	onCancel: () => void
	isPending: boolean
	otherEditing: boolean
}

export function SpecialtiesSection({
	specialties,
	markets,
	specIds,
	mktIds,
	setSpecIds,
	setMktIds,
	selectedSpecialties,
	selectedMarkets,
	isEditing,
	onEdit,
	onSave,
	onCancel,
	isPending,
	otherEditing,
}: SpecialtiesSectionProps) {
	const t = useTranslations('onboarding')
	const td = useTranslations('dashboard')

	return (
		<Card>
			<CardContent>
				<SectionEditorHeader
					title={td('sectionSpecialties')}
					isEditing={isEditing}
					onEdit={onEdit}
					onSave={onSave}
					onCancel={onCancel}
					isPending={isPending}
					editLabel={td('editSection')}
					saveLabel={isPending ? td('savingSection') : td('saveSection')}
					cancelLabel={td('cancelEdit')}
					disabled={otherEditing}
					canSave={specIds.length > 0 && mktIds.length > 0}
				/>

				{isEditing ? (
					<div className="mt-4 space-y-4">
						<div>
							<p className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
								{t('specialties')}
							</p>
							<p className="mb-2 font-sans text-xs text-muted-foreground">
								{t('specialtiesHint')}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{specialties.map((s) => {
									const selected = specIds.includes(s.id)
									return (
										<Badge
											key={s.id}
											variant={selected ? 'chipActive' : 'chip'}
											render={<button type="button" />}
											onClick={() => {
												setSpecIds((prev) =>
													selected
														? prev.filter((id) => id !== s.id)
														: prev.length < 5
															? [...prev, s.id]
															: prev,
												)
											}}
										>
											{s.name}
										</Badge>
									)
								})}
							</div>
						</div>
						<Separator />
						<div>
							<p className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
								{t('markets')}
							</p>
							<p className="mb-2 font-sans text-xs text-muted-foreground">
								{t('marketsHint')}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{markets.map((m) => {
									const selected = mktIds.includes(m.id)
									return (
										<Badge
											key={m.id}
											variant={selected ? 'chipActive' : 'chip'}
											render={<button type="button" />}
											onClick={() => {
												setMktIds((prev) =>
													selected
														? prev.filter((id) => id !== m.id)
														: [...prev, m.id],
												)
											}}
										>
											{m.flag_emoji && (
												<span className="mr-0.5" aria-hidden="true">
													{m.flag_emoji}
												</span>
											)}
											{m.name}
										</Badge>
									)
								})}
							</div>
						</div>
					</div>
				) : (
					<div className="mt-3 space-y-3">
						{selectedSpecialties.length > 0 && (
							<div>
								<p className="mb-1.5 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
									{t('reviewSpecialties')}
								</p>
								<div className="flex flex-wrap gap-1.5">
									{selectedSpecialties.map((s) => (
										<Badge key={s.id} variant="outline">
											{s.name}
										</Badge>
									))}
								</div>
							</div>
						)}
						{selectedMarkets.length > 0 && (
							<div>
								<p className="mb-1.5 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
									{t('reviewMarkets')}
								</p>
								<div className="flex flex-wrap gap-1.5">
									{selectedMarkets.map((m) => (
										<Badge key={m.id} variant="outline">
											{m.flag_emoji && (
												<span className="mr-1" aria-hidden="true">
													{m.flag_emoji}
												</span>
											)}
											{m.name}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
