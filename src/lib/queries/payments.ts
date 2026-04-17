import 'server-only'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bookingIdSchema = z.string().uuid()

export async function getPaymentForBooking(bookingId: string) {
	const parsed = bookingIdSchema.safeParse(bookingId)
	if (!parsed.success) return null

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return null

	const { data } = await supabase
		.from('payments')
		.select(
			'id, amount_total, platform_fee, creator_payout, currency, status, captured_at, transferred_at, refunded_at, receipt_number, payout_statement_number',
		)
		.eq('booking_id', parsed.data)
		.single()

	return data
}
