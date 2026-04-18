import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { NewCampaignForm } from '@/components/campaigns/new-campaign-form'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('campaignNewTitle') }
}

export default async function NewCampaignPage() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user || user.app_metadata?.role !== 'business') {
		redirect('/dashboard')
	}

	const [{ data: specialties }, { data: markets }] = await Promise.all([
		supabase.from('specialties').select('id, name').order('name'),
		supabase.from('markets').select('id, name').order('name'),
	])

	const t = await getTranslations('campaigns')

	return (
		<div className="mx-auto max-w-2xl">
			<header className="mb-6">
				<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
					{t('newCampaign')}
				</h2>
				<p className="mt-1 font-sans text-sm text-muted-foreground">
					{t('description')}
				</p>
			</header>

			<NewCampaignForm
				specialties={specialties ?? []}
				markets={markets ?? []}
			/>
		</div>
	)
}
