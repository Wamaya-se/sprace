import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreatorEarnings } from '@/lib/queries/earnings'
import { formatMinorAmount, toCsv } from '@/lib/csv'

export async function GET() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	if (user.app_metadata?.role !== 'creator') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const payload = await getCreatorEarnings()
	const rows = payload?.rows ?? []

	const csv = toCsv(
		[
			'payout_statement_number',
			'transferred_at',
			'booking_id',
			'booking_title',
			'business',
			'gross_amount',
			'platform_fee',
			'net_payout',
			'currency',
		],
		rows.map((r) => [
			r.payoutStatementNumber ?? '',
			r.transferredAt ?? '',
			r.bookingId,
			r.bookingTitle,
			r.counterparty,
			formatMinorAmount(r.amountMinor),
			formatMinorAmount(r.platformFeeMinor),
			formatMinorAmount(r.creatorPayoutMinor),
			r.currency.toUpperCase(),
		]),
	)

	const today = new Date().toISOString().slice(0, 10)
	return new NextResponse(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="sprace-earnings-${today}.csv"`,
			'Cache-Control': 'private, no-store',
		},
	})
}
