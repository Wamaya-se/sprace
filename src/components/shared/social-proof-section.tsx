import { getTranslations } from 'next-intl/server'
import { ScrollReveal } from '@/components/shared/scroll-reveal'
import { Card, CardContent } from '@/components/ui/card'
import { getPublicLandingStats } from '@/lib/marketing/get-public-landing-stats'

function formatStatValue(value: number): string {
	return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
		value,
	)
}

export async function SocialProofSection() {
	const t = await getTranslations('socialProof')
	const stats = await getPublicLandingStats()

	const items = [
		{
			label: t('activeCreatorsLabel'),
			value: formatStatValue(stats.activeCreators),
		},
		{
			label: t('completedBookingsLabel'),
			value: formatStatValue(stats.completedBookings),
		},
	]

	const partners = [t('partnerName1'), t('partnerName2'), t('partnerName3')]

	return (
		<section
			className="bg-surface py-20"
			aria-labelledby="social-proof-heading"
		>
			<div className="mx-auto max-w-7xl px-6">
				<ScrollReveal>
					<h2
						id="social-proof-heading"
						className="font-heading text-3xl font-bold tracking-[-0.03em] text-foreground md:text-4xl"
					>
						{t('title')}
					</h2>
					<p className="mt-3 max-w-2xl font-sans text-base leading-[1.7] text-muted-foreground">
						{t('subtitle')}
					</p>
				</ScrollReveal>

				<ul className="mt-12 grid list-none gap-8 p-0 sm:grid-cols-2">
					{items.map((item, i) => (
						<li key={item.label}>
							<ScrollReveal delay={i * 150}>
								<Card className="bg-surface-container-low px-8 py-6">
									<CardContent className="p-0">
										<p className="font-sans text-sm font-medium text-muted-foreground">
											{item.label}
										</p>
										<p className="mt-2 font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl">
											{item.value}
										</p>
									</CardContent>
								</Card>
							</ScrollReveal>
						</li>
					))}
				</ul>

				<ScrollReveal className="mt-16">
					<p className="font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
						{t('partnersTitle')}
					</p>
					<ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4">
						{partners.map((name) => (
							<li key={name}>
								<span className="font-heading text-lg tracking-[-0.03em] text-muted-foreground">
									{name}
								</span>
							</li>
						))}
					</ul>
				</ScrollReveal>
			</div>
		</section>
	)
}
