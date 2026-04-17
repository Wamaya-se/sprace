import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './onboarding-wizard'
import { ProfileView } from './profile-view'
import { BusinessProfileView } from './business-profile-view'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('profileTitle'),
	}
}

export default async function ProfilePage() {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError || !user) {
		redirect('/login')
	}

	const role = (user.app_metadata?.role as string) || 'creator'

	if (role === 'business') {
		return renderBusinessProfile(supabase, user.id)
	}

	return renderCreatorProfile(supabase, user.id)
}

async function renderBusinessProfile(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
) {
	const { data: business } = await supabase
		.from('businesses')
		.select('id, company_name, org_number, website, industry, contact_email')
		.eq('profile_id', userId)
		.single()

	if (!business) {
		redirect('/dashboard')
	}

	return <BusinessProfileView business={business} />
}

async function renderCreatorProfile(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
) {
	const { data: profile } = await supabase
		.from('profiles')
		.select('avatar_url')
		.eq('id', userId)
		.single()

	const { data: creator } = await supabase
		.from('creators')
		.select(
			'id, display_name, bio, portfolio_url, instagram_handle, tiktok_handle, youtube_handle, hourly_rate, slug, status',
		)
		.eq('profile_id', userId)
		.single()

	if (!creator) {
		redirect('/dashboard')
	}

	const [
		{ data: specialties },
		{ data: markets },
		{ data: creatorSpecialties },
		{ data: creatorMarkets },
	] = await Promise.all([
		supabase.from('specialties').select('id, name, slug').order('name'),
		supabase
			.from('markets')
			.select('id, name, slug, flag_emoji')
			.order('sort_order'),
		supabase
			.from('creator_specialties')
			.select('specialty_id')
			.eq('creator_id', creator.id),
		supabase
			.from('creator_markets')
			.select('market_id')
			.eq('creator_id', creator.id),
	])

	const selectedSpecialtyIds = (creatorSpecialties || []).map(
		(cs) => cs.specialty_id,
	)
	const selectedMarketIds = (creatorMarkets || []).map((cm) => cm.market_id)

	if (creator.status === 'draft') {
		return (
			<OnboardingWizard
				creator={creator}
				avatarUrl={profile?.avatar_url || null}
				specialties={specialties || []}
				markets={markets || []}
				selectedSpecialtyIds={selectedSpecialtyIds}
				selectedMarketIds={selectedMarketIds}
			/>
		)
	}

	return (
		<ProfileView
			creator={creator}
			avatarUrl={profile?.avatar_url || null}
			specialties={specialties || []}
			markets={markets || []}
			selectedSpecialtyIds={selectedSpecialtyIds}
			selectedMarketIds={selectedMarketIds}
		/>
	)
}
