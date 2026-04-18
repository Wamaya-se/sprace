import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
	getCampaignApplications,
	getCampaignBookings,
	getCampaignById,
} from '@/lib/queries/campaigns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
	ApplicationStatusBadge,
	CampaignStatusBadge,
} from '@/components/campaigns/campaign-status-badge'
import { CampaignActions } from '@/components/campaigns/campaign-actions'
import { ApplicationActions } from '@/components/campaigns/application-actions'

interface PageProps {
	params: Promise<{ id: string }>
	searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params
	const campaign = await getCampaignById(id)
	const t = await getTranslations('metadata')
	if (!campaign) return { title: t('campaignsDashboardTitle') }
	return { title: t('campaignDetailTitle', { title: campaign.title }) }
}

const bookingStatusVariant: Record<
	string,
	'default' | 'secondary' | 'outline'
> = {
	pending: 'outline',
	awaiting_payment: 'outline',
	accepted: 'secondary',
	in_progress: 'default',
	delivered: 'default',
	completed: 'secondary',
	declined: 'outline',
	cancelled: 'outline',
	disputed: 'default',
}

export default async function CampaignDetailPage({
	params,
	searchParams,
}: PageProps) {
	const { id } = await params
	const { tab = 'details' } = await searchParams

	const campaign = await getCampaignById(id)
	if (!campaign) {
		redirect('/dashboard/campaigns')
	}

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const role = (user.app_metadata?.role as string) ?? 'creator'
	const isOwner = campaign.business.profile_id === user.id

	if (role !== 'business' && !isOwner) {
		redirect('/dashboard/campaigns')
	}

	const t = await getTranslations('campaigns')
	const tb = await getTranslations('bookings')

	const [applications, bookings] = await Promise.all([
		getCampaignApplications(campaign.id),
		getCampaignBookings(campaign.id),
	])

	const tabs: Array<{
		key: 'details' | 'applications' | 'bookings'
		label: string
	}> = [
		{ key: 'details', label: t('tabDetails') },
		{ key: 'applications', label: t('tabApplications') },
		{ key: 'bookings', label: t('tabBookings') },
	]

	const activeTab = tabs.find((tx) => tx.key === tab)?.key ?? 'details'

	return (
		<div className="mx-auto max-w-5xl">
			<Link
				href="/dashboard/campaigns"
				className="font-sans text-sm text-muted-foreground hover:text-foreground"
			>
				← {t('backToCampaigns')}
			</Link>

			<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground lg:text-2xl">
							{campaign.title}
						</h2>
						<CampaignStatusBadge status={campaign.status} />
					</div>
					<p className="mt-1 font-sans text-sm text-muted-foreground">
						{t('createdAt', {
							date: new Date(campaign.created_at).toLocaleDateString(
								undefined,
								{
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								},
							),
						})}
					</p>
				</div>
				<CampaignActions
					campaignId={campaign.id}
					status={campaign.status}
					isOwner={isOwner}
					slug={campaign.slug}
				/>
			</div>

			<nav
				aria-label={t('tabDetails')}
				className="mt-6 flex gap-2 border-b border-outline-variant/10"
			>
				{tabs.map((tx) => {
					const active = tx.key === activeTab
					const count =
						tx.key === 'applications'
							? applications.length
							: tx.key === 'bookings'
								? bookings.length
								: null
					return (
						<Link
							key={tx.key}
							href={`/dashboard/campaigns/${campaign.id}?tab=${tx.key}`}
							className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 font-sans text-sm ${
								active
									? 'border-brand text-foreground'
									: 'border-transparent text-muted-foreground hover:text-foreground'
							}`}
						>
							{tx.label}
							{count !== null && (
								<span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-muted-foreground">
									{count}
								</span>
							)}
						</Link>
					)
				})}
			</nav>

			{activeTab === 'details' && (
				<div className="mt-6 flex flex-col gap-5">
					<Card>
						<CardContent className="py-5">
							<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
								{t('descriptionLabel')}
							</h3>
							<p className="mt-2 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/90">
								{campaign.description}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col gap-3 py-5 font-sans text-sm">
							{campaign.budget_per_creator && (
								<p className="text-foreground/80">
									{t('budgetLabel', {
										amount: campaign.budget_per_creator.toLocaleString(),
									})}
								</p>
							)}
							{campaign.total_budget && (
								<p className="text-foreground/80">
									{t('totalBudgetLabel2', {
										amount: campaign.total_budget.toLocaleString(),
									})}
								</p>
							)}
							{campaign.deadline && (
								<p className="text-foreground/80">
									{t('deadlineValue', {
										date: new Date(campaign.deadline).toLocaleDateString(
											undefined,
											{ month: 'short', day: 'numeric', year: 'numeric' },
										),
									})}
								</p>
							)}
							{campaign.specialties.length > 0 && (
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-muted-foreground">
										{t('specialtiesLabel')}:
									</span>
									{campaign.specialties.map((s) => (
										<Badge key={s.id} variant="outline">
											{s.name}
										</Badge>
									))}
								</div>
							)}
							{campaign.markets.length > 0 && (
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-muted-foreground">
										{t('marketsLabel')}:
									</span>
									{campaign.markets.map((m) => (
										<Badge key={m.id} variant="outline">
											{m.flag_emoji ? `${m.flag_emoji} ` : ''}
											{m.name}
										</Badge>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{activeTab === 'applications' && (
				<div className="mt-6 flex flex-col gap-3">
					{applications.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-16 text-center">
							<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
								{t('noApplications')}
							</h3>
							<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
								{t('noApplicationsCampaign')}
							</p>
						</div>
					) : (
						applications.map((app) => (
							<Card key={app.id}>
								<CardContent className="flex flex-col gap-3 py-4">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<Link
												href={
													app.creator.slug
														? `/creator/${app.creator.slug}`
														: `/dashboard/campaigns/${campaign.id}/applications/${app.id}`
												}
												className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground hover:text-brand"
											>
												{app.creator.display_name}
											</Link>
											<p className="mt-1 font-sans text-xs text-muted-foreground">
												{t('appliedOn', {
													date: new Date(app.created_at).toLocaleDateString(
														undefined,
														{
															month: 'short',
															day: 'numeric',
															year: 'numeric',
														},
													),
												})}
												{app.proposed_price &&
													` · ${t('budgetLabel', { amount: app.proposed_price.toLocaleString() })}`}
											</p>
										</div>
										<ApplicationStatusBadge status={app.status} />
									</div>
									<p className="line-clamp-3 font-sans text-sm leading-[1.6] text-foreground/80">
										{app.pitch}
									</p>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<Button asChild size="sm" variant="outline">
											<Link
												href={`/dashboard/campaigns/${campaign.id}/applications/${app.id}`}
											>
												{t('applicationDetail')}
											</Link>
										</Button>
										<ApplicationActions
											applicationId={app.id}
											status={app.status}
											role="business"
											conversationId={app.conversation_id}
											bookingId={app.booking_id}
										/>
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>
			)}

			{activeTab === 'bookings' && (
				<div className="mt-6 flex flex-col gap-3">
					{bookings.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-16 text-center">
							<p className="font-sans text-sm text-muted-foreground">
								{t('noBookings')}
							</p>
						</div>
					) : (
						bookings.map((b) => (
							<Link key={b.id} href={`/dashboard/bookings/${b.id}`}>
								<Card className="duration-150 hover:bg-surface-container-high">
									<CardContent className="flex items-center justify-between gap-4 py-4">
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<h3 className="truncate font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
													{b.title}
												</h3>
												<Badge
													variant={bookingStatusVariant[b.status] ?? 'outline'}
												>
													{tb(
														`status${b.status.charAt(0).toUpperCase() + b.status.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as never,
													)}
												</Badge>
											</div>
											<p className="mt-1 font-sans text-sm text-muted-foreground">
												{b.creator.display_name}
											</p>
										</div>
										{b.budget && (
											<span className="shrink-0 font-sans text-sm font-medium text-foreground/60">
												{t('budgetLabel', {
													amount: b.budget.toLocaleString(),
												})}
											</span>
										)}
									</CardContent>
								</Card>
							</Link>
						))
					)}
				</div>
			)}

			<Separator className="my-12 opacity-0" />
		</div>
	)
}
