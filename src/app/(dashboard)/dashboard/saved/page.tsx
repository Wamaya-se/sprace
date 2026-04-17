import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { CreatorCard } from '@/components/dashboard/creator-card'
import { Button } from '@/components/ui/button'
import type { CreatorCardData } from '@/components/dashboard/creator-card'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('savedCreatorsTitle'),
	}
}

async function getSavedCreators(): Promise<CreatorCardData[]> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return []

	const { data: savedRows } = await supabase
		.from('saved_creators')
		.select('creator_id')
		.eq('business_profile_id', user.id)
		.order('created_at', { ascending: false })

	if (!savedRows || savedRows.length === 0) return []

	const creatorIds = savedRows.map((r) => r.creator_id)

	const { data: creators, error } = await supabase
		.from('creators')
		.select(
			`
			id,
			display_name,
			bio,
			hourly_rate,
			followers_count,
			slug,
			profile:profiles!creators_profile_id_fkey (
				avatar_url
			),
			specialties:creator_specialties (
				specialty:specialties (
					id,
					name,
					slug
				)
			),
			markets:creator_markets (
				market:markets (
					id,
					name,
					slug,
					flag_emoji
				)
			)
		`,
		)
		.in('id', creatorIds)
		.eq('status', 'active')

	if (error || !creators) return []

	const orderedCreators = creatorIds
		.map((id) => creators.find((c) => c.id === id))
		.filter(Boolean) as typeof creators

	return orderedCreators.map((c) => ({
		id: c.id,
		display_name: c.display_name,
		bio: c.bio,
		hourly_rate: c.hourly_rate,
		followers_count: c.followers_count,
		slug: c.slug,
		avatar_url:
			(c.profile as { avatar_url: string | null } | null)?.avatar_url ?? null,
		specialties: (c.specialties ?? [])
			.map((s) => s.specialty)
			.filter(Boolean) as { id: string; name: string; slug: string }[],
		markets: (c.markets ?? []).map((m) => m.market).filter(Boolean) as {
			id: string
			name: string
			slug: string
			flag_emoji: string | null
		}[],
	}))
}

export default async function SavedCreatorsPage() {
	const t = await getTranslations('savedCreators')
	const td = await getTranslations('dashboard')
	const creators = await getSavedCreators()

	return (
		<div className="mx-auto max-w-6xl">
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{td('savedDescription')}
			</p>

			{creators.length > 0 ? (
				<>
					<div className="mt-6 mb-4 font-sans text-xs text-muted-foreground">
						{t('savedCount', { count: creators.length })}
					</div>
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{creators.map((creator) => (
							<CreatorCard key={creator.id} creator={creator} isSaved />
						))}
					</div>
				</>
			) : (
				<div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-surface-container py-20 text-center">
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('empty')}
					</h2>
					<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
						{t('emptyDescription')}
					</p>
					<Button asChild className="mt-6">
						<Link href="/dashboard/discover">{t('browseCreators')}</Link>
					</Button>
				</div>
			)}
		</div>
	)
}
