import { NextResponse, type NextRequest } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
	const accountId = request.nextUrl.searchParams.get('account')
	if (!accountId) {
		return NextResponse.redirect(`${env.siteUrl}/dashboard?stripe=error`)
	}

	try {
		const supabase = await createClient()
		const {
			data: { user },
		} = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.redirect(`${env.siteUrl}/login`)
		}

		const { data: creator } = await supabase
			.from('creators')
			.select('stripe_account_id')
			.eq('profile_id', user.id)
			.single()

		if (!creator || creator.stripe_account_id !== accountId) {
			return NextResponse.redirect(`${env.siteUrl}/dashboard?stripe=error`)
		}

		const account = await getStripe().accounts.retrieve(accountId)

		if (account.charges_enabled) {
			await supabase
				.from('creators')
				.update({ stripe_onboarding_complete: true })
				.eq('stripe_account_id', accountId)
		}

		return NextResponse.redirect(
			`${env.siteUrl}/dashboard?stripe=${account.charges_enabled ? 'success' : 'incomplete'}`,
		)
	} catch (err) {
		console.error('[stripe/connect-return]', err)
		return NextResponse.redirect(`${env.siteUrl}/dashboard?stripe=error`)
	}
}
