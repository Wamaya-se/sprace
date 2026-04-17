import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ServiceForm } from '../../components/service-form'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('editServiceTitle'),
	}
}

interface EditServicePageProps {
	params: Promise<{ id: string }>
}

export default async function EditServicePage({
	params,
}: EditServicePageProps) {
	const { id } = await params
	const t = await getTranslations('services')
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/login')
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('id')
		.eq('profile_id', user.id)
		.single()

	if (!creator) {
		redirect('/dashboard')
	}

	const { data: service } = await supabase
		.from('services')
		.select(
			`
      id,
      name,
      description,
      price,
      delivery_days,
      is_active,
      creator_id,
      service_media (
        id,
        media_url,
        sort_order
      )
    `,
		)
		.eq('id', id)
		.eq('creator_id', creator.id)
		.single()

	if (!service) {
		notFound()
	}

	const media = (service.service_media ?? [])
		.sort((a, b) => a.sort_order - b.sort_order)
		.map((m) => ({
			id: m.id,
			media_url: m.media_url,
			sort_order: m.sort_order,
		}))

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-8">
				<h2 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground">
					{t('editTitle')}
				</h2>
				<p className="mt-1 font-sans text-sm leading-[1.7] text-muted-foreground">
					{t('editDescription')}
				</p>
			</div>

			<ServiceForm
				mode="edit"
				initialData={{
					id: service.id,
					name: service.name,
					description: service.description,
					price: service.price,
					delivery_days: service.delivery_days,
					is_active: service.is_active,
					media,
				}}
			/>
		</div>
	)
}
