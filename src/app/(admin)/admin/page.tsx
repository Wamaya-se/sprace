import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('adminTitle'),
	}
}

async function getAdminStats() {
	const supabase = await createClient()

	const sevenDaysAgo = new Date(
		Date.now() - 7 * 24 * 60 * 60 * 1000,
	).toISOString()

	const [
		profilesRes,
		creatorsRes,
		businessesRes,
		servicesRes,
		activeServicesRes,
		pendingRes,
		recentUsersRes,
		pendingCreatorsRes,
	] = await Promise.all([
		supabase.from('profiles').select('id', { count: 'exact', head: true }),
		supabase.from('creators').select('id', { count: 'exact', head: true }),
		supabase.from('businesses').select('id', { count: 'exact', head: true }),
		supabase.from('services').select('id', { count: 'exact', head: true }),
		supabase
			.from('services')
			.select('id', { count: 'exact', head: true })
			.eq('is_active', true),
		supabase
			.from('creators')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'pending_review'),
		supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', sevenDaysAgo),
		supabase
			.from('creators')
			.select(
				'id, display_name, status, created_at, profile_id, profiles(email)',
			)
			.eq('status', 'pending_review')
			.order('created_at', { ascending: true })
			.limit(5),
	])

	const pendingCreators = (pendingCreatorsRes.data ?? []).map((creator) => ({
		id: creator.id,
		profileId: creator.profile_id,
		displayName: creator.display_name,
		email: (creator.profiles as unknown as { email: string })?.email ?? '',
		createdAt: creator.created_at,
	}))

	return {
		totalUsers: profilesRes.count ?? 0,
		totalCreators: creatorsRes.count ?? 0,
		totalBusinesses: businessesRes.count ?? 0,
		totalServices: servicesRes.count ?? 0,
		activeServices: activeServicesRes.count ?? 0,
		pendingReview: pendingRes.count ?? 0,
		newLast7Days: recentUsersRes.count ?? 0,
		pendingCreators,
	}
}

export default async function AdminPage() {
	const t = await getTranslations('admin')
	const stats = await getAdminStats()

	const statCards = [
		{
			label: t('totalUsers'),
			value: stats.totalUsers,
			sub: t('newLast7Days') + `: ${stats.newLast7Days}`,
		},
		{
			label: t('totalCreators'),
			value: stats.totalCreators,
			sub: t('pendingReview') + `: ${stats.pendingReview}`,
			highlight: stats.pendingReview > 0,
		},
		{
			label: t('totalBusinesses'),
			value: stats.totalBusinesses,
		},
		{
			label: t('totalServices'),
			value: stats.totalServices,
			sub: t('activeServices') + `: ${stats.activeServices}`,
		},
	]

	return (
		<div className="mx-auto max-w-5xl">
			<p className="font-sans text-base leading-[1.7] text-muted-foreground">
				{t('welcomeAdmin')}
			</p>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{statCards.map((card) => (
					<Card key={card.label}>
						<CardContent>
							<p className="font-sans text-sm text-muted-foreground">
								{card.label}
							</p>
							<p className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-foreground">
								{card.value}
							</p>
							{card.sub && (
								<p className="mt-1 font-sans text-xs text-muted-foreground">
									{card.highlight ? (
										<span className="text-brand">{card.sub}</span>
									) : (
										card.sub
									)}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<div className="mt-10">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
							{t('reviewQueueTitle')}
						</h2>
						<p className="mt-1 font-sans text-sm text-muted-foreground">
							{t('reviewQueueDescription')}
						</p>
					</div>
					{stats.pendingReview > 0 && (
						<Button variant="ghost" size="sm" asChild>
							<Link href="/admin/creators">{t('viewAll')}</Link>
						</Button>
					)}
				</div>

				{stats.pendingCreators.length === 0 ? (
					<Card className="mt-4">
						<CardContent className="py-8 text-center">
							<p className="font-sans text-sm text-muted-foreground">
								{t('reviewQueueEmpty')}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="mt-4 space-y-2">
						{stats.pendingCreators.map((creator) => (
							<Card key={creator.id}>
								<CardContent className="flex items-center justify-between py-3">
									<div className="min-w-0 flex-1">
										<p className="truncate font-sans text-sm font-medium text-foreground">
											{creator.displayName}
										</p>
										<p className="truncate font-sans text-xs text-muted-foreground">
											{creator.email}
										</p>
									</div>
									<div className="flex items-center gap-3">
										<Badge variant="secondary">
											{t('statusPendingReview')}
										</Badge>
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/admin/users/${creator.profileId}`}>
												{t('reviewCreator')}
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
