import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCampaignBySlug } from '@/lib/queries/campaigns'
import { env } from '@/lib/env'
import { getOptionalUser } from '@/lib/auth/guards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/json-ld'
import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge'
import { ApplyCampaignForm } from '@/components/campaigns/apply-campaign-form'
import { ApplicationStatusBadge } from '@/components/campaigns/campaign-status-badge'

interface PageProps {
	params: Promise<{ slug: string }>
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const campaign = await getCampaignBySlug(slug)
	const t = await getTranslations('metadata')
	const siteUrl = env.siteUrl

	if (!campaign) {
		return { title: t('campaignsPublicTitle') }
	}

	const title = t('campaignDetailTitle', { title: campaign.title })
	const description = t('campaignDetailDescription', {
		company: campaign.company_name,
		excerpt: campaign.description.slice(0, 160),
	})

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: `${siteUrl}/campaigns/${campaign.slug}`,
			type: 'article',
		},
		twitter: {
			card: 'summary',
			title,
			description,
		},
		alternates: {
			canonical: `${siteUrl}/campaigns/${campaign.slug}`,
		},
	}
}

export default async function PublicCampaignDetail({ params }: PageProps) {
	const { slug } = await params
	const campaign = await getCampaignBySlug(slug)
	if (!campaign) notFound()

	const t = await getTranslations('campaigns')
	const auth = await getOptionalUser()
	const role = (auth?.user.app_metadata?.role as string) ?? null
	const siteUrl = env.siteUrl

	let existingApplication: {
		id: string
		status: 'pending' | 'shortlisted' | 'accepted' | 'declined' | 'withdrawn'
		pitch: string
		proposed_price: number | null
	} | null = null

	if (auth && role === 'creator') {
		const { data: creator } = await auth.supabase
			.from('creators')
			.select('id')
			.eq('profile_id', auth.user.id)
			.single()
		if (creator) {
			const { data: app } = await auth.supabase
				.from('campaign_applications')
				.select('id, status, pitch, proposed_price')
				.eq('campaign_id', campaign.id)
				.eq('creator_id', creator.id)
				.maybeSingle()
			if (app) existingApplication = app
		}
	}

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'JobPosting',
		title: campaign.title,
		description: campaign.description,
		datePosted: campaign.published_at ?? campaign.created_at,
		hiringOrganization: {
			'@type': 'Organization',
			name: campaign.company_name,
		},
		employmentType: 'CONTRACTOR',
		url: `${siteUrl}/campaigns/${campaign.slug}`,
		...(campaign.deadline ? { validThrough: campaign.deadline } : {}),
		...(campaign.budget_per_creator
			? {
					baseSalary: {
						'@type': 'MonetaryAmount',
						currency: 'SEK',
						value: {
							'@type': 'QuantitativeValue',
							value: campaign.budget_per_creator,
							unitText: 'PROJECT',
						},
					},
				}
			: {}),
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
			{
				'@type': 'ListItem',
				position: 3,
				name: campaign.title,
				item: `${siteUrl}/campaigns/${campaign.slug}`,
			},
		],
	}

	const canApply = campaign.status === 'open'

	return (
		<>
			<JsonLd data={jsonLd} />
			<JsonLd data={breadcrumbJsonLd} />

			<section className="relative overflow-hidden pt-16">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />
				<div className="relative mx-auto max-w-5xl px-6 py-16 md:py-24">
					<nav aria-label={t('breadcrumbAria')} className="mb-8">
						<ol className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
							<li>
								<Link href="/" className="hover:text-foreground/70">
									{t('breadcrumbHome')}
								</Link>
							</li>
							<li aria-hidden="true">/</li>
							<li>
								<Link href="/campaigns" className="hover:text-foreground/70">
									{t('publicTitle')}
								</Link>
							</li>
							<li aria-hidden="true">/</li>
							<li>
								<span className="text-foreground/70">{campaign.title}</span>
							</li>
						</ol>
					</nav>

					<div className="flex flex-wrap items-center gap-3">
						<h1 className="font-heading text-3xl font-bold tracking-[-0.03em] text-foreground md:text-4xl">
							{campaign.title}
						</h1>
						<CampaignStatusBadge status={campaign.status} />
					</div>
					<p className="mt-3 font-sans text-base text-muted-foreground">
						{t('companyLabel', { name: campaign.company_name })}
						{campaign.published_at
							? ` · ${t('publishedAt', {
									date: new Date(campaign.published_at).toLocaleDateString(
										undefined,
										{ month: 'short', day: 'numeric', year: 'numeric' },
									),
								})}`
							: ''}
					</p>
				</div>
			</section>

			<section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-[2fr_1fr]">
				<article className="flex flex-col gap-5">
					<Card>
						<CardContent className="py-6">
							<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
								{t('descriptionLabel')}
							</h2>
							<p className="mt-3 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/90">
								{campaign.description}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col gap-3 py-6 font-sans text-sm">
							{campaign.budget_per_creator && (
								<p className="text-foreground/80">
									{t('budgetLabel', {
										amount: campaign.budget_per_creator.toLocaleString(),
									})}
								</p>
							)}
							{campaign.deadline && (
								<p className="text-foreground/80">
									{t('deadlineValue', {
										date: new Date(campaign.deadline).toLocaleDateString(
											undefined,
											{ month: 'short', day: 'numeric', year: 'numeric' },
										),
									})}
								</p>
							)}
							{campaign.specialties.length > 0 && (
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-muted-foreground">
										{t('specialtiesLabel')}:
									</span>
									{campaign.specialties.map((s) => (
										<Badge key={s.id} variant="outline">
											{s.name}
										</Badge>
									))}
								</div>
							)}
							{campaign.markets.length > 0 && (
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-muted-foreground">
										{t('marketsLabel')}:
									</span>
									{campaign.markets.map((m) => (
										<Badge key={m.id} variant="outline">
											{m.flag_emoji ? `${m.flag_emoji} ` : ''}
											{m.name}
										</Badge>
									))}
								</div>
							)}
							<p className="text-muted-foreground">
								{t('applicationsCount', { count: campaign.application_count })}
							</p>
						</CardContent>
					</Card>
				</article>

				<aside className="flex flex-col gap-4">
					<Card>
						<CardContent className="flex flex-col gap-3 py-6">
							<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
								{existingApplication ? t('myApplications') : t('apply')}
							</h3>

							{!auth && canApply && (
								<>
									<p className="font-sans text-sm text-muted-foreground">
										{t('applyLoginCta')}
									</p>
									<Button asChild>
										<Link
											href={`/login?next=${encodeURIComponent(`/campaigns/${campaign.slug}`)}`}
										>
											{t('applyLoginCta')}
										</Link>
									</Button>
								</>
							)}

							{auth && role === 'business' && (
								<p className="font-sans text-sm text-muted-foreground">
									{t('applyAsBusinessDisabled')}
								</p>
							)}

							{auth && role === 'creator' && !canApply && (
								<p className="font-sans text-sm text-muted-foreground">
									{t('applyCampaignNotOpen')}
								</p>
							)}

							{auth &&
								role === 'creator' &&
								canApply &&
								existingApplication &&
								existingApplication.status !== 'withdrawn' && (
									<>
										<div className="flex items-center gap-2">
											<ApplicationStatusBadge
												status={existingApplication.status}
											/>
										</div>
										{['pending', 'shortlisted'].includes(
											existingApplication.status,
										) ? (
											<ApplyCampaignForm
												campaignId={campaign.id}
												existing={{
													pitch: existingApplication.pitch,
													proposed_price: existingApplication.proposed_price,
												}}
											/>
										) : null}
										<Button asChild variant="outline">
											<Link href="/dashboard/campaigns">
												{t('myApplications')}
											</Link>
										</Button>
									</>
								)}

							{auth &&
								role === 'creator' &&
								canApply &&
								(!existingApplication ||
									existingApplication.status === 'withdrawn') && (
									<ApplyCampaignForm campaignId={campaign.id} />
								)}
						</CardContent>
					</Card>
				</aside>
			</section>
		</>
	)
}
