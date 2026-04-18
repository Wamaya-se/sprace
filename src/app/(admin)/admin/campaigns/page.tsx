import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requireAdmin } from '@/lib/auth/guards'
import { getAllCampaignsForAdmin } from '@/lib/queries/campaigns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CampaignStatusBadge } from '@/components/campaigns/campaign-status-badge'
import { CampaignAdminActions } from '@/components/admin/campaign-admin-actions'
import type { Database } from '@/types/supabase'

type CampaignStatus = Database['public']['Enums']['campaign_status']

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('campaignsAdminTitle') }
}

interface PageProps {
	searchParams: Promise<{ status?: string }>
}

export default async function AdminCampaignsPage({ searchParams }: PageProps) {
	await requireAdmin()
	const params = await searchParams
	const t = await getTranslations('campaigns')

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

	const campaigns = await getAllCampaignsForAdmin(statusFilter)
	const activeFilter = statusFilter ?? 'all'

	const filters: Array<{ key: string; href: string; label: string }> = [
		{ key: 'all', href: '/admin/campaigns', label: t('allStatuses') },
		...allowed.map((s) => ({
			key: s,
			href: `/admin/campaigns?status=${s}`,
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

	return (
		<div className="mx-auto max-w-6xl">
			<p className="font-sans text-base leading-[1.7] text-muted-foreground">
				{t('adminDescription')}
			</p>

			<div className="mt-6 flex flex-wrap gap-2">
				{filters.map((f) => (
					<Link key={f.key} href={f.href}>
						<Badge variant={activeFilter === f.key ? 'chipActive' : 'chip'}>
							{f.label}
						</Badge>
					</Link>
				))}
			</div>

			{campaigns.length === 0 ? (
				<div className="mt-12 flex flex-col items-center justify-center rounded-xl bg-surface-container py-20 text-center">
					<p className="font-sans text-sm text-muted-foreground">
						{t('empty')}
					</p>
				</div>
			) : (
				<div className="mt-6 flex flex-col gap-3">
					{campaigns.map((c) => {
						const canCancel =
							c.status === 'draft' ||
							c.status === 'open' ||
							c.status === 'closed'
						return (
							<div key={c.id} className="rounded-xl bg-surface-container p-5">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="truncate font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
												{c.title}
											</h3>
											<CampaignStatusBadge status={c.status} />
										</div>
										<div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 font-sans text-xs text-muted-foreground">
											<span>{t('companyLabel', { name: c.company_name })}</span>
											<span>
												{t('createdAt', {
													date: new Date(c.created_at).toLocaleDateString(
														undefined,
														{ month: 'short', day: 'numeric', year: 'numeric' },
													),
												})}
											</span>
											<span>
												{t('applicationsCount', { count: c.application_count })}
											</span>
											<span>
												{t('bookingsCount', { count: c.booking_count })}
											</span>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/campaigns/${c.slug}`}>
												{t('viewPublic')}
											</Link>
										</Button>
										{canCancel && <CampaignAdminActions campaignId={c.id} />}
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
