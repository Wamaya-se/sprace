import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/shared/json-ld'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { SocialProofSection } from '@/components/shared/social-proof-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getOrganizationJsonLd } from '@/lib/seo/organization'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('forBusinessesTitle'),
		description: t('forBusinessesDescription'),
		openGraph: {
			title: t('forBusinessesTitle'),
			description: t('forBusinessesDescription'),
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: t('forBusinessesTitle'),
			description: t('forBusinessesDescription'),
		},
		alternates: {
			canonical: '/for-businesses',
		},
	}
}

export default async function ForBusinessesPage() {
	const t = await getTranslations('forBusinesses')
	const organization = await getOrganizationJsonLd()

	const benefits = [
		{ title: t('benefit1Title'), body: t('benefit1Body') },
		{ title: t('benefit2Title'), body: t('benefit2Body') },
		{ title: t('benefit3Title'), body: t('benefit3Body') },
		{ title: t('benefit4Title'), body: t('benefit4Body') },
		{ title: t('benefit5Title'), body: t('benefit5Body') },
		{ title: t('benefit6Title'), body: t('benefit6Body') },
	]

	const flow = [
		{ title: t('flow1Title'), body: t('flow1Body') },
		{ title: t('flow2Title'), body: t('flow2Body') },
		{ title: t('flow3Title'), body: t('flow3Body') },
		{ title: t('flow4Title'), body: t('flow4Body') },
		{ title: t('flow5Title'), body: t('flow5Body') },
	]

	const valueStats = [
		{ value: t('valueStat1Value'), label: t('valueStat1Label') },
		{ value: t('valueStat2Value'), label: t('valueStat2Label') },
		{ value: t('valueStat3Value'), label: t('valueStat3Label') },
	]

	return (
		<>
			<JsonLd data={organization} />
			{/* Hero */}
			<section className="relative flex items-center overflow-hidden pt-32 pb-24">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />

				<div className="relative mx-auto w-full max-w-7xl px-6">
					<div className="flex flex-col items-start gap-8">
						<div className="hero-animate hero-animate-delay-1 inline-flex items-center gap-2 rounded-full bg-secondary-container/20 px-4 py-1.5">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
							<span className="font-sans text-xs font-medium text-on-secondary-container">
								{t('heroBadge')}
							</span>
						</div>

						<h1 className="hero-animate hero-animate-delay-2 max-w-3xl font-heading text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-7xl">
							{t('heroTitleStart')}{' '}
							<span className="bg-gradient-to-r from-brand to-brand-container bg-clip-text text-transparent">
								{t('heroTitleHighlight')}
							</span>
						</h1>

						<p className="hero-animate hero-animate-delay-3 max-w-xl font-sans text-lg leading-[1.7] text-foreground/60">
							{t('heroSubtitle')}
						</p>

						<div className="hero-animate hero-animate-delay-4 flex flex-col gap-4 sm:flex-row">
							<Button asChild size="lg">
								<Link href="/register/business">{t('heroCtaPrimary')}</Link>
							</Button>
							<Button asChild variant="secondary" size="lg">
								<Link href="/creators">{t('heroCtaSecondary')}</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			<SocialProofSection />

			{/* Benefits */}
			<section
				className="bg-surface-container-low py-32"
				aria-labelledby="for-businesses-benefits"
			>
				<div className="mx-auto max-w-7xl px-6">
					<ScrollReveal className="mb-16 max-w-2xl">
						<h2
							id="for-businesses-benefits"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('benefitsTitle')}
						</h2>
						<p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground">
							{t('benefitsSubtitle')}
						</p>
					</ScrollReveal>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{benefits.map((item, i) => (
							<ScrollReveal key={item.title} delay={i * 80}>
								<Card className="h-full bg-surface-container p-8">
									<CardContent className="p-0">
										<span
											className="font-heading text-3xl font-bold tracking-[-0.03em] text-brand/30"
											aria-hidden="true"
										>
											{String(i + 1).padStart(2, '0')}
										</span>
										<h3 className="mt-4 font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
											{item.title}
										</h3>
										<p className="mt-3 font-sans text-sm leading-[1.7] text-muted-foreground">
											{item.body}
										</p>
									</CardContent>
								</Card>
							</ScrollReveal>
						))}
					</div>
				</div>
			</section>

			{/* Flow */}
			<section
				className="bg-surface py-32"
				aria-labelledby="for-businesses-flow"
			>
				<div className="mx-auto max-w-5xl px-6">
					<ScrollReveal className="mb-16 text-center">
						<h2
							id="for-businesses-flow"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('flowTitle')}
						</h2>
						<p className="mx-auto mt-4 max-w-xl font-sans text-base leading-[1.7] text-muted-foreground">
							{t('flowSubtitle')}
						</p>
					</ScrollReveal>

					<ol className="flex flex-col gap-6">
						{flow.map((step, i) => (
							<ScrollReveal key={step.title} delay={i * 100}>
								<li className="flex items-start gap-6 rounded-xl bg-surface-container p-8">
									<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/15 font-heading text-lg font-bold text-brand">
										{i + 1}
									</span>
									<div>
										<h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
											{step.title}
										</h3>
										<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
											{step.body}
										</p>
									</div>
								</li>
							</ScrollReveal>
						))}
					</ol>
				</div>
			</section>

			{/* Value stats */}
			<section
				className="bg-surface-container-low py-32"
				aria-labelledby="for-businesses-value"
			>
				<div className="mx-auto max-w-7xl px-6">
					<ScrollReveal className="mb-16 max-w-2xl">
						<h2
							id="for-businesses-value"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('valueTitle')}
						</h2>
						<p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground">
							{t('valueSubtitle')}
						</p>
					</ScrollReveal>

					<div className="grid gap-6 md:grid-cols-3">
						{valueStats.map((stat, i) => (
							<ScrollReveal key={stat.label} delay={i * 100}>
								<Card className="h-full bg-surface-container p-8">
									<CardContent className="p-0">
										<p className="font-heading text-5xl font-bold tracking-[-0.03em] text-foreground md:text-6xl">
											{stat.value}
										</p>
										<p className="mt-4 font-sans text-sm leading-[1.7] text-muted-foreground">
											{stat.label}
										</p>
									</CardContent>
								</Card>
							</ScrollReveal>
						))}
					</div>
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
							<Link href="/register/business">{t('ctaPrimary')}</Link>
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
