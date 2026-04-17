import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { NewBookingForm } from '@/components/dashboard/new-booking-form'

interface PageProps {
	searchParams: Promise<{ creatorId?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('newBookingTitle'),
	}
}

export default async function NewBookingPage({ searchParams }: PageProps) {
	const params = await searchParams
	const creatorId = params.creatorId

	if (!creatorId) {
		redirect('/dashboard/discover')
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user || user.app_metadata?.role !== 'business') {
		redirect('/dashboard')
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('id, display_name, slug, services(id, name, price, is_active)')
		.eq('id', creatorId)
		.eq('status', 'active')
		.single()

	if (!creator) {
		redirect('/dashboard/discover')
	}

	const activeServices = (creator.services ?? []).filter((s) => s.is_active)

	return (
		<div className="mx-auto max-w-2xl">
			<NewBookingForm
				creatorId={creator.id}
				creatorName={creator.display_name}
				services={activeServices}
			/>
		</div>
	)
}
