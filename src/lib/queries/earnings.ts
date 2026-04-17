import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface PeriodAggregate {
	period: string // e.g. "2026-Q1" or "2026"
	label: string
	totalMinor: number
	currency: string
	bookingCount: number
}

export interface PaymentRow {
	id: string
	receiptNumber: string | null
	payoutStatementNumber: string | null
	amountMinor: number
	platformFeeMinor: number
	creatorPayoutMinor: number
	currency: string
	status: string
	capturedAt: string | null
	transferredAt: string | null
	bookingId: string
	bookingTitle: string
	counterparty: string
}

interface EarningsPayload {
	quarterly: PeriodAggregate[]
	yearly: PeriodAggregate[]
	rows: PaymentRow[]
}

function quarterLabel(date: Date) {
	const q = Math.floor(date.getUTCMonth() / 3) + 1
	return `${date.getUTCFullYear()}-Q${q}`
}

function yearLabel(date: Date) {
	return String(date.getUTCFullYear())
}

/**
 * Aggregate completed (transferred) payouts for the current creator,
 * grouped by quarter and year. Returns raw rows for CSV export.
 */
export async function getCreatorEarnings(): Promise<EarningsPayload | null> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return null

	const { data } = await supabase
		.from('payments')
		.select(
			`
			id,
			receipt_number,
			payout_statement_number,
			amount_total,
			platform_fee,
			creator_payout,
			currency,
			status,
			captured_at,
			transferred_at,
			booking:bookings!payments_booking_id_fkey(
				id,
				title,
				creator:creators!bookings_creator_id_fkey(profile_id),
				business:businesses!bookings_business_id_fkey(company_name)
			)
		`,
		)
		.eq('status', 'transferred')
		.order('transferred_at', { ascending: false })

	const rows: PaymentRow[] =
		data
			?.filter((p) => {
				const b = p.booking as unknown as {
					creator?: { profile_id: string }
				} | null
				return b?.creator?.profile_id === user.id
			})
			.map((p) => {
				const b = p.booking as unknown as {
					id: string
					title: string
					business: { company_name: string } | null
				}
				return {
					id: p.id,
					receiptNumber: p.receipt_number,
					payoutStatementNumber: p.payout_statement_number,
					amountMinor: p.amount_total,
					platformFeeMinor: p.platform_fee,
					creatorPayoutMinor: p.creator_payout,
					currency: p.currency,
					status: p.status,
					capturedAt: p.captured_at,
					transferredAt: p.transferred_at,
					bookingId: b.id,
					bookingTitle: b.title,
					counterparty: b.business?.company_name ?? '—',
				}
			}) ?? []

	const quarterly = new Map<string, PeriodAggregate>()
	const yearly = new Map<string, PeriodAggregate>()
	for (const row of rows) {
		if (!row.transferredAt) continue
		const date = new Date(row.transferredAt)
		const qKey = quarterLabel(date)
		const yKey = yearLabel(date)
		const q = quarterly.get(qKey) ?? {
			period: qKey,
			label: qKey,
			totalMinor: 0,
			currency: row.currency,
			bookingCount: 0,
		}
		q.totalMinor += row.creatorPayoutMinor
		q.bookingCount += 1
		quarterly.set(qKey, q)
		const y = yearly.get(yKey) ?? {
			period: yKey,
			label: yKey,
			totalMinor: 0,
			currency: row.currency,
			bookingCount: 0,
		}
		y.totalMinor += row.creatorPayoutMinor
		y.bookingCount += 1
		yearly.set(yKey, y)
	}

	return {
		quarterly: Array.from(quarterly.values()).sort((a, b) =>
			a.period < b.period ? 1 : -1,
		),
		yearly: Array.from(yearly.values()).sort((a, b) =>
			a.period < b.period ? 1 : -1,
		),
		rows,
	}
}

/**
 * Aggregate captured payments for the current business (buyer-side),
 * grouped by quarter and year.
 */
export async function getBusinessSpending(): Promise<EarningsPayload | null> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return null

	const { data } = await supabase
		.from('payments')
		.select(
			`
			id,
			receipt_number,
			payout_statement_number,
			amount_total,
			platform_fee,
			creator_payout,
			currency,
			status,
			captured_at,
			transferred_at,
			booking:bookings!payments_booking_id_fkey(
				id,
				title,
				creator:creators!bookings_creator_id_fkey(display_name),
				business:businesses!bookings_business_id_fkey(profile_id)
			)
		`,
		)
		.in('status', ['captured', 'transferred', 'refunded'])
		.order('captured_at', { ascending: false })

	const rows: PaymentRow[] =
		data
			?.filter((p) => {
				const b = p.booking as unknown as {
					business?: { profile_id: string }
				} | null
				return b?.business?.profile_id === user.id
			})
			.map((p) => {
				const b = p.booking as unknown as {
					id: string
					title: string
					creator: { display_name: string } | null
				}
				return {
					id: p.id,
					receiptNumber: p.receipt_number,
					payoutStatementNumber: p.payout_statement_number,
					amountMinor: p.amount_total,
					platformFeeMinor: p.platform_fee,
					creatorPayoutMinor: p.creator_payout,
					currency: p.currency,
					status: p.status,
					capturedAt: p.captured_at,
					transferredAt: p.transferred_at,
					bookingId: b.id,
					bookingTitle: b.title,
					counterparty: b.creator?.display_name ?? '—',
				}
			}) ?? []

	const quarterly = new Map<string, PeriodAggregate>()
	const yearly = new Map<string, PeriodAggregate>()
	for (const row of rows) {
		if (!row.capturedAt) continue
		// Refunded rows don't count toward spend.
		if (row.status === 'refunded') continue
		const date = new Date(row.capturedAt)
		const qKey = quarterLabel(date)
		const yKey = yearLabel(date)
		const q = quarterly.get(qKey) ?? {
			period: qKey,
			label: qKey,
			totalMinor: 0,
			currency: row.currency,
			bookingCount: 0,
		}
		q.totalMinor += row.amountMinor
		q.bookingCount += 1
		quarterly.set(qKey, q)
		const y = yearly.get(yKey) ?? {
			period: yKey,
			label: yKey,
			totalMinor: 0,
			currency: row.currency,
			bookingCount: 0,
		}
		y.totalMinor += row.amountMinor
		y.bookingCount += 1
		yearly.set(yKey, y)
	}

	return {
		quarterly: Array.from(quarterly.values()).sort((a, b) =>
			a.period < b.period ? 1 : -1,
		),
		yearly: Array.from(yearly.values()).sort((a, b) =>
			a.period < b.period ? 1 : -1,
		),
		rows,
	}
}
