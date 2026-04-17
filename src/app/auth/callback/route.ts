import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/auth/redirects'

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url)
	const code = searchParams.get('code')
	const explicitNext = getSafeRedirectPath(searchParams.get('next'))

	if (code) {
		const supabase = await createClient()
		const { error } = await supabase.auth.exchangeCodeForSession(code)

		if (!error) {
			if (explicitNext) {
				return NextResponse.redirect(`${origin}${explicitNext}`)
			}

			const {
				data: { user },
			} = await supabase.auth.getUser()
			const role = user?.app_metadata?.role as string | undefined
			const destination = role === 'admin' ? '/admin' : '/dashboard'
			return NextResponse.redirect(`${origin}${destination}`)
		}
	}

	return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
