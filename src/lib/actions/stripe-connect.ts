'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import type { ActionResult } from '@/types/actions'

export async function createStripeConnectAccount(): Promise<
	ActionResult<{ url: string }>
> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	if (user.app_metadata?.role !== 'creator') {
		return { success: false, error: 'errors.onlyCreatorCanStripe' }
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('id, stripe_account_id, stripe_onboarding_complete, display_name')
		.eq('profile_id', user.id)
		.single()

	if (!creator) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	if (creator.stripe_onboarding_complete) {
		return { success: false, error: 'errors.stripeAlreadyConnected' }
	}

	let accountId = creator.stripe_account_id

	if (!accountId) {
		const account = await getStripe().accounts.create({
			type: 'express',
			country: 'SE',
			email: user.email,
			capabilities: {
				card_payments: { requested: true },
				transfers: { requested: true },
			},
			business_profile: {
				name: creator.display_name,
				product_description: 'Creator services on Sprace marketplace',
			},
		})

		accountId = account.id

		const { error: updateError } = await supabase
			.from('creators')
			.update({ stripe_account_id: accountId })
			.eq('id', creator.id)

		if (updateError) {
			console.error('[createStripeConnectAccount]', updateError)
			return { success: false, error: 'errors.couldNotSaveStripeAccount' }
		}
	}

	const accountLink = await getStripe().accountLinks.create({
		account: accountId,
		refresh_url: `${env.siteUrl}/dashboard/settings?stripe=refresh`,
		return_url: `${env.siteUrl}/api/stripe/connect-return?account=${accountId}`,
		type: 'account_onboarding',
	})

	return { success: true, data: { url: accountLink.url } }
}

export async function getStripeOnboardingLink(): Promise<
	ActionResult<{ url: string }>
> {
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const { data: creator } = await supabase
		.from('creators')
		.select('stripe_account_id, stripe_onboarding_complete')
		.eq('profile_id', user.id)
		.single()

	if (!creator?.stripe_account_id) {
		return { success: false, error: 'errors.noStripeAccount' }
	}

	if (creator.stripe_onboarding_complete) {
		return { success: false, error: 'errors.stripeAlreadyConnected' }
	}

	const accountLink = await getStripe().accountLinks.create({
		account: creator.stripe_account_id,
		refresh_url: `${env.siteUrl}/dashboard/settings?stripe=refresh`,
		return_url: `${env.siteUrl}/api/stripe/connect-return?account=${creator.stripe_account_id}`,
		type: 'account_onboarding',
	})

	return { success: true, data: { url: accountLink.url } }
}
