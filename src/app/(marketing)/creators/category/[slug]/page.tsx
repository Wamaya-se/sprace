import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/json-ld'
import { getOrganizationJsonLd } from '@/lib/seo/organization'

export const revalidate = 300

interface PageProps {
	params: Promise<{ slug: string }>
}

const getSpecialty = cache(async function getSpecialty(slug: string) {
	const supabase = await createClient()

	const { data: specialty } = await supabase
		.from('specialties')
		.select('id, name, slug')
		.eq('slug', slug)
		.single()

	return specialty
})

const getCreatorsForSpecialty = (specialtyId: string) =>
	unstable_cache(
		async () => _getCreatorsForSpecialty(specialtyId),
		['creators-for-specialty', specialtyId],
		{ revalidate: 300, tags: ['creators', `specialty:${specialtyId}`] },
	)()

async function _getCreatorsForSpecialty(specialtyId: string) {
	const supabase = await createClient()

	const { data: junctions } = await supabase
		.from('creator_specialties')
		.select('creator_id')
		.eq('specialty_id', specialtyId)

	if (!junctions || junctions.length === 0) return []

	const creatorIds = junctions.map((j) => j.creator_id)

	const { data: creators } = await supabase
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
			)
		`,
		)
		.in('id', creatorIds)
		.eq('status', 'active')
		.not('slug', 'is', null)
		.order('followers_count', { ascending: false })

	if (!creators) return []

	return creators.map((c) => ({
		id: c.id,
		display_name: c.display_name,
		bio: c.bio,
		hourly_rate: c.hourly_rate,
		followers_count: c.followers_count,
		slug: c.slug!,
		avatar_url:
			(c.profile as { avatar_url: string | null } | null)?.avatar_url ?? null,
		specialties: (c.specialties ?? [])
			.map((s) => s.specialty)
			.filter(Boolean) as { id: string; name: string; slug: string }[],
	}))
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const specialty = await getSpecialty(slug)
	const t = await getTranslations('categories')

	if (!specialty) {
		return { title: `${t('noResults')} — Sprace` }
	}

	const title = t('meta.title', { specialty: specialty.name })
	const description = t('meta.description', { specialty: specialty.name })
	const siteUrl = env.siteUrl
	const canonicalUrl = `${siteUrl}/creators/category/${specialty.slug}`

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: canonicalUrl,
			type: 'website',
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

function getInitials(name: string): string {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2)
}

function formatFollowers(count: number): string {
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
	if (count >= 1_000)
		return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`
	return count.toString()
}

export default async function CategoryPage({ params }: PageProps) {
	const { slug } = await params
	const [specialty, t] = await Promise.all([
		getSpecialty(slug),
		getTranslations('categories'),
	])

	if (!specialty) {
		return <CategoryNotFound />
	}

	const [creators, organization] = await Promise.all([
		getCreatorsForSpecialty(specialty.id),
		getOrganizationJsonLd(),
	])
	const siteUrl = env.siteUrl

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: t('heading', { specialty: specialty.name }),
		url: `${siteUrl}/creators/category/${specialty.slug}`,
		description: t('meta.description', { specialty: specialty.name }),
		numberOfItems: creators.length,
	}

	const breadcrumbJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: t('breadcrumbHome'),
				item: siteUrl,
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: t('breadcrumbCreators'),
				item: `${siteUrl}/creators`,
			},
			{
				'@type': 'ListItem',
				position: 3,
				name: specialty.name,
				item: `${siteUrl}/creators/category/${specialty.slug}`,
			},
		],
	}

	return (
		<>
			<JsonLd data={organization} />
			<JsonLd data={jsonLd} />
			<JsonLd data={breadcrumbJsonLd} />

			<section className="relative overflow-hidden pt-16">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />

				<div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
					<nav aria-label={t('breadcrumbAria')} className="mb-10">
						<ol className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
							<li>
								<Link href="/" className="hover:text-foreground/70">
									{t('breadcrumbHome')}
								</Link>
							</li>
							<li aria-hidden="true">/</li>
							<li>
								<Link href="/creators" className="hover:text-foreground/70">
									{t('breadcrumbCreators')}
								</Link>
							</li>
							<li aria-hidden="true">/</li>
							<li>
								<span className="text-foreground/70">{specialty.name}</span>
							</li>
						</ol>
					</nav>

					<h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl">
						{t('heading', { specialty: specialty.name })}
					</h1>
					<p className="mt-4 max-w-2xl font-sans text-base leading-[1.7] text-muted-foreground">
						{t('subtitle', { specialty: specialty.name.toLowerCase() })}
					</p>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-6 pb-32 pt-8">
				{creators.length > 0 ? (
					<>
						<p className="mb-6 font-sans text-xs text-muted-foreground">
							{creators.length === 1
								? t('oneResult')
								: t('resultsCount', { count: creators.length })}
						</p>

						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{creators.map((creator) => (
								<Link
									key={creator.id}
									href={`/creators/${creator.slug}`}
									className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/40 focus-visible:rounded-xl"
								>
									<Card className="h-full bg-surface-container transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:bg-surface-container-high">
										<CardContent className="flex flex-col gap-4 p-5">
											<div className="flex items-start gap-4">
												<Avatar className="size-14">
													{creator.avatar_url ? (
														<AvatarImage
															src={creator.avatar_url}
															alt={creator.display_name}
														/>
													) : null}
													<AvatarFallback className="text-base">
														{getInitials(creator.display_name)}
													</AvatarFallback>
												</Avatar>

												<div className="min-w-0 flex-1">
													<h2 className="truncate font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
														{creator.display_name}
													</h2>
													<div className="mt-1 flex flex-wrap items-center gap-3 font-sans text-xs text-muted-foreground">
														{(creator.followers_count ?? 0) > 0 && (
															<span>
																{t('followers', {
																	count: formatFollowers(
																		creator.followers_count ?? 0,
																	),
																})}
															</span>
														)}
														{creator.hourly_rate && (
															<span>
																{creator.hourly_rate} SEK{t('perHour')}
															</span>
														)}
													</div>
												</div>
											</div>

											{creator.bio && (
												<p className="line-clamp-2 font-sans text-sm leading-[1.7] text-muted-foreground">
													{creator.bio}
												</p>
											)}

											{creator.specialties.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{creator.specialties.slice(0, 3).map((spec) => (
														<Badge
															key={spec.id}
															variant={
																spec.slug === specialty.slug
																	? 'default'
																	: 'secondary'
															}
															className="text-[11px]"
														>
															{spec.name}
														</Badge>
													))}
													{creator.specialties.length > 3 && (
														<Badge variant="outline" className="text-[11px]">
															+{creator.specialties.length - 3}
														</Badge>
													)}
												</div>
											)}
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					</>
				) : (
					<div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-20 text-center">
						<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
							{t('noResults')}
						</h2>
						<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('noResultsDescription')}
						</p>
						<Button asChild className="mt-6">
							<Link href="/creators">{t('browseAll')}</Link>
						</Button>
					</div>
				)}
			</section>
		</>
	)
}

async function CategoryNotFound() {
	const t = await getTranslations('categories')

	return (
		<section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-32">
			<h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground">
				{t('noResults')}
			</h1>
			<p className="mt-4 max-w-md text-center font-sans text-base leading-[1.7] text-muted-foreground">
				{t('noResultsDescription')}
			</p>
			<Button asChild className="mt-8">
				<Link href="/creators">{t('browseAll')}</Link>
			</Button>
		</section>
	)
}
