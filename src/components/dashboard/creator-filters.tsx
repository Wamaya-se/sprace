'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FilterOption {
	id: string
	name: string
	slug: string
	flag_emoji?: string | null
}

interface CreatorFiltersProps {
	specialties: FilterOption[]
	markets: FilterOption[]
}

export function CreatorFilters({ specialties, markets }: CreatorFiltersProps) {
	const t = useTranslations('discover')
	const router = useRouter()
	const searchParams = useSearchParams()

	const currentQuery = searchParams.get('q') ?? ''
	const currentSpecialties = searchParams.getAll('specialty')
	const currentMarkets = searchParams.getAll('market')
	const currentMinRate = searchParams.get('minRate') ?? ''
	const currentMaxRate = searchParams.get('maxRate') ?? ''

	const hasFilters =
		currentQuery ||
		currentSpecialties.length > 0 ||
		currentMarkets.length > 0 ||
		currentMinRate ||
		currentMaxRate

	const updateParams = useCallback(
		(updates: Record<string, string | string[] | null>) => {
			const params = new URLSearchParams(searchParams.toString())

			for (const [key, value] of Object.entries(updates)) {
				params.delete(key)
				if (value === null) continue
				if (Array.isArray(value)) {
					value.forEach((v) => params.append(key, v))
				} else if (value) {
					params.set(key, value)
				}
			}

			router.replace(`/dashboard/discover?${params.toString()}`, {
				scroll: false,
			})
		},
		[router, searchParams],
	)

	function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
		updateParams({ q: e.target.value || null })
	}

	function handleToggleSpecialty(slug: string) {
		const next = currentSpecialties.includes(slug)
			? currentSpecialties.filter((s) => s !== slug)
			: [...currentSpecialties, slug]
		updateParams({ specialty: next.length > 0 ? next : null })
	}

	function handleToggleMarket(slug: string) {
		const next = currentMarkets.includes(slug)
			? currentMarkets.filter((m) => m !== slug)
			: [...currentMarkets, slug]
		updateParams({ market: next.length > 0 ? next : null })
	}

	function handleRateChange(field: 'minRate' | 'maxRate', value: string) {
		const cleaned = value.replace(/\D/g, '')
		updateParams({ [field]: cleaned || null })
	}

	function handleClearFilters() {
		router.replace('/dashboard/discover', { scroll: false })
	}

	return (
		<div className="space-y-5">
			{/* Search */}
			<Input
				type="search"
				defaultValue={currentQuery}
				onChange={handleSearchChange}
				placeholder={t('searchPlaceholder')}
				className="h-11"
			/>

			{/* Specialties */}
			{specialties.length > 0 && (
				<div>
					<span className="mb-2 block font-sans text-xs uppercase tracking-wider text-muted-foreground">
						{t('filterSpecialties')}
					</span>
					<div className="flex flex-wrap gap-2">
						{specialties.map((spec) => (
							<Badge
								key={spec.id}
								variant={
									currentSpecialties.includes(spec.slug) ? 'chipActive' : 'chip'
								}
								render={<button type="button" />}
								onClick={() => handleToggleSpecialty(spec.slug)}
							>
								{spec.name}
							</Badge>
						))}
					</div>
				</div>
			)}

			{/* Markets */}
			{markets.length > 0 && (
				<div>
					<span className="mb-2 block font-sans text-xs uppercase tracking-wider text-muted-foreground">
						{t('filterMarkets')}
					</span>
					<div className="flex flex-wrap gap-2">
						{markets.map((market) => (
							<Badge
								key={market.id}
								variant={
									currentMarkets.includes(market.slug) ? 'chipActive' : 'chip'
								}
								render={<button type="button" />}
								onClick={() => handleToggleMarket(market.slug)}
							>
								{market.flag_emoji && <span>{market.flag_emoji}</span>}
								{market.name}
							</Badge>
						))}
					</div>
				</div>
			)}

			{/* Rate range */}
			<div>
				<span className="mb-2 block font-sans text-xs uppercase tracking-wider text-muted-foreground">
					{t('filterMinRate')} / {t('filterMaxRate')}
				</span>
				<div className="flex items-center gap-3">
					<Input
						type="text"
						inputMode="numeric"
						value={currentMinRate}
						onChange={(e) => handleRateChange('minRate', e.target.value)}
						placeholder={t('ratePlaceholder')}
						className="h-9 w-28 px-3 text-xs"
					/>
					<span className="font-sans text-xs text-muted-foreground">—</span>
					<Input
						type="text"
						inputMode="numeric"
						value={currentMaxRate}
						onChange={(e) => handleRateChange('maxRate', e.target.value)}
						placeholder={t('ratePlaceholder')}
						className="h-9 w-28 px-3 text-xs"
					/>
				</div>
			</div>

			{/* Clear */}
			{hasFilters && (
				<Button variant="ghost" size="sm" onClick={handleClearFilters}>
					{t('clearFilters')}
				</Button>
			)}
		</div>
	)
}
