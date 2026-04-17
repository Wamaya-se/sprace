import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function updateSession(request: NextRequest) {
	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local.',
		)
	}

	let supabaseResponse = NextResponse.next({ request })

	const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll()
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value }) =>
					request.cookies.set(name, value),
				)
				supabaseResponse = NextResponse.next({ request })
				cookiesToSet.forEach(({ name, value, options }) =>
					supabaseResponse.cookies.set(name, value, options),
				)
			},
		},
	})

	const {
		data: { user },
	} = await supabase.auth.getUser()

	const pathname = request.nextUrl.pathname
	const isProtected =
		pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
	const role = (user?.app_metadata?.role as string) ?? 'creator'

	if (!user && isProtected) {
		const url = request.nextUrl.clone()
		url.pathname = '/login'
		return NextResponse.redirect(url)
	}

	if (user && isProtected) {
		const emailConfirmed = Boolean(
			// email_confirmed_at is the canonical Supabase flag; fall back to
			// confirmed_at for older projects.
			user.email_confirmed_at || user.confirmed_at,
		)
		if (!emailConfirmed) {
			const url = request.nextUrl.clone()
			url.pathname = '/verify-email'
			return NextResponse.redirect(url)
		}

		if (pathname.startsWith('/admin') && role !== 'admin') {
			const url = request.nextUrl.clone()
			url.pathname = '/dashboard'
			return NextResponse.redirect(url)
		}

		if (pathname.startsWith('/dashboard') && role === 'admin') {
			const url = request.nextUrl.clone()
			url.pathname = '/admin'
			return NextResponse.redirect(url)
		}
	}

	if (user && (pathname === '/login' || pathname.startsWith('/register'))) {
		const url = request.nextUrl.clone()
		url.pathname = role === 'admin' ? '/admin' : '/dashboard'
		return NextResponse.redirect(url)
	}

	return supabaseResponse
}
