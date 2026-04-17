import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatMinorAmount, toCsv } from '@/lib/csv'

export async function GET() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	if (user.app_metadata?.role !== 'admin') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	// Admins have full SELECT on payments via RLS — no service client needed.
	const { data: payments, error } = await supabase
		.from('payments')
		.select(
			`
			id,
			created_at,
			captured_at,
			transferred_at,
			refunded_at,
			status,
			amount_total,
			platform_fee,
			creator_payout,
			currency,
			receipt_number,
			payout_statement_number,
			stripe_checkout_session_id,
			stripe_payment_intent_id,
			stripe_transfer_id,
			booking:bookings!payments_booking_id_fkey(
				id,
				title,
				business:businesses!bookings_business_id_fkey(company_name, org_number),
				creator:creators!bookings_creator_id_fkey(display_name)
			)
		`,
		)
		.order('created_at', { ascending: false })

	if (error || !payments) {
		console.error('[api/admin/payments/csv]', error)
		return NextResponse.json({ error: 'Query failed' }, { status: 500 })
	}

	const csv = toCsv(
		[
			'payment_id',
			'created_at',
			'captured_at',
			'transferred_at',
			'refunded_at',
			'status',
			'amount',
			'platform_fee',
			'creator_payout',
			'currency',
			'receipt_number',
			'payout_statement_number',
			'booking_id',
			'booking_title',
			'business',
			'business_org_number',
			'creator',
			'stripe_checkout_session_id',
			'stripe_payment_intent_id',
			'stripe_transfer_id',
		],
		payments.map((p) => {
			const booking = p.booking as unknown as {
				id: string
				title: string
				business: { company_name: string; org_number: string | null } | null
				creator: { display_name: string } | null
			} | null
			return [
				p.id,
				p.created_at,
				p.captured_at ?? '',
				p.transferred_at ?? '',
				p.refunded_at ?? '',
				p.status,
				formatMinorAmount(p.amount_total),
				formatMinorAmount(p.platform_fee),
				formatMinorAmount(p.creator_payout),
				p.currency.toUpperCase(),
				p.receipt_number ?? '',
				p.payout_statement_number ?? '',
				booking?.id ?? '',
				booking?.title ?? '',
				booking?.business?.company_name ?? '',
				booking?.business?.org_number ?? '',
				booking?.creator?.display_name ?? '',
				p.stripe_checkout_session_id ?? '',
				p.stripe_payment_intent_id ?? '',
				p.stripe_transfer_id ?? '',
			]
		}),
	)

	const today = new Date().toISOString().slice(0, 10)
	return new NextResponse(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="sprace-payments-${today}.csv"`,
			'Cache-Control': 'private, no-store',
		},
	})
}
