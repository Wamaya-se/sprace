import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/shared/json-ld'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { env } from '@/lib/env'
import { getOrganizationJsonLd } from '@/lib/seo/organization'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('aboutTitle'),
		description: t('aboutDescription'),
		openGraph: {
			title: t('aboutTitle'),
			description: t('aboutDescription'),
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: t('aboutTitle'),
			description: t('aboutDescription'),
		},
		alternates: { canonical: '/about' },
	}
}

export default async function AboutPage() {
	const t = await getTranslations('about')
	const organization = await getOrganizationJsonLd()
	const siteUrl = env.siteUrl

	const values = [
		{ title: t('value1Title'), body: t('value1Body') },
		{ title: t('value2Title'), body: t('value2Body') },
		{ title: t('value3Title'), body: t('value3Body') },
		{ title: t('value4Title'), body: t('value4Body') },
	]

	const stats = [
		{ label: t('stat1Label'), value: t('stat1Value') },
		{ label: t('stat2Label'), value: t('stat2Value') },
		{ label: t('stat3Label'), value: t('stat3Value') },
	]

	const breadcrumbs = {
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
				name: t('heroTitle'),
				item: `${siteUrl}/about`,
			},
		],
	}

	return (
		<>
			<JsonLd data={organization} />
			<JsonLd data={breadcrumbs} />

			{/* Hero */}
			<section className="relative overflow-hidden pt-32 pb-20">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />

				<div className="relative mx-auto max-w-4xl px-6 text-center">
					<div className="hero-animate hero-animate-delay-1 inline-flex items-center gap-2 rounded-full bg-secondary-container/20 px-4 py-1.5">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
						<span className="font-sans text-xs font-medium text-on-secondary-container">
							{t('heroBadge')}
						</span>
					</div>
					<h1 className="hero-animate hero-animate-delay-2 mt-6 font-heading text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-7xl">
						{t('heroTitle')}
					</h1>
					<p className="hero-animate hero-animate-delay-3 mx-auto mt-6 max-w-2xl font-sans text-lg leading-[1.7] text-foreground/60">
						{t('heroSubtitle')}
					</p>
				</div>
			</section>

			{/* Mission */}
			<section
				className="bg-surface-container-low py-32"
				aria-labelledby="mission-heading"
			>
				<div className="mx-auto max-w-4xl px-6">
					<ScrollReveal>
						<Badge className="mb-6">{t('missionBadge')}</Badge>
						<h2
							id="mission-heading"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('missionTitle')}
						</h2>
						<p className="mt-6 font-sans text-lg leading-[1.7] text-foreground/70">
							{t('missionBody1')}
						</p>
						<p className="mt-4 font-sans text-lg leading-[1.7] text-foreground/70">
							{t('missionBody2')}
						</p>
					</ScrollReveal>
				</div>
			</section>

			{/* Stats */}
			<section className="bg-surface py-24" aria-labelledby="stats-heading">
				<div className="mx-auto max-w-7xl px-6">
					<h2 id="stats-heading" className="sr-only">
						{t('statsSrTitle')}
					</h2>
					<div className="grid gap-6 sm:grid-cols-3">
						{stats.map((s, i) => (
							<ScrollReveal key={s.label} delay={i * 100}>
								<Card className="h-full bg-surface-container p-8 text-center">
									<CardContent className="p-0">
										<p className="font-heading text-5xl font-bold tracking-[-0.03em] text-brand md:text-6xl">
											{s.value}
										</p>
										<p className="mt-3 font-sans text-sm text-muted-foreground">
											{s.label}
										</p>
									</CardContent>
								</Card>
							</ScrollReveal>
						))}
					</div>
				</div>
			</section>

			{/* Values */}
			<section
				className="bg-surface-container-low py-32"
				aria-labelledby="values-heading"
			>
				<div className="mx-auto max-w-7xl px-6">
					<ScrollReveal className="mb-16 max-w-2xl text-center mx-auto">
						<h2
							id="values-heading"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('valuesTitle')}
						</h2>
						<p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground">
							{t('valuesSubtitle')}
						</p>
					</ScrollReveal>

					<div className="grid gap-6 md:grid-cols-2">
						{values.map((v, i) => (
							<ScrollReveal key={v.title} delay={i * 80}>
								<Card className="h-full bg-surface-container p-8">
									<CardContent className="p-0">
										<h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
											{v.title}
										</h3>
										<p className="mt-3 font-sans text-sm leading-[1.7] text-muted-foreground">
											{v.body}
										</p>
									</CardContent>
								</Card>
							</ScrollReveal>
						))}
					</div>
				</div>
			</section>

			{/* Story */}
			<section className="bg-surface py-32" aria-labelledby="story-heading">
				<div className="mx-auto max-w-4xl px-6">
					<ScrollReveal>
						<Badge variant="secondary" className="mb-6">
							{t('storyBadge')}
						</Badge>
						<h2
							id="story-heading"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('storyTitle')}
						</h2>
						<div className="mt-8 space-y-5 font-sans text-base leading-[1.8] text-foreground/70">
							<p>{t('storyBody1')}</p>
							<p>{t('storyBody2')}</p>
							<p>{t('storyBody3')}</p>
						</div>
					</ScrollReveal>
				</div>
			</section>

			{/* CTA */}
			<section className="relative overflow-hidden py-32">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface-container to-gradient-end" />

				<ScrollReveal className="relative mx-auto max-w-3xl px-6 text-center">
					<h2 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-6xl">
						{t('ctaTitle')}
					</h2>
					<p className="mx-auto mt-6 max-w-lg font-sans text-lg leading-[1.7] text-foreground/60">
						{t('ctaSubtitle')}
					</p>
					<div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Button asChild size="lg">
							<Link href="/register">{t('ctaPrimary')}</Link>
						</Button>
						<Button asChild variant="secondary" size="lg">
							<Link href="/contact">{t('ctaSecondary')}</Link>
						</Button>
					</div>
				</ScrollReveal>
			</section>
		</>
	)
}
