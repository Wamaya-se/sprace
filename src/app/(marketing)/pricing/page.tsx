import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FAQSection } from '@/components/shared/faq-section'
import { JsonLd } from '@/components/shared/json-ld'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getOrganizationJsonLd } from '@/lib/seo/organization'
import { createClient } from '@/lib/supabase/server'
import { PricingCalculator } from './pricing-calculator'

const DEFAULT_FEE_PERCENT = 15

async function getPlatformFeePercent(): Promise<number> {
	const supabase = await createClient()
	const { data } = await supabase
		.from('platform_settings')
		.select('value')
		.eq('key', 'platform_fee_percent')
		.maybeSingle()

	const parsed = parseFloat(data?.value ?? String(DEFAULT_FEE_PERCENT))
	return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
		? parsed
		: DEFAULT_FEE_PERCENT
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('pricingTitle'),
		description: t('pricingDescription'),
		openGraph: {
			title: t('pricingTitle'),
			description: t('pricingDescription'),
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: t('pricingTitle'),
			description: t('pricingDescription'),
		},
		alternates: {
			canonical: '/pricing',
		},
	}
}

export default async function PricingPage() {
	const t = await getTranslations('pricing')
	const [feePercent, organization] = await Promise.all([
		getPlatformFeePercent(),
		getOrganizationJsonLd(),
	])

	const creatorFeatures = [
		t('creatorFeature1'),
		t('creatorFeature2'),
		t('creatorFeature3'),
		t('creatorFeature4'),
		t('creatorFeature5'),
	]

	const businessFeatures = [
		t('businessFeature1'),
		t('businessFeature2'),
		t('businessFeature3'),
		t('businessFeature4'),
		t('businessFeature5'),
	]

	const included = t('comparisonIncluded')
	const notIncluded = t('comparisonNotIncluded')
	const compareRows = [
		{ label: t('compareRow1'), sprace: included, direct: notIncluded },
		{ label: t('compareRow2'), sprace: included, direct: notIncluded },
		{ label: t('compareRow3'), sprace: included, direct: notIncluded },
		{ label: t('compareRow4'), sprace: included, direct: notIncluded },
		{ label: t('compareRow5'), sprace: included, direct: notIncluded },
		{ label: t('compareRow6'), sprace: included, direct: notIncluded },
		{ label: t('compareRow7'), sprace: included, direct: notIncluded },
		{
			label: t('compareRow8'),
			sprace: t('compareRow8Sprace'),
			direct: t('compareRow8Direct'),
		},
	]

	const pricingFaqs = [
		{ q: t('faq1Q'), a: t('faq1A') },
		{ q: t('faq2Q'), a: t('faq2A') },
		{ q: t('faq3Q'), a: t('faq3A') },
		{ q: t('faq4Q'), a: t('faq4A') },
		{ q: t('faq5Q'), a: t('faq5A') },
	]

	const faqJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: pricingFaqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: {
				'@type': 'Answer',
				text: f.a,
			},
		})),
	}

	return (
		<>
			<JsonLd data={organization} />
			<JsonLd data={faqJsonLd} />
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

			{/* Plans */}
			<section
				className="bg-surface-container-low py-32"
				aria-labelledby="plans-heading"
			>
				<div className="mx-auto max-w-7xl px-6">
					<ScrollReveal className="mb-16 max-w-2xl text-center mx-auto">
						<h2
							id="plans-heading"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('plansTitle')}
						</h2>
						<p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground">
							{t('plansSubtitle')}
						</p>
					</ScrollReveal>

					<div className="grid gap-8 md:grid-cols-2">
						<ScrollReveal>
							<Card className="h-full bg-surface-container p-8 md:p-10">
								<CardContent className="flex h-full flex-col p-0">
									<Badge className="self-start">{t('creatorPlanTitle')}</Badge>
									<div className="mt-6 flex items-baseline gap-2">
										<span className="font-heading text-5xl font-bold tracking-[-0.03em] text-foreground">
											{t('creatorPlanPrice')}
										</span>
										<span className="font-sans text-sm text-muted-foreground">
											{t('creatorPlanPriceNote')}
										</span>
									</div>
									<p className="mt-6 font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
										{t('creatorPlanFee')}
									</p>
									<p className="font-sans text-sm text-muted-foreground">
										{t('creatorPlanFeeNote')}
									</p>
									<ul className="mt-8 flex flex-1 flex-col gap-3">
										{creatorFeatures.map((feature) => (
											<li
												key={feature}
												className="flex items-start gap-3 font-sans text-sm leading-[1.7] text-foreground/70"
											>
												<svg
													className="mt-1 h-4 w-4 shrink-0 text-brand"
													viewBox="0 0 20 20"
													fill="currentColor"
													aria-hidden="true"
												>
													<path
														fillRule="evenodd"
														d="M16.704 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414L8.5 12.086l6.79-6.793a1 1 0 011.414 0z"
														clipRule="evenodd"
													/>
												</svg>
												<span>{feature}</span>
											</li>
										))}
									</ul>
									<div className="mt-10">
										<Button asChild className="w-full sm:w-auto">
											<Link href="/register/creator">{t('creatorCta')}</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						</ScrollReveal>

						<ScrollReveal delay={120}>
							<Card className="h-full bg-surface-container p-8 md:p-10">
								<CardContent className="flex h-full flex-col p-0">
									<Badge variant="secondary" className="self-start">
										{t('businessPlanTitle')}
									</Badge>
									<div className="mt-6 flex items-baseline gap-2">
										<span className="font-heading text-5xl font-bold tracking-[-0.03em] text-foreground">
											{t('businessPlanPrice')}
										</span>
										<span className="font-sans text-sm text-muted-foreground">
											{t('businessPlanPriceNote')}
										</span>
									</div>
									<p className="mt-6 font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
										{t('businessPlanFee')}
									</p>
									<p className="font-sans text-sm text-muted-foreground">
										{t('businessPlanFeeNote')}
									</p>
									<ul className="mt-8 flex flex-1 flex-col gap-3">
										{businessFeatures.map((feature) => (
											<li
												key={feature}
												className="flex items-start gap-3 font-sans text-sm leading-[1.7] text-foreground/70"
											>
												<svg
													className="mt-1 h-4 w-4 shrink-0 text-brand"
													viewBox="0 0 20 20"
													fill="currentColor"
													aria-hidden="true"
												>
													<path
														fillRule="evenodd"
														d="M16.704 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414L8.5 12.086l6.79-6.793a1 1 0 011.414 0z"
														clipRule="evenodd"
													/>
												</svg>
												<span>{feature}</span>
											</li>
										))}
									</ul>
									<div className="mt-10">
										<Button asChild className="w-full sm:w-auto">
											<Link href="/register/business">{t('businessCta')}</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						</ScrollReveal>
					</div>
				</div>
			</section>

			{/* Calculator */}
			<section
				className="bg-surface py-32"
				aria-labelledby="calculator-heading"
			>
				<div className="mx-auto max-w-4xl px-6">
					<ScrollReveal className="mb-12 text-center">
						<h2
							id="calculator-heading"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('calculatorTitle')}
						</h2>
						<p className="mx-auto mt-4 max-w-xl font-sans text-base leading-[1.7] text-muted-foreground">
							{t('calculatorSubtitle')}
						</p>
					</ScrollReveal>

					<ScrollReveal delay={100}>
						<PricingCalculator feePercent={feePercent} />
					</ScrollReveal>
				</div>
			</section>

			{/* Comparison */}
			<section
				className="bg-surface-container-low py-32"
				aria-labelledby="comparison-heading"
			>
				<div className="mx-auto max-w-5xl px-6">
					<ScrollReveal className="mb-16 max-w-2xl text-center mx-auto">
						<h2
							id="comparison-heading"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('comparisonTitle')}
						</h2>
						<p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground">
							{t('comparisonSubtitle')}
						</p>
					</ScrollReveal>

					<ScrollReveal delay={100}>
						<Card className="bg-surface-container p-6 md:p-8">
							<CardContent className="p-0">
								<div className="overflow-x-auto">
									<table className="w-full border-collapse font-sans text-sm">
										<thead>
											<tr className="border-b border-outline-variant/20">
												<th
													scope="col"
													className="pb-4 text-left font-heading text-sm font-semibold tracking-[-0.03em] text-foreground"
												>
													{t('comparisonFeature')}
												</th>
												<th
													scope="col"
													className="pb-4 text-right font-heading text-sm font-semibold tracking-[-0.03em] text-brand md:text-center"
												>
													{t('comparisonSprace')}
												</th>
												<th
													scope="col"
													className="pb-4 text-right font-heading text-sm font-semibold tracking-[-0.03em] text-muted-foreground md:text-center"
												>
													{t('comparisonDirect')}
												</th>
											</tr>
										</thead>
										<tbody>
											{compareRows.map((row) => (
												<tr
													key={row.label}
													className="border-b border-outline-variant/10 last:border-b-0"
												>
													<th
														scope="row"
														className="py-4 pr-4 text-left font-sans text-sm font-normal text-foreground/70"
													>
														{row.label}
													</th>
													<td className="py-4 text-right font-sans text-sm text-foreground md:text-center">
														{row.sprace}
													</td>
													<td className="py-4 text-right font-sans text-sm text-muted-foreground md:text-center">
														{row.direct}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</ScrollReveal>
				</div>
			</section>

			{/* FAQ — pricing-specific */}
			<FAQSection
				heading={t('faqTitle')}
				headingId="pricing-faq-heading"
				items={pricingFaqs.map((f, i) => ({
					id: `pricing-faq-${i}`,
					question: f.q,
					answer: f.a,
				}))}
			/>

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
