import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function getStripeAccountStatus(): Promise<{
	hasAccount: boolean
	isComplete: boolean
	accountId: string | null
}> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return { hasAccount: false, isComplete: false, accountId: null }

	const { data: creator } = await supabase
		.from('creators')
		.select('stripe_account_id, stripe_onboarding_complete')
		.eq('profile_id', user.id)
		.single()

	return {
		hasAccount: !!creator?.stripe_account_id,
		isComplete: creator?.stripe_onboarding_complete ?? false,
		accountId: creator?.stripe_account_id ?? null,
	}
}
