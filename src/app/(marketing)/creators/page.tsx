import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/shared/json-ld'
import { getOrganizationJsonLd } from '@/lib/seo/organization'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('categories')

	const title = t('allCategories') + ' — Sprace'
	const description = t('indexMetaDescription')
	const siteUrl = env.siteUrl

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: `${siteUrl}/creators`,
			type: 'website',
		},
		twitter: {
			card: 'summary',
			title,
			description,
		},
		alternates: {
			canonical: `${siteUrl}/creators`,
		},
	}
}

const getCategoriesWithCounts = unstable_cache(
	async () => {
		const supabase = await createClient()

		const { data: specialties } = await supabase
			.from('specialties')
			.select('id, name, slug')
			.order('name')

		if (!specialties) return []

		const { data: counts } = await supabase
			.from('creator_specialties')
			.select('specialty_id')

		const countMap = new Map<string, number>()
		for (const row of counts ?? []) {
			countMap.set(row.specialty_id, (countMap.get(row.specialty_id) ?? 0) + 1)
		}

		return specialties.map((s) => ({
			...s,
			creatorCount: countMap.get(s.id) ?? 0,
		}))
	},
	['creators-categories-with-counts'],
	{ revalidate: 300, tags: ['specialties', 'creators'] },
)

export default async function CreatorCategoriesPage() {
	const t = await getTranslations('categories')
	const [categories, organization] = await Promise.all([
		getCategoriesWithCounts(),
		getOrganizationJsonLd(),
	])
	const siteUrl = env.siteUrl

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: t('allCategories'),
		url: `${siteUrl}/creators`,
		description: t('indexMetaDescription'),
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
								<span className="text-foreground/70">
									{t('breadcrumbCreators')}
								</span>
							</li>
						</ol>
					</nav>

					<h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl">
						{t('allCategories')}
					</h1>
					<p className="mt-4 max-w-2xl font-sans text-base leading-[1.7] text-muted-foreground">
						{t('indexSubtitle')}
					</p>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-6 pb-32 pt-8">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{categories.map((category) => (
						<Link
							key={category.id}
							href={`/creators/category/${category.slug}`}
							className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/40 focus-visible:rounded-xl"
						>
							<Card className="h-full bg-surface-container transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:bg-surface-container-high">
								<CardContent className="flex items-center justify-between p-6">
									<div>
										<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
											{category.name}
										</h2>
										<p className="mt-1 font-sans text-sm text-muted-foreground">
											{t('creatorsCount', { count: category.creatorCount })}
										</p>
									</div>
									<Badge variant="secondary" className="shrink-0">
										{category.creatorCount}
									</Badge>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</section>
		</>
	)
}
