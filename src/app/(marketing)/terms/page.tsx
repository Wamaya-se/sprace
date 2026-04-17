import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/shared/json-ld'
import { getOrganizationJsonLd } from '@/lib/seo/organization'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	const title = t('termsTitle')
	const description = t('termsDescription')
	return {
		title,
		description,
		openGraph: { title, description },
		twitter: { card: 'summary', title, description },
	}
}

export default async function TermsPage() {
	const [t, organization] = await Promise.all([
		getTranslations('legal'),
		getOrganizationJsonLd(),
	])

	return (
		<div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
			<JsonLd data={organization} />
			<h1 className="font-heading text-3xl font-bold tracking-[-0.03em] text-foreground lg:text-4xl">
				{t('termsTitle')}
			</h1>
			<p className="mt-2 font-sans text-sm text-muted-foreground">
				{t('lastUpdated', { date: '2026-03-31' })}
			</p>

			<div className="mt-10 space-y-8 font-sans text-sm leading-[1.7] text-foreground/70">
				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('termsIntroTitle')}
					</h2>
					<p className="mt-2">{t('termsIntroBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('accountsTitle')}
					</h2>
					<p className="mt-2">{t('accountsBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('platformUsageTitle')}
					</h2>
					<p className="mt-2">{t('platformUsageBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('paymentsTitle')}
					</h2>
					<p className="mt-2">{t('paymentsBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('intellectualPropertyTitle')}
					</h2>
					<p className="mt-2">{t('intellectualPropertyBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('disputeResolutionTitle')}
					</h2>
					<p className="mt-2">{t('disputeResolutionBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('limitationOfLiabilityTitle')}
					</h2>
					<p className="mt-2">{t('limitationOfLiabilityBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('terminationTitle')}
					</h2>
					<p className="mt-2">{t('terminationBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('changesToTermsTitle')}
					</h2>
					<p className="mt-2">{t('changesToTermsBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('contactTitle')}
					</h2>
					<p className="mt-2">{t('contactBody')}</p>
				</section>
			</div>
		</div>
	)
}
