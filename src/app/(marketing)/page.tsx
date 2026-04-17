import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FAQSection } from '@/components/shared/faq-section'
import { JsonLd } from '@/components/shared/json-ld'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { SocialProofSection } from '@/components/shared/social-proof-section'
import { TestimonialsSection } from '@/components/shared/testimonials-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getOrganizationJsonLd } from '@/lib/seo/organization'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('homeTitle'),
		description: t('homeDescription'),
		openGraph: {
			title: t('homeTitle'),
			description: t('homeDescription'),
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: t('homeTitle'),
			description: t('homeDescription'),
		},
	}
}

interface LandingCreator {
	id: string
	name: string
	slug: string
	avatarUrl: string | null
	specialty: string | null
	followersCount: number
	averageRating: number
}

function formatFollowers(count: number): string {
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
	if (count >= 1_000)
		return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`
	return String(count)
}

async function getTopCreators(): Promise<LandingCreator[]> {
	const supabase = await createClient()
	const { data: creators, error } = await supabase
		.from('creators')
		.select(
			`
			id,
			profile_id,
			display_name,
			followers_count,
			slug,
			profile:profiles!creators_profile_id_fkey!inner(avatar_url, is_suspended),
			specialties:creator_specialties(
				specialty:specialties(name)
			)
		`,
		)
		.eq('status', 'active')
		.eq('profile.is_suspended', false)
		.not('slug', 'is', null)
		.order('followers_count', { ascending: false })
		.limit(12)

	if (error || !creators) {
		console.error('[getTopCreators]', error)
		return []
	}

	const profileIds = creators.map((c) => c.profile_id)
	const { data: reviewAggs } =
		profileIds.length > 0
			? await supabase
					.from('reviews')
					.select('reviewee_id, rating')
					.in('reviewee_id', profileIds)
			: { data: [] as { reviewee_id: string; rating: number }[] }

	const ratingMap = new Map<string, { sum: number; count: number }>()
	for (const r of reviewAggs ?? []) {
		const entry = ratingMap.get(r.reviewee_id) ?? { sum: 0, count: 0 }
		entry.sum += r.rating
		entry.count += 1
		ratingMap.set(r.reviewee_id, entry)
	}

	const ranked = creators
		.map((c) => {
			const rating = ratingMap.get(c.profile_id)
			const firstSpecialty =
				(c.specialties?.[0]?.specialty as { name: string } | null)?.name ?? null
			return {
				id: c.id,
				name: c.display_name,
				slug: c.slug as string,
				avatarUrl:
					(c.profile as { avatar_url: string | null } | null)?.avatar_url ??
					null,
				specialty: firstSpecialty,
				followersCount: c.followers_count ?? 0,
				averageRating: rating ? rating.sum / rating.count : 0,
			}
		})
		.sort((a, b) => {
			if (b.averageRating !== a.averageRating)
				return b.averageRating - a.averageRating
			return b.followersCount - a.followersCount
		})

	return ranked.slice(0, 3)
}

export default async function HomePage() {
	const tHero = await getTranslations('hero')
	const tCreators = await getTranslations('creators')
	const tHowItWorks = await getTranslations('howItWorks')
	const tFaq = await getTranslations('faq')
	const tCta = await getTranslations('cta')
	const tCommon = await getTranslations('common')
	const [creators, organization] = await Promise.all([
		getTopCreators(),
		getOrganizationJsonLd(),
	])

	const faqKeys = ['1', '2', '3', '4', '5', '6', '7'] as const
	const faqJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqKeys.map((k) => ({
			'@type': 'Question',
			name: tFaq(`q${k}`),
			acceptedAnswer: {
				'@type': 'Answer',
				text: tFaq(`a${k}`),
			},
		})),
	}

	const steps = [
		{
			number: '01',
			title: tHowItWorks('step1Title'),
			description: tHowItWorks('step1Description'),
		},
		{
			number: '02',
			title: tHowItWorks('step2Title'),
			description: tHowItWorks('step2Description'),
		},
		{
			number: '03',
			title: tHowItWorks('step3Title'),
			description: tHowItWorks('step3Description'),
		},
	]

	return (
		<>
			{/* Hero */}
			<section className="relative flex min-h-screen items-center overflow-hidden pt-16">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />

				<div className="relative mx-auto max-w-7xl px-6 py-32">
					<div className="flex flex-col items-start gap-8">
						<div className="hero-animate hero-animate-delay-1 inline-flex items-center gap-2 rounded-full bg-secondary-container/20 px-4 py-1.5">
							<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
							<span className="font-sans text-xs font-medium text-on-secondary-container">
								{tHero('badge')}
							</span>
						</div>

						<h1 className="hero-animate hero-animate-delay-2 max-w-3xl font-heading text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-7xl">
							{tHero('titleStart')}{' '}
							<span className="bg-gradient-to-r from-brand to-brand-container bg-clip-text text-transparent">
								{tHero('titleHighlight')}
							</span>
						</h1>

						<p className="hero-animate hero-animate-delay-3 max-w-xl font-sans text-lg leading-[1.7] text-foreground/60">
							{tHero('subtitle')}
						</p>

						<div className="hero-animate hero-animate-delay-4 flex flex-col gap-4 sm:flex-row">
							<Button asChild size="lg">
								<Link href="/register">{tHero('findCreators')}</Link>
							</Button>
							<Button asChild variant="secondary" size="lg">
								<Link href="/register">{tHero('becomeCreator')}</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			<SocialProofSection />

			{/* Creators showcase */}
			<section id="creators" className="bg-surface-container-low py-32">
				<div className="mx-auto max-w-7xl px-6">
					<ScrollReveal className="mb-16 max-w-2xl">
						<h2 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl">
							{tCreators('title')}
						</h2>
						<p className="mt-4 font-sans text-base leading-[1.7] text-muted-foreground">
							{tCreators('subtitle')}
						</p>
					</ScrollReveal>

					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{creators.map((creator, i) => (
							<ScrollReveal key={creator.id} delay={i * 120}>
								<div className="group relative overflow-hidden rounded-xl bg-surface-container-high transition-transform duration-200 hover:-translate-y-1">
									<div className="relative aspect-[4/5]">
										{creator.avatarUrl ? (
											<Image
												src={creator.avatarUrl}
												alt={creator.name}
												fill
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
												className="object-cover"
											/>
										) : (
											<div className="h-full w-full bg-surface-container" />
										)}
										<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
									</div>
									<div className="absolute bottom-0 left-0 right-0 p-6">
										{creator.specialty && (
											<div className="mb-2 inline-flex rounded-full bg-secondary-container/80 px-3 py-1">
												<span className="font-sans text-xs font-medium text-on-secondary-container">
													{creator.specialty}
												</span>
											</div>
										)}
										<h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
											<Link
												href={`/creators/${creator.slug}`}
												className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/40 focus-visible:rounded-sm"
											>
												{creator.name}
											</Link>
										</h3>
										<p className="font-sans text-sm text-muted-foreground">
											{tCreators('followers', {
												count: formatFollowers(creator.followersCount),
											})}
										</p>
									</div>
								</div>
							</ScrollReveal>
						))}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section id="how-it-works" className="bg-surface py-32">
				<div className="mx-auto max-w-7xl px-6">
					<ScrollReveal className="mb-16 text-center">
						<h2 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl">
							{tHowItWorks('title')}
						</h2>
						<p className="mx-auto mt-4 max-w-xl font-sans text-base leading-[1.7] text-muted-foreground">
							{tHowItWorks('subtitle')}
						</p>
					</ScrollReveal>

					<div className="grid gap-8 md:grid-cols-3">
						{steps.map((step, i) => (
							<ScrollReveal key={step.number} delay={i * 150}>
								<Card className="bg-surface-container p-8">
									<CardContent className="p-0">
										<span className="font-heading text-5xl font-bold tracking-[-0.03em] text-brand/20">
											{step.number}
										</span>
										<h3 className="mt-4 font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
											{step.title}
										</h3>
										<p className="mt-3 font-sans text-sm leading-[1.7] text-muted-foreground">
											{step.description}
										</p>
									</CardContent>
								</Card>
							</ScrollReveal>
						))}
					</div>
				</div>
			</section>

			<TestimonialsSection />

			<FAQSection />

			{/* CTA */}
			<section className="relative overflow-hidden py-32">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface-container to-gradient-end" />

				<ScrollReveal className="relative mx-auto max-w-3xl px-6 text-center">
					<h2 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-6xl">
						{tCta('title')}
					</h2>
					<p className="mx-auto mt-6 max-w-lg font-sans text-lg leading-[1.7] text-foreground/60">
						{tCta('subtitle')}
					</p>
					<div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Button asChild size="lg">
							<Link href="/register">{tCta('createAccount')}</Link>
						</Button>
						<Button asChild variant="secondary" size="lg">
							<Link href="/login">{tCommon('login')}</Link>
						</Button>
					</div>
				</ScrollReveal>
			</section>

			<JsonLd data={organization} />
			<JsonLd data={faqJsonLd} />
		</>
	)
}
