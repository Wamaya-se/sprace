import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ServiceForm } from '../components/service-form'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('newServiceTitle'),
	}
}

export default async function NewServicePage() {
	const t = await getTranslations('services')

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-8">
				<h2 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground">
					{t('createTitle')}
				</h2>
				<p className="mt-1 font-sans text-sm leading-[1.7] text-muted-foreground">
					{t('createDescription')}
				</p>
			</div>

			<ServiceForm mode="create" />
		</div>
	)
}
