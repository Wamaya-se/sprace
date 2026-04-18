import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { NewCampaignForm } from '@/components/campaigns/new-campaign-form'

interface PageProps {
	params: Promise<{ id: string }>
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('campaignsDashboardTitle') }
}

export default async function EditCampaignPage({ params }: PageProps) {
	const { id } = await params
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user || user.app_metadata?.role !== 'business') {
		redirect('/dashboard')
	}

	const { data: campaign } = await supabase
		.from('campaigns')
		.select(
			`id, title, description, budget_per_creator, total_budget, deadline,
			status, business:businesses!campaigns_business_id_fkey(profile_id),
			campaign_specialties(specialty_id),
			campaign_markets(market_id)`,
		)
		.eq('id', id)
		.single()

	if (!campaign) {
		redirect('/dashboard/campaigns')
	}

	const business = campaign.business as unknown as {
		profile_id: string
	} | null
	if (!business || business.profile_id !== user.id) {
		redirect('/dashboard/campaigns')
	}

	if (campaign.status !== 'draft' && campaign.status !== 'open') {
		redirect(`/dashboard/campaigns/${id}`)
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
					{t('edit')}
				</h2>
			</header>

			<NewCampaignForm
				specialties={specialties ?? []}
				markets={markets ?? []}
				existing={{
					id: campaign.id,
					title: campaign.title,
					description: campaign.description,
					budget_per_creator: campaign.budget_per_creator,
					total_budget: campaign.total_budget,
					deadline: campaign.deadline,
					specialty_ids: (campaign.campaign_specialties ?? []).map(
						(cs) => cs.specialty_id,
					),
					market_ids: (campaign.campaign_markets ?? []).map(
						(cm) => cm.market_id,
					),
				}}
			/>
		</div>
	)
}
