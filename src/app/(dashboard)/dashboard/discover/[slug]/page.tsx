import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { CreatorPublicProfile } from '@/components/shared/creator-public-profile'
import { SaveCreatorButton } from '@/components/dashboard/save-creator-button'
import { getSavedCreatorIds } from '@/lib/queries/saved-creators'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
	params: Promise<{ slug: string }>
}

async function getCreator(slug: string) {
	const supabase = await createClient()

	const { data: creator, error } = await supabase
		.from('creators')
		.select(
			`
			id,
			display_name,
			bio,
			portfolio_url,
			instagram_handle,
			tiktok_handle,
			youtube_handle,
			followers_count,
			hourly_rate,
			slug,
			status,
			created_at,
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
			),
			services (
				id,
				name,
				description,
				price,
				delivery_days,
				is_active,
				sort_order,
				media:service_media (
					id,
					media_url,
					media_type,
					sort_order
				)
			)
		`,
		)
		.eq('slug', slug)
		.eq('status', 'active')
		.single()

	if (error || !creator) return null

	return {
		...creator,
		profile: creator.profile as { avatar_url: string | null },
		specialties: (creator.specialties ?? [])
			.map((s) => s.specialty)
			.filter(Boolean) as { id: string; name: string; slug: string }[],
		markets: (creator.markets ?? []).map((m) => m.market).filter(Boolean) as {
			id: string
			name: string
			slug: string
			flag_emoji: string | null
		}[],
		services: (creator.services ?? [])
			.filter((s) => s.is_active)
			.sort((a, b) => a.sort_order - b.sort_order)
			.map((s) => ({
				...s,
				media: (s.media ?? []).sort((a, b) => a.sort_order - b.sort_order),
			})),
	}
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const creator = await getCreator(slug)
	const t = await getTranslations('discover')

	if (!creator) {
		return { title: t('creatorProfileTitle', { name: 'Not found' }) }
	}

	return {
		title: t('creatorProfileTitle', { name: creator.display_name }),
	}
}

export default async function DiscoverCreatorPage({ params }: PageProps) {
	const { slug } = await params
	const [creator, savedIds] = await Promise.all([
		getCreator(slug),
		getSavedCreatorIds(),
	])
	const t = await getTranslations('discover')

	if (!creator) {
		return <CreatorNotFound />
	}

	const isSaved = savedIds.includes(creator.id)

	const tc = await getTranslations('creatorProfile')

	return (
		<div className="-m-6 lg:-m-8">
			<CreatorPublicProfile
				creator={creator}
				backLink={{ href: '/dashboard/discover', label: t('backToSearch') }}
				isCompact
				saveButton={
					<SaveCreatorButton
						creatorId={creator.id}
						initialSaved={isSaved}
						size="default"
					/>
				}
				contactButton={
					<Button asChild size="lg">
						<Link href={`/dashboard/bookings/new?creatorId=${creator.id}`}>
							{tc('contactCreator')}
						</Link>
					</Button>
				}
			/>
		</div>
	)
}

async function CreatorNotFound() {
	const t = await getTranslations('creatorProfile')
	const td = await getTranslations('discover')

	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
				{t('notFound')}
			</h2>
			<p className="mt-3 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('notFoundDescription')}
			</p>
			<Button asChild className="mt-6">
				<Link href="/dashboard/discover">{td('backToSearch')}</Link>
			</Button>
		</div>
	)
}
