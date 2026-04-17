import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/shared/json-ld'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { Card, CardContent } from '@/components/ui/card'
import { env } from '@/lib/env'
import { getPlatformEntity } from '@/lib/queries/platform-entity'
import { getOrganizationJsonLd } from '@/lib/seo/organization'
import { ContactForm } from './contact-form'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('contactTitle'),
		description: t('contactDescription'),
		openGraph: {
			title: t('contactTitle'),
			description: t('contactDescription'),
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: t('contactTitle'),
			description: t('contactDescription'),
		},
		alternates: { canonical: '/contact' },
	}
}

export default async function ContactPage() {
	const t = await getTranslations('contactPage')
	const [entity, organization] = await Promise.all([
		getPlatformEntity(),
		getOrganizationJsonLd(),
	])

	const contactEmail = entity.billingEmail
	const siteUrl = env.siteUrl

	const contactPageJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'ContactPage',
		name: t('heroTitle'),
		url: `${siteUrl}/contact`,
		description: t('heroSubtitle'),
	}

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
				item: `${siteUrl}/contact`,
			},
		],
	}

	const addressLines = [
		entity.addressLine1,
		entity.addressLine2,
		[entity.postalCode, entity.city].filter(Boolean).join(' '),
		entity.countryCode,
	].filter(Boolean)

	return (
		<>
			<JsonLd data={organization} />
			<JsonLd data={contactPageJsonLd} />
			<JsonLd data={breadcrumbs} />

			{/* Hero */}
			<section className="relative overflow-hidden pt-32 pb-16">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />

				<div className="relative mx-auto max-w-4xl px-6 text-center">
					<h1 className="hero-animate hero-animate-delay-1 font-heading text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-6xl">
						{t('heroTitle')}
					</h1>
					<p className="hero-animate hero-animate-delay-2 mx-auto mt-6 max-w-2xl font-sans text-lg leading-[1.7] text-foreground/60">
						{t('heroSubtitle')}
					</p>
				</div>
			</section>

			{/* Form + sidebar */}
			<section
				className="bg-surface-container-low py-20"
				aria-labelledby="contact-form-heading"
			>
				<div className="mx-auto max-w-6xl px-6">
					<div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
						<ScrollReveal>
							<Card className="bg-surface-container p-8 md:p-10">
								<CardContent className="p-0">
									<h2
										id="contact-form-heading"
										className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl"
									>
										{t('formTitle')}
									</h2>
									<p className="mt-3 font-sans text-sm leading-[1.7] text-muted-foreground">
										{t('formSubtitle')}
									</p>

									<div className="mt-8">
										<ContactForm />
									</div>
								</CardContent>
							</Card>
						</ScrollReveal>

						<ScrollReveal delay={120}>
							<div className="flex flex-col gap-6">
								<Card className="bg-surface-container p-8">
									<CardContent className="p-0">
										<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
											{t('emailTitle')}
										</h2>
										<p className="mt-3 font-sans text-sm leading-[1.7] text-muted-foreground">
											{t('emailBody')}
										</p>
										<a
											href={`mailto:${contactEmail}`}
											className="mt-4 inline-flex rounded-sm font-sans text-sm font-medium text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/50"
										>
											{contactEmail}
										</a>
									</CardContent>
								</Card>

								<Card className="bg-surface-container p-8">
									<CardContent className="p-0">
										<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
											{t('officeTitle')}
										</h2>
										<address className="mt-3 font-sans text-sm not-italic leading-[1.7] text-muted-foreground">
											<p className="text-foreground">{entity.legalName}</p>
											{addressLines.map((line) => (
												<p key={line}>{line}</p>
											))}
										</address>
									</CardContent>
								</Card>

								<Card className="bg-surface-container p-8">
									<CardContent className="p-0">
										<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
											{t('responseTitle')}
										</h2>
										<p className="mt-3 font-sans text-sm leading-[1.7] text-muted-foreground">
											{t('responseBody')}
										</p>
									</CardContent>
								</Card>
							</div>
						</ScrollReveal>
					</div>
				</div>
			</section>
		</>
	)
}
