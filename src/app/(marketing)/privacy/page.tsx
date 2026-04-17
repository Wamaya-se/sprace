import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	const title = t('privacyTitle')
	const description = t('privacyDescription')
	return {
		title,
		description,
		openGraph: { title, description },
		twitter: { card: 'summary', title, description },
	}
}

export default async function PrivacyPage() {
	const t = await getTranslations('legal')

	return (
		<div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
			<h1 className="font-heading text-3xl font-bold tracking-[-0.03em] text-foreground lg:text-4xl">
				{t('privacyTitle')}
			</h1>
			<p className="mt-2 font-sans text-sm text-muted-foreground">
				{t('lastUpdated', { date: '2026-03-31' })}
			</p>

			<div className="mt-10 space-y-8 font-sans text-sm leading-[1.7] text-foreground/70">
				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('privacyIntroTitle')}
					</h2>
					<p className="mt-2">{t('privacyIntroBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('dataCollectionTitle')}
					</h2>
					<p className="mt-2">{t('dataCollectionBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('dataUsageTitle')}
					</h2>
					<p className="mt-2">{t('dataUsageBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('dataSharingTitle')}
					</h2>
					<p className="mt-2">{t('dataSharingBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('dataStorageTitle')}
					</h2>
					<p className="mt-2">{t('dataStorageBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('userRightsTitle')}
					</h2>
					<p className="mt-2">{t('userRightsBody')}</p>
				</section>

				<section>
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('cookiesTitle')}
					</h2>
					<p className="mt-2">{t('cookiesBody')}</p>
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
