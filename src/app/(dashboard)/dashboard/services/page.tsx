import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ServiceList } from './components/service-list'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('servicesTitle'),
	}
}

export default async function ServicesPage() {
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

	const { data: services } = await supabase
		.from('services')
		.select(
			`
      id,
      name,
      description,
      price,
      delivery_days,
      is_active,
      sort_order,
      service_media (
        id,
        media_url,
        sort_order
      )
    `,
		)
		.eq('creator_id', creator.id)
		.order('sort_order', { ascending: true })

	const mappedServices = (services ?? []).map((s) => ({
		id: s.id,
		name: s.name,
		description: s.description,
		price: s.price,
		delivery_days: s.delivery_days,
		is_active: s.is_active,
		media: (s.service_media ?? [])
			.sort((a, b) => a.sort_order - b.sort_order)
			.map((m) => ({ id: m.id, media_url: m.media_url })),
	}))

	const hasServices = mappedServices.length > 0

	return (
		<div className="mx-auto max-w-4xl">
			<div className="flex items-center justify-between">
				<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
					{t('description')}
				</p>
				{hasServices && (
					<Button variant="brand" size="sm" asChild>
						<Link href="/dashboard/services/new">{t('addService')}</Link>
					</Button>
				)}
			</div>

			{hasServices ? (
				<div className="mt-6">
					<ServiceList services={mappedServices} />
				</div>
			) : (
				<div className="mt-12 flex flex-col items-center gap-4 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest">
						<svg
							className="h-8 w-8 text-muted-foreground"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={1.5}
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
							/>
						</svg>
					</div>
					<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
						{t('emptyTitle')}
					</h2>
					<p className="max-w-xs font-sans text-sm leading-[1.7] text-muted-foreground">
						{t('emptyDescription')}
					</p>
					<Button variant="brand" asChild>
						<Link href="/dashboard/services/new">{t('addFirstService')}</Link>
					</Button>
				</div>
			)}
		</div>
	)
}
