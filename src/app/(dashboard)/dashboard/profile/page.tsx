import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
	getMyCreatorDac7,
	isBusinessDac7Complete,
	isCreatorDac7Complete,
} from '@/lib/queries/dac7'
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
		.select(
			'id, company_name, org_number, website, industry, contact_email, vat_number, address_line1, address_line2, postal_code, city, country_code, org_number_verification',
		)
		.eq('profile_id', userId)
		.single()

	if (!business) {
		redirect('/dashboard')
	}

	const billing = {
		vatNumber: business.vat_number,
		addressLine1: business.address_line1,
		addressLine2: business.address_line2,
		postalCode: business.postal_code,
		city: business.city,
		countryCode: business.country_code ?? 'SE',
		orgNumberVerification: business.org_number_verification,
	}

	const isBillingComplete = isBusinessDac7Complete({
		id: business.id,
		orgNumber: business.org_number,
		orgNumberVerification: business.org_number_verification,
		vatNumber: business.vat_number,
		addressLine1: business.address_line1,
		addressLine2: business.address_line2,
		postalCode: business.postal_code,
		city: business.city,
		countryCode: business.country_code ?? 'SE',
	})

	return (
		<BusinessProfileView
			business={{
				id: business.id,
				company_name: business.company_name,
				org_number: business.org_number,
				website: business.website,
				industry: business.industry,
				contact_email: business.contact_email,
			}}
			billing={billing}
			isBillingComplete={isBillingComplete}
		/>
	)
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

	const dac7Summary = (await getMyCreatorDac7(creator.id)) ?? {
		creatorId: creator.id,
		hasPersonalNumber: false,
		personalNumberLast4: null,
		birthDate: null,
		addressLine1: null,
		addressLine2: null,
		postalCode: null,
		city: null,
		countryCode: 'SE',
	}

	const dac7View = {
		hasPersonalNumber: dac7Summary.hasPersonalNumber,
		personalNumberLast4: dac7Summary.personalNumberLast4,
		birthDate: dac7Summary.birthDate,
		addressLine1: dac7Summary.addressLine1,
		addressLine2: dac7Summary.addressLine2,
		postalCode: dac7Summary.postalCode,
		city: dac7Summary.city,
		countryCode: dac7Summary.countryCode ?? 'SE',
	}

	const isDac7Complete = isCreatorDac7Complete(dac7Summary)

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
			dac7={dac7View}
			isDac7Complete={isDac7Complete}
		/>
	)
}
