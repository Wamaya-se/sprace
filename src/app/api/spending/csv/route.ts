import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessSpending } from '@/lib/queries/earnings'
import { formatMinorAmount, toCsv } from '@/lib/csv'

export async function GET() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	if (user.app_metadata?.role !== 'business') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const payload = await getBusinessSpending()
	const rows = payload?.rows ?? []

	const csv = toCsv(
		[
			'receipt_number',
			'captured_at',
			'booking_id',
			'booking_title',
			'creator',
			'amount',
			'status',
			'currency',
		],
		rows.map((r) => [
			r.receiptNumber ?? '',
			r.capturedAt ?? '',
			r.bookingId,
			r.bookingTitle,
			r.counterparty,
			formatMinorAmount(r.amountMinor),
			r.status,
			r.currency.toUpperCase(),
		]),
	)

	const today = new Date().toISOString().slice(0, 10)
	return new NextResponse(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="sprace-spending-${today}.csv"`,
			'Cache-Control': 'private, no-store',
		},
	})
}
