import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('campaignsTitle'),
	}
}

export default async function CampaignsPage() {
	const t = await getTranslations('dashboard')
	return (
		<div className="mx-auto max-w-4xl">
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('campaignsDescription')}
			</p>

			<Card className="mt-8 p-8">
				<CardContent>
					<p className="font-sans text-sm text-muted-foreground">
						{t('campaignsComingSoon')}
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
