import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getPublicCampaigns } from '@/lib/queries/campaigns'
import { env } from '@/lib/env'
import { JsonLd } from '@/components/shared/json-ld'
import { getOrganizationJsonLd } from '@/lib/seo/organization'
import { CampaignCard } from '@/components/campaigns/campaign-card'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	const siteUrl = env.siteUrl
	const title = t('campaignsPublicTitle')
	const description = t('campaignsPublicDescription')

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: `${siteUrl}/campaigns`,
			type: 'website',
		},
		twitter: {
			card: 'summary',
			title,
			description,
		},
		alternates: {
			canonical: `${siteUrl}/campaigns`,
		},
	}
}

export default async function PublicCampaignsPage() {
	const t = await getTranslations('campaigns')
	const [campaigns, organization] = await Promise.all([
		getPublicCampaigns({ limit: 60 }),
		getOrganizationJsonLd(),
	])

	const siteUrl = env.siteUrl

	const itemListJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		itemListElement: campaigns.slice(0, 20).map((c, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: c.title,
			url: `${siteUrl}/campaigns/${c.slug}`,
		})),
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
				name: t('publicTitle'),
				item: `${siteUrl}/campaigns`,
			},
		],
	}

	return (
		<>
			<JsonLd data={organization} />
			<JsonLd data={itemListJsonLd} />
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
								<span className="text-foreground/70">{t('publicTitle')}</span>
							</li>
						</ol>
					</nav>

					<h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl">
						{t('publicTitle')}
					</h1>
					<p className="mt-4 max-w-2xl font-sans text-base leading-[1.7] text-muted-foreground">
						{t('publicSubtitle')}
					</p>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-6 pb-32 pt-8">
				{campaigns.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-24 text-center">
						<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
							{t('empty')}
						</h2>
						<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('noCampaignsPublic')}
						</p>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{campaigns.map((c) => (
							<CampaignCard
								key={c.id}
								campaign={c}
								href={`/campaigns/${c.slug}`}
							/>
						))}
					</div>
				)}
			</section>
		</>
	)
}
