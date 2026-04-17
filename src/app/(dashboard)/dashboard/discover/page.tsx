import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Skeleton } from '@/components/ui/skeleton'
import { CreatorCard } from '@/components/dashboard/creator-card'
import { CreatorFilters } from '@/components/dashboard/creator-filters'
import { getSavedCreatorIds } from '@/lib/queries/saved-creators'
import { getBlockedProfileIds } from '@/lib/queries/blocks'
import type { CreatorCardData } from '@/components/dashboard/creator-card'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('discoverTitle'),
	}
}

interface PageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function getFilterOptions() {
	const supabase = await createClient()

	const [specialtiesRes, marketsRes] = await Promise.all([
		supabase.from('specialties').select('id, name, slug').order('name'),
		supabase
			.from('markets')
			.select('id, name, slug, flag_emoji')
			.order('sort_order'),
	])

	return {
		specialties: specialtiesRes.data ?? [],
		markets: marketsRes.data ?? [],
	}
}

async function getCreators(filters: {
	q?: string
	specialties?: string[]
	markets?: string[]
	minRate?: number
	maxRate?: number
	blockedProfileIds?: string[]
}): Promise<CreatorCardData[]> {
	const supabase = await createClient()

	const { data, error } = await supabase.rpc('search_creators', {
		p_q: filters.q,
		p_specialty_slugs:
			filters.specialties && filters.specialties.length > 0
				? filters.specialties
				: undefined,
		p_market_slugs:
			filters.markets && filters.markets.length > 0
				? filters.markets
				: undefined,
		p_min_rate: filters.minRate,
		p_max_rate: filters.maxRate,
		p_limit: 48,
		p_offset: 0,
		p_blocked_profile_ids:
			filters.blockedProfileIds && filters.blockedProfileIds.length > 0
				? filters.blockedProfileIds
				: undefined,
	})

	if (error) {
		console.error('[getCreators]', error)
		return []
	}

	return (data ?? []).map((c) => ({
		id: c.id,
		display_name: c.display_name,
		bio: c.bio,
		hourly_rate: c.hourly_rate,
		followers_count: c.followers_count,
		slug: c.slug,
		avatar_url: c.avatar_url,
		specialties: (c.specialties as CreatorCardData['specialties'] | null) ?? [],
		markets: (c.markets as CreatorCardData['markets'] | null) ?? [],
		averageRating: c.average_rating,
		totalReviews: Number(c.total_reviews ?? 0),
	}))
}

function toStringArray(val: string | string[] | undefined): string[] {
	if (!val) return []
	return Array.isArray(val) ? val : [val]
}

function FiltersSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-full rounded-xl" />
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i}>
					<Skeleton className="h-4 w-20" />
					<div className="mt-2 flex flex-wrap gap-2">
						{Array.from({ length: 4 }).map((_, j) => (
							<Skeleton key={j} className="h-7 w-16 rounded-full" />
						))}
					</div>
				</div>
			))}
		</div>
	)
}

export default async function DiscoverPage({ searchParams }: PageProps) {
	const params = await searchParams
	const t = await getTranslations('discover')
	const td = await getTranslations('dashboard')

	const q = typeof params.q === 'string' ? params.q : undefined
	const specialtyFilters = toStringArray(params.specialty)
	const marketFilters = toStringArray(params.market)
	const minRate = params.minRate ? Number(params.minRate) : undefined
	const maxRate = params.maxRate ? Number(params.maxRate) : undefined

	const blockedProfileIds = await getBlockedProfileIds()

	const [filterOptions, creators, savedIds] = await Promise.all([
		getFilterOptions(),
		getCreators({
			q,
			specialties: specialtyFilters.length > 0 ? specialtyFilters : undefined,
			markets: marketFilters.length > 0 ? marketFilters : undefined,
			minRate: minRate && !isNaN(minRate) ? minRate : undefined,
			maxRate: maxRate && !isNaN(maxRate) ? maxRate : undefined,
			blockedProfileIds,
		}),
		getSavedCreatorIds(),
	])

	const savedSet = new Set(savedIds)

	return (
		<div className="mx-auto max-w-6xl">
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{td('discoverDescription')}
			</p>

			<div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
				{/* Filters sidebar */}
				<aside>
					<Suspense fallback={<FiltersSkeleton />}>
						<CreatorFilters
							specialties={filterOptions.specialties}
							markets={filterOptions.markets}
						/>
					</Suspense>
				</aside>

				{/* Results */}
				<div>
					<div className="mb-4 font-sans text-xs text-muted-foreground">
						{creators.length === 1
							? t('oneResult')
							: t('resultsCount', { count: creators.length })}
					</div>

					{creators.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{creators.map((creator) => (
								<CreatorCard
									key={creator.id}
									creator={creator}
									isSaved={savedSet.has(creator.id)}
								/>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-20 text-center">
							<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
								{t('noResults')}
							</h2>
							<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
								{t('noResultsDescription')}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
