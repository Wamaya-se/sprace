import 'server-only'

import Stripe from 'stripe'
import { env } from '@/lib/env'

export { calculateFees } from '@/lib/fees'
export type { FeeBreakdown } from '@/lib/fees'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
	if (!_stripe) {
		_stripe = new Stripe(env.stripeSecretKey, {
			apiVersion: '2026-03-25.dahlia',
			typescript: true,
		})
	}
	return _stripe
}

export async function getPlatformFeePercent(): Promise<number> {
	const { createClient } = await import('@/lib/supabase/server')
	const supabase = await createClient()
	const { data } = await supabase
		.from('platform_settings')
		.select('value')
		.eq('key', 'platform_fee_percent')
		.single()

	const percent = parseFloat(data?.value ?? '15')
	return Number.isFinite(percent) && percent >= 0 && percent <= 100
		? percent
		: 15
}
