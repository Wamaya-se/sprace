import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getBookings } from '@/lib/queries/bookings'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('bookingsTitle'),
	}
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
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

interface BookingsPageProps {
	searchParams: Promise<{ status?: string }>
}

export default async function BookingsPage({
	searchParams,
}: BookingsPageProps) {
	const params = await searchParams
	const t = await getTranslations('bookings')
	const td = await getTranslations('dashboard')

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	const role = (user?.app_metadata?.role as string) ?? 'creator'

	const statusFilter = params.status || 'all'
	const bookings = await getBookings(statusFilter)

	const statuses = [
		'all',
		'pending',
		'awaiting_payment',
		'accepted',
		'in_progress',
		'delivered',
		'completed',
		'disputed',
		'declined',
		'cancelled',
	]

	return (
		<div className="mx-auto max-w-6xl">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
					{td('bookingsDescription')}
				</p>
				{role === 'business' && (
					<Button asChild size="sm">
						<Link href="/dashboard/discover">{t('browseCreators')}</Link>
					</Button>
				)}
			</div>

			{/* Status filter */}
			<div className="mt-6 flex flex-wrap gap-2">
				{statuses.map((s) => (
					<Link
						key={s}
						href={
							s === 'all'
								? '/dashboard/bookings'
								: `/dashboard/bookings?status=${s}`
						}
					>
						<Badge variant={statusFilter === s ? 'chipActive' : 'chip'}>
							{s === 'all'
								? t('allStatuses')
								: t(
										`status${s.charAt(0).toUpperCase() + s.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as never,
									)}
						</Badge>
					</Link>
				))}
			</div>

			{bookings.length > 0 ? (
				<div className="mt-6 flex flex-col gap-3">
					{bookings.map((booking) => {
						const counterpart =
							role === 'business' ? booking.creator : booking.business
						const counterpartName =
							role === 'business'
								? (counterpart as { display_name: string } | null)?.display_name
								: (counterpart as { company_name: string } | null)?.company_name

						return (
							<Link key={booking.id} href={`/dashboard/bookings/${booking.id}`}>
								<Card className="duration-150 hover:bg-surface-container-high">
									<CardContent className="flex items-center justify-between gap-4 py-4">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-3">
												<h2 className="truncate font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
													{booking.title}
												</h2>
												<Badge
													variant={statusVariants[booking.status] ?? 'outline'}
												>
													{t(
														`status${booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as never,
													)}
												</Badge>
											</div>
											<p className="mt-1 font-sans text-sm text-muted-foreground">
												{role === 'business'
													? t('sentTo', { name: counterpartName ?? '' })
													: t('sentBy', { name: counterpartName ?? '' })}
												{' · '}
												{t('createdAt', {
													date: new Date(booking.created_at).toLocaleDateString(
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
										{booking.budget && (
											<span className="shrink-0 font-sans text-sm font-medium text-foreground/60">
												{t('budgetLabel', {
													amount: booking.budget.toLocaleString(),
												})}
											</span>
										)}
									</CardContent>
								</Card>
							</Link>
						)
					})}
				</div>
			) : (
				<div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-surface-container py-20 text-center">
					<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
						{t('empty')}
					</h2>
					<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
						{statusFilter !== 'all'
							? t('noResultsFilter')
							: role === 'business'
								? t('emptyBusinessDescription')
								: t('emptyCreatorDescription')}
					</p>
					{role === 'business' && statusFilter === 'all' && (
						<Button asChild className="mt-6">
							<Link href="/dashboard/discover">{t('browseCreators')}</Link>
						</Button>
					)}
				</div>
			)}
		</div>
	)
}
