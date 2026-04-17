import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('howItWorksTitle'),
		description: t('howItWorksDescription'),
		openGraph: {
			title: t('howItWorksTitle'),
			description: t('howItWorksDescription'),
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: t('howItWorksTitle'),
			description: t('howItWorksDescription'),
		},
		alternates: {
			canonical: '/how-it-works',
		},
	}
}

export default async function HowItWorksPage() {
	const t = await getTranslations('howItWorksPage')

	const creatorSteps = [
		{ title: t('creatorStep1Title'), body: t('creatorStep1Body') },
		{ title: t('creatorStep2Title'), body: t('creatorStep2Body') },
		{ title: t('creatorStep3Title'), body: t('creatorStep3Body') },
		{ title: t('creatorStep4Title'), body: t('creatorStep4Body') },
		{ title: t('creatorStep5Title'), body: t('creatorStep5Body') },
	]

	const businessSteps = [
		{ title: t('businessStep1Title'), body: t('businessStep1Body') },
		{ title: t('businessStep2Title'), body: t('businessStep2Body') },
		{ title: t('businessStep3Title'), body: t('businessStep3Body') },
		{ title: t('businessStep4Title'), body: t('businessStep4Body') },
		{ title: t('businessStep5Title'), body: t('businessStep5Body') },
	]

	const safety = [
		{ title: t('safety1Title'), body: t('safety1Body') },
		{ title: t('safety2Title'), body: t('safety2Body') },
		{ title: t('safety3Title'), body: t('safety3Body') },
		{ title: t('safety4Title'), body: t('safety4Body') },
	]

	const howToJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: t('heroTitle'),
		description: t('heroSubtitle'),
		step: [
			...creatorSteps.map((s, i) => ({
				'@type': 'HowToStep',
				position: i + 1,
				name: s.title,
				text: s.body,
			})),
			...businessSteps.map((s, i) => ({
				'@type': 'HowToStep',
				position: creatorSteps.length + i + 1,
				name: s.title,
				text: s.body,
			})),
		],
	}

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
			/>
			{/* Hero */}
			<section className="relative overflow-hidden pt-32 pb-20">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />

				<div className="relative mx-auto max-w-4xl px-6 text-center">
					<h1 className="hero-animate hero-animate-delay-1 font-heading text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-7xl">
						{t('heroTitle')}
					</h1>
					<p className="hero-animate hero-animate-delay-2 mx-auto mt-6 max-w-2xl font-sans text-lg leading-[1.7] text-foreground/60">
						{t('heroSubtitle')}
					</p>
				</div>
			</section>

			{/* Dual flows */}
			<section
				className="bg-surface-container-low py-32"
				aria-labelledby="dual-flows"
			>
				<h2 id="dual-flows" className="sr-only">
					{t('heroTitle')}
				</h2>

				<div className="mx-auto max-w-7xl px-6">
					<div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
						{/* Creators column */}
						<ScrollReveal>
							<Card className="h-full bg-surface-container p-8 md:p-10">
								<CardContent className="p-0">
									<Badge>{t('creatorsTabTitle')}</Badge>
									<h3 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">
										{t('creatorsTabSubtitle')}
									</h3>
									<ol className="mt-8 flex flex-col gap-6">
										{creatorSteps.map((step, i) => (
											<li key={step.title} className="flex gap-5">
												<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-heading text-base font-bold text-foreground">
													{i + 1}
												</span>
												<div>
													<h4 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
														{step.title}
													</h4>
													<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
														{step.body}
													</p>
												</div>
											</li>
										))}
									</ol>
									<div className="mt-10">
										<Button asChild>
											<Link href="/register/creator">
												{t('creatorsTabCta')}
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						</ScrollReveal>

						{/* Businesses column */}
						<ScrollReveal delay={120}>
							<Card className="h-full bg-surface-container p-8 md:p-10">
								<CardContent className="p-0">
									<Badge variant="secondary">{t('businessesTabTitle')}</Badge>
									<h3 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">
										{t('businessesTabSubtitle')}
									</h3>
									<ol className="mt-8 flex flex-col gap-6">
										{businessSteps.map((step, i) => (
											<li key={step.title} className="flex gap-5">
												<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-heading text-base font-bold text-foreground">
													{i + 1}
												</span>
												<div>
													<h4 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
														{step.title}
													</h4>
													<p className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground">
														{step.body}
													</p>
												</div>
											</li>
										))}
									</ol>
									<div className="mt-10">
										<Button asChild>
											<Link href="/register/business">
												{t('businessesTabCta')}
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						</ScrollReveal>
					</div>
				</div>
			</section>

			{/* Safety & protections */}
			<section className="bg-surface py-32" aria-labelledby="safety-heading">
				<div className="mx-auto max-w-7xl px-6">
					<ScrollReveal className="mb-16 max-w-2xl text-center mx-auto">
						<h2
							id="safety-heading"
							className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl"
						>
							{t('safetyTitle')}
						</h2>
						<p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground">
							{t('safetySubtitle')}
						</p>
					</ScrollReveal>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{safety.map((item, i) => (
							<ScrollReveal key={item.title} delay={i * 80}>
								<Card className="h-full bg-surface-container p-8">
									<CardContent className="p-0">
										<h3 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
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
							<Link href="/pricing">{t('ctaSecondary')}</Link>
						</Button>
					</div>
				</ScrollReveal>
			</section>
		</>
	)
}
