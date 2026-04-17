'use client'

import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface SpecialtiesStepProps {
	specialties: { id: string; name: string; slug: string }[]
	markets: {
		id: string
		name: string
		slug: string
		flag_emoji: string | null
	}[]
	selectedSpecialtyIds: string[]
	selectedMarketIds: string[]
	onToggleSpecialty: (id: string) => void
	onToggleMarket: (id: string) => void
	errors: Record<string, string | undefined>
}

const MAX_SPECIALTIES = 5

export function SpecialtiesStep({
	specialties,
	markets,
	selectedSpecialtyIds,
	selectedMarketIds,
	onToggleSpecialty,
	onToggleMarket,
	errors,
}: SpecialtiesStepProps) {
	const t = useTranslations('onboarding')

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-3">
				<Label>{t('specialties')}</Label>
				<div
					role="group"
					aria-label={t('specialties')}
					className="flex flex-wrap gap-2"
				>
					{specialties.map((s) => {
						const isSelected = selectedSpecialtyIds.includes(s.id)
						const isDisabled =
							!isSelected && selectedSpecialtyIds.length >= MAX_SPECIALTIES
						return (
							<Badge
								key={s.id}
								variant={isSelected ? 'chipActive' : 'chip'}
								className={isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
								render={
									<button
										type="button"
										role="checkbox"
										aria-checked={isSelected}
										disabled={isDisabled}
									/>
								}
								onClick={() => !isDisabled && onToggleSpecialty(s.id)}
							>
								{s.name}
							</Badge>
						)
					})}
				</div>
				{errors.specialtyIds ? (
					<p role="alert" className="font-sans text-xs text-destructive">
						{errors.specialtyIds}
					</p>
				) : (
					<p className="font-sans text-xs text-muted-foreground">
						{t('specialtiesHint')}
					</p>
				)}
			</div>

			<div className="flex flex-col gap-3">
				<Label>{t('markets')}</Label>
				<div
					role="group"
					aria-label={t('markets')}
					className="flex flex-wrap gap-2"
				>
					{markets.map((m) => {
						const isSelected = selectedMarketIds.includes(m.id)
						return (
							<Badge
								key={m.id}
								variant={isSelected ? 'chipActive' : 'chip'}
								render={
									<button
										type="button"
										role="checkbox"
										aria-checked={isSelected}
									/>
								}
								onClick={() => onToggleMarket(m.id)}
							>
								{m.flag_emoji ? `${m.flag_emoji} ` : ''}
								{m.name}
							</Badge>
						)
					})}
				</div>
				{errors.marketIds ? (
					<p role="alert" className="font-sans text-xs text-destructive">
						{errors.marketIds}
					</p>
				) : (
					<p className="font-sans text-xs text-muted-foreground">
						{t('marketsHint')}
					</p>
				)}
			</div>
		</div>
	)
}
