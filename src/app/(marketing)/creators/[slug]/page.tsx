import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { Button } from '@/components/ui/button'
import { CreatorPublicProfile } from '@/components/shared/creator-public-profile'
import { JsonLd } from '@/components/shared/json-ld'
import { ReportDialog } from '@/components/shared/report-dialog'
import { BlockCreatorButton } from '@/components/shared/block-creator-button'
import { getCreatorReviews } from '@/lib/queries/reviews'
import { getOrganizationJsonLd } from '@/lib/seo/organization'
import { getBlockedProfileIds } from '@/lib/queries/blocks'
import { getOptionalUser } from '@/lib/auth/guards'

interface PageProps {
	params: Promise<{ slug: string }>
}

const getCreator = cache(async function getCreator(slug: string) {
	const supabase = await createClient()

	const { data: creator, error } = await supabase
		.from('creators')
		.select(
			`
			id,
			profile_id,
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
			profile:profiles!creators_profile_id_fkey!inner (
				avatar_url,
				is_suspended
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
		.eq('profile.is_suspended', false)
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
})

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const creator = await getCreator(slug)

	if (!creator) {
		const tFallback = await getTranslations('creatorProfile')
		return { title: `${tFallback('notFound')} — Sprace` }
	}

	const t = await getTranslations('creatorProfile')
	const specialtyNames =
		creator.specialties.map((s) => s.name).join(', ') || 'various categories'

	const title = t('meta.title', { name: creator.display_name })
	const description = t('meta.description', {
		name: creator.display_name,
		specialties: specialtyNames,
	})

	const siteUrl = env.siteUrl
	const canonicalUrl = `${siteUrl}/creators/${creator.slug}`

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: canonicalUrl,
			type: 'profile',
			...(creator.profile.avatar_url && {
				images: [
					{
						url: creator.profile.avatar_url,
						width: 400,
						height: 400,
						alt: creator.display_name,
					},
				],
			}),
		},
		twitter: {
			card: 'summary',
			title,
			description,
		},
		alternates: {
			canonical: canonicalUrl,
		},
	}
}

export default async function CreatorProfilePage({ params }: PageProps) {
	const { slug } = await params
	const creator = await getCreator(slug)

	if (!creator) {
		return <CreatorNotFound />
	}

	const [reviewData, organization, viewer, blockedIds] = await Promise.all([
		getCreatorReviews(creator.profile_id),
		getOrganizationJsonLd(),
		getOptionalUser(),
		getBlockedProfileIds(),
	])
	const { reviews, averageRating, totalCount } = reviewData
	const isOwnProfile = viewer?.user.id === creator.profile_id
	const canModerate = Boolean(viewer) && !isOwnProfile
	const isBlocked = blockedIds.includes(creator.profile_id)

	const moderationActions = canModerate ? (
		<div className="flex flex-wrap items-center gap-2">
			<ReportDialog targetType="profile" targetId={creator.profile_id} />
			<BlockCreatorButton
				profileId={creator.profile_id}
				displayName={creator.display_name}
				isBlocked={isBlocked}
			/>
		</div>
	) : null

	const siteUrl = env.siteUrl
	const canonicalUrl = `${siteUrl}/creators/${creator.slug}`

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: creator.display_name,
		url: canonicalUrl,
		...(creator.bio && { description: creator.bio }),
		...(creator.profile.avatar_url && { image: creator.profile.avatar_url }),
		...(creator.portfolio_url && { sameAs: [creator.portfolio_url] }),
		knowsAbout: creator.specialties.map((s) => s.name),
	}

	const breadcrumbJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: siteUrl,
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: 'Creators',
				item: `${siteUrl}/creators`,
			},
			{
				'@type': 'ListItem',
				position: 3,
				name: creator.display_name,
				item: canonicalUrl,
			},
		],
	}

	return (
		<>
			<JsonLd data={organization} />
			<JsonLd data={jsonLd} />
			<JsonLd data={breadcrumbJsonLd} />
			<CreatorPublicProfile
				creator={creator}
				reviews={reviews}
				averageRating={averageRating}
				totalReviews={totalCount}
				moderationActions={moderationActions}
			/>
		</>
	)
}

async function CreatorNotFound() {
	const t = await getTranslations('creatorProfile')

	return (
		<section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-32">
			<h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground">
				{t('notFound')}
			</h1>
			<p className="mt-4 max-w-md text-center font-sans text-base leading-[1.7] text-muted-foreground">
				{t('notFoundDescription')}
			</p>
			<Button asChild className="mt-8">
				<Link href="/">{t('backToHome')}</Link>
			</Button>
		</section>
	)
}
