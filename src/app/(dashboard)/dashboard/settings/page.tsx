import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { StripeSettingsSection } from '@/components/dashboard/stripe-settings-section'
import { EmailNotificationToggle } from '@/components/dashboard/email-notification-toggle'
import { DataExportSection } from '@/components/dashboard/data-export-section'
import { DeleteAccountSection } from '@/components/dashboard/delete-account-section'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('settingsTitle'),
	}
}

export default async function SettingsPage() {
	const t = await getTranslations('settings')
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) redirect('/login')

	const role = (user.app_metadata?.role as string) ?? 'creator'
	const isCreator = role === 'creator'

	const { data: profile } = await supabase
		.from('profiles')
		.select('email_notifications')
		.eq('id', user.id)
		.single()

	let stripeData: {
		hasAccount: boolean
		isComplete: boolean
		accountId: string | null
	} | null = null

	if (isCreator) {
		const { data: creator } = await supabase
			.from('creators')
			.select('stripe_account_id, stripe_onboarding_complete')
			.eq('profile_id', user.id)
			.single()

		stripeData = {
			hasAccount: !!creator?.stripe_account_id,
			isComplete: creator?.stripe_onboarding_complete ?? false,
			accountId: creator?.stripe_account_id ?? null,
		}
	}

	let recentPayouts: Array<{
		id: string
		creator_payout: number
		currency: string
		status: string
		transferred_at: string | null
		booking_title: string
	}> = []

	if (isCreator && stripeData?.isComplete) {
		const { data: payments } = await supabase
			.from('payments')
			.select(
				`
				id, creator_payout, currency, status, transferred_at,
				booking:bookings!payments_booking_id_fkey(title)
			`,
			)
			.in('status', ['transferred', 'captured'])
			.order('created_at', { ascending: false })
			.limit(10)

		recentPayouts = (payments ?? []).map((p) => ({
			id: p.id,
			creator_payout: p.creator_payout,
			currency: p.currency,
			status: p.status,
			transferred_at: p.transferred_at,
			booking_title:
				(p.booking as unknown as { title: string } | null)?.title ?? '',
		}))
	}

	return (
		<div className="mx-auto max-w-2xl">
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('description')}
			</p>

			{/* Notification preferences */}
			<section className="mt-8">
				<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
					{t('notificationPreferences')}
				</h2>
				<Card className="mt-4">
					<CardContent className="py-4">
						<EmailNotificationToggle
							initialValue={profile?.email_notifications ?? true}
						/>
					</CardContent>
				</Card>
			</section>

			{/* Stripe section (creators only) */}
			{isCreator && stripeData && (
				<>
					<Separator className="my-8" />
					<section>
						<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
							{t('paymentAccount')}
						</h2>
						<Card className="mt-4">
							<CardContent className="py-4">
								<StripeSettingsSection
									hasAccount={stripeData.hasAccount}
									isComplete={stripeData.isComplete}
								/>
							</CardContent>
						</Card>

						{/* Payout history */}
						{recentPayouts.length > 0 && (
							<div className="mt-6">
								<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
									{t('recentPayouts')}
								</h3>
								<div className="mt-3 space-y-2">
									{recentPayouts.map((payout) => (
										<Card key={payout.id}>
											<CardContent className="flex items-center justify-between py-3">
												<div className="min-w-0 flex-1">
													<p className="truncate font-sans text-sm text-foreground">
														{payout.booking_title}
													</p>
													{payout.transferred_at && (
														<p className="mt-0.5 font-sans text-xs text-muted-foreground">
															{new Date(
																payout.transferred_at,
															).toLocaleDateString(undefined, {
																month: 'short',
																day: 'numeric',
																year: 'numeric',
															})}
														</p>
													)}
												</div>
												<div className="flex items-center gap-3">
													<Badge
														variant={
															payout.status === 'transferred'
																? 'secondary'
																: 'outline'
														}
													>
														{t(
															payout.status === 'transferred'
																? 'payoutComplete'
																: 'payoutPending',
														)}
													</Badge>
													<span className="shrink-0 font-sans text-sm font-medium text-foreground">
														{t('payoutAmount', {
															amount: (
																payout.creator_payout / 100
															).toLocaleString(),
														})}
													</span>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						)}
					</section>
				</>
			)}
			{/* Data & Privacy */}
			<Separator className="my-8" />
			<section>
				<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
					{t('dataPrivacy')}
				</h2>

				<Card className="mt-4">
					<CardContent className="py-4">
						<h3 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
							{t('exportDataTitle')}
						</h3>
						<div className="mt-2">
							<DataExportSection />
						</div>
					</CardContent>
				</Card>

				<Card className="mt-4 border-destructive/10">
					<CardContent className="py-4">
						<h3 className="font-heading text-sm font-semibold tracking-[-0.03em] text-destructive">
							{t('dangerZone')}
						</h3>
						<p className="mt-1 font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('deleteAccountWarning')}
						</p>
						<div className="mt-3">
							<DeleteAccountSection />
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
