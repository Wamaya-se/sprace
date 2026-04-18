import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
	getBusinessCampaigns,
	getCreatorApplications,
} from '@/lib/queries/campaigns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
	ApplicationStatusBadge,
	CampaignStatusBadge,
} from '@/components/campaigns/campaign-status-badge'
import type { Database } from '@/types/supabase'

type CampaignStatus = Database['public']['Enums']['campaign_status']

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('campaignsDashboardTitle') }
}

interface PageProps {
	searchParams: Promise<{ status?: string }>
}

export default async function DashboardCampaignsPage({
	searchParams,
}: PageProps) {
	const params = await searchParams
	const t = await getTranslations('campaigns')
	const td = await getTranslations('dashboard')

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	const role = (user?.app_metadata?.role as string) ?? 'creator'

	if (role === 'creator') {
		const { data: creator } = await supabase
			.from('creators')
			.select('id')
			.eq('profile_id', user!.id)
			.single()

		if (!creator) {
			return (
				<div className="mx-auto max-w-6xl">
					<p className="font-sans text-sm text-muted-foreground">
						{td('campaignsDescription')}
					</p>
				</div>
			)
		}

		const applications = await getCreatorApplications(creator.id)

		return (
			<div className="mx-auto max-w-6xl">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
						{td('campaignsDescription')}
					</p>
					<Button asChild size="sm" variant="outline">
						<Link href="/campaigns">{t('browseCampaigns')}</Link>
					</Button>
				</div>

				{applications.length === 0 ? (
					<div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-surface-container py-20 text-center">
						<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
							{t('noApplications')}
						</h2>
						<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('noApplicationsCreator')}
						</p>
						<Button asChild className="mt-6">
							<Link href="/campaigns">{t('browseCampaigns')}</Link>
						</Button>
					</div>
				) : (
					<div className="mt-6 flex flex-col gap-3">
						{applications.map((app) => (
							<Card
								key={app.id}
								className="duration-150 hover:bg-surface-container-high"
							>
								<CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<Link
												href={`/campaigns/${app.campaign.slug}`}
												className="truncate font-heading text-base font-semibold tracking-[-0.03em] text-foreground hover:text-brand"
											>
												{app.campaign.title}
											</Link>
											<ApplicationStatusBadge status={app.status} />
											<CampaignStatusBadge status={app.campaign.status} />
										</div>
										<p className="mt-1 font-sans text-sm text-muted-foreground">
											{app.campaign.business?.company_name
												? t('companyLabel', {
														name: app.campaign.business.company_name,
													})
												: ''}
											{' · '}
											{t('appliedOn', {
												date: new Date(app.created_at).toLocaleDateString(
													undefined,
													{ month: 'short', day: 'numeric', year: 'numeric' },
												),
											})}
										</p>
									</div>
									<div className="flex items-center gap-2">
										{app.booking_id && (
											<Button asChild size="sm" variant="outline">
												<Link href={`/dashboard/bookings/${app.booking_id}`}>
													{t('viewBooking')}
												</Link>
											</Button>
										)}
										<Button asChild size="sm" variant="outline">
											<Link href={`/campaigns/${app.campaign.slug}`}>
												{t('viewCampaign')}
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		)
	}

	if (role !== 'business') {
		redirect('/dashboard')
	}

	const { data: business } = await supabase
		.from('businesses')
		.select('id')
		.eq('profile_id', user!.id)
		.single()

	if (!business) {
		return (
			<div className="mx-auto max-w-6xl">
				<p className="font-sans text-sm text-muted-foreground">
					{td('campaignsDescription')}
				</p>
			</div>
		)
	}

	const allowed: CampaignStatus[] = [
		'draft',
		'open',
		'closed',
		'completed',
		'cancelled',
	]
	const statusFilter =
		params.status && allowed.includes(params.status as CampaignStatus)
			? (params.status as CampaignStatus)
			: undefined

	const campaigns = await getBusinessCampaigns(business.id, statusFilter)

	const statusKeys: Array<{ key: string; href: string; label: string }> = [
		{ key: 'all', href: '/dashboard/campaigns', label: t('allStatuses') },
		...allowed.map((s) => ({
			key: s,
			href: `/dashboard/campaigns?status=${s}`,
			label: t(
				`status${s.charAt(0).toUpperCase()}${s.slice(1)}` as
					| 'statusDraft'
					| 'statusOpen'
					| 'statusClosed'
					| 'statusCompleted'
					| 'statusCancelled',
			),
		})),
	]

	const activeFilter = statusFilter ?? 'all'

	return (
		<div className="mx-auto max-w-6xl">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
					{td('campaignsDescription')}
				</p>
				<Button asChild size="sm">
					<Link href="/dashboard/campaigns/new">{t('newCampaign')}</Link>
				</Button>
			</div>

			<div className="mt-6 flex flex-wrap gap-2">
				{statusKeys.map((s) => (
					<Link key={s.key} href={s.href}>
						<Badge variant={activeFilter === s.key ? 'chipActive' : 'chip'}>
							{s.label}
						</Badge>
					</Link>
				))}
			</div>

			{campaigns.length === 0 ? (
				<div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-surface-container py-20 text-center">
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('noCampaigns')}
					</h2>
					<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
						{t('noCampaignsBusiness')}
					</p>
					<Button asChild className="mt-6">
						<Link href="/dashboard/campaigns/new">{t('newCampaign')}</Link>
					</Button>
				</div>
			) : (
				<div className="mt-6 flex flex-col gap-3">
					{campaigns.map((campaign) => (
						<Link
							key={campaign.id}
							href={`/dashboard/campaigns/${campaign.id}`}
						>
							<Card className="duration-150 hover:bg-surface-container-high">
								<CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="truncate font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
												{campaign.title}
											</h2>
											<CampaignStatusBadge status={campaign.status} />
										</div>
										<p className="mt-1 font-sans text-sm text-muted-foreground">
											{t('createdAt', {
												date: new Date(campaign.created_at).toLocaleDateString(
													undefined,
													{ month: 'short', day: 'numeric', year: 'numeric' },
												),
											})}
											{' · '}
											{t('applicationsCount', {
												count: campaign.application_count,
											})}
											{' · '}
											{t('bookingsCount', { count: campaign.booking_count })}
										</p>
									</div>
									{campaign.budget_per_creator && (
										<span className="shrink-0 font-sans text-sm font-medium text-foreground/60">
											{t('budgetLabel', {
												amount: campaign.budget_per_creator.toLocaleString(),
											})}
										</span>
									)}
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
