import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StripeConnectBanner } from '@/components/dashboard/stripe-connect-banner'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('dashboardTitle'),
	}
}

export default async function DashboardPage() {
	const t = await getTranslations('dashboard')
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/login')
	}

	const role = (user.app_metadata?.role as string) ?? 'creator'
	const isCreator = role === 'creator'

	let showOnboardingCta = false
	let showStripeCta = false
	let hasStripeAccount = false
	if (isCreator) {
		const { data: creator } = await supabase
			.from('creators')
			.select('status, bio, stripe_account_id, stripe_onboarding_complete')
			.eq('profile_id', user.id)
			.single()

		showOnboardingCta = creator?.status === 'draft' && !creator?.bio
		showStripeCta =
			!!creator &&
			creator.status === 'active' &&
			!creator.stripe_onboarding_complete
		hasStripeAccount = !!creator?.stripe_account_id
	} else {
		const { data: business } = await supabase
			.from('businesses')
			.select('website, contact_email, industry')
			.eq('profile_id', user.id)
			.single()

		showOnboardingCta =
			!!business &&
			!business.website &&
			!business.contact_email &&
			!business.industry
	}

	return (
		<div className="mx-auto max-w-4xl">
			<p className="font-sans text-base leading-[1.7] text-muted-foreground">
				{t('welcomeBack', { email: user?.email || '' })}
			</p>

			{showStripeCta && (
				<div className="mt-6">
					<StripeConnectBanner hasAccount={hasStripeAccount} />
				</div>
			)}

			{showOnboardingCta && (
				<Card className="mt-6 bg-gradient-to-r from-brand/10 to-brand-container/10">
					<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
								{isCreator
									? t('completeProfileTitle')
									: t('completeCompanyTitle')}
							</h2>
							<p className="mt-1 font-sans text-sm leading-[1.7] text-muted-foreground">
								{isCreator
									? t('completeProfileDescription')
									: t('completeCompanyDescription')}
							</p>
						</div>
						<Button variant="brand" asChild className="shrink-0">
							<Link href="/dashboard/profile">
								{isCreator ? t('completeProfileCta') : t('completeCompanyCta')}
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardContent>
						<p className="font-sans text-sm text-muted-foreground">
							{t('profileViews')}
						</p>
						<p className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-foreground">
							—
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<p className="font-sans text-sm text-muted-foreground">
							{t('activeServices')}
						</p>
						<p className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-foreground">
							—
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<p className="font-sans text-sm text-muted-foreground">
							{t('inquiries')}
						</p>
						<p className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-foreground">
							—
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
