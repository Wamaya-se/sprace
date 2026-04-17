import 'server-only'

import { renderToBuffer } from '@react-pdf/renderer'
import { createServiceClient } from '@/lib/supabase/service'
import {
	BusinessReceipt,
	type BusinessReceiptData,
} from '@/components/pdf/business-receipt'
import {
	CreatorPayoutStatement,
	type CreatorPayoutStatementData,
} from '@/components/pdf/creator-payout-statement'

interface GeneratedPdf {
	buffer: Buffer
	filename: string
	number: string
}

async function fetchPaymentWithRelations(paymentId: string) {
	const supabase = createServiceClient()
	const { data, error } = await supabase
		.from('payments')
		.select(
			`
			id,
			booking_id,
			amount_total,
			platform_fee,
			creator_payout,
			currency,
			status,
			stripe_payment_intent_id,
			stripe_transfer_id,
			captured_at,
			transferred_at,
			receipt_number,
			payout_statement_number,
			booking:bookings!payments_booking_id_fkey(
				id,
				title,
				business:businesses!bookings_business_id_fkey(
					company_name,
					org_number,
					contact_email,
					profile:profiles!businesses_profile_id_fkey(email)
				),
				creator:creators!bookings_creator_id_fkey(
					display_name,
					profile:profiles!creators_profile_id_fkey(email)
				)
			)
		`,
		)
		.eq('id', paymentId)
		.single()

	if (error || !data) {
		throw new Error(`[pdf/receipts] payment ${paymentId} not found`)
	}

	const booking = data.booking as unknown as {
		id: string
		title: string
		business: {
			company_name: string
			org_number: string | null
			contact_email: string | null
			profile: { email: string } | null
		}
		creator: {
			display_name: string
			profile: { email: string } | null
		}
	} | null

	if (!booking) {
		throw new Error(`[pdf/receipts] booking for payment ${paymentId} missing`)
	}

	return { payment: data, booking }
}

export async function generateBusinessReceipt(
	paymentId: string,
): Promise<GeneratedPdf> {
	const { payment, booking } = await fetchPaymentWithRelations(paymentId)
	const supabase = createServiceClient()

	const { data: numberData, error: numberError } = await supabase.rpc(
		'assign_receipt_number',
		{ p_payment_id: payment.id },
	)
	if (numberError || !numberData) {
		throw new Error(
			`[pdf/receipts] failed to assign receipt number: ${
				numberError?.message ?? 'unknown'
			}`,
		)
	}
	const receiptNumber = numberData

	const data: BusinessReceiptData = {
		receiptNumber,
		issuedAt: new Date(),
		currency: payment.currency,
		amountTotal: payment.amount_total,
		platformFee: payment.platform_fee,
		booking: { id: booking.id, title: booking.title },
		business: {
			companyName: booking.business.company_name,
			orgNumber: booking.business.org_number,
			contactEmail: booking.business.contact_email,
			profileEmail: booking.business.profile?.email ?? '',
		},
		creator: { displayName: booking.creator.display_name },
		payment: {
			stripeChargeId: payment.stripe_payment_intent_id,
			capturedAt: payment.captured_at ? new Date(payment.captured_at) : null,
		},
	}

	const buffer = await renderToBuffer(<BusinessReceipt data={data} />)
	return {
		buffer,
		filename: `Sprace-Receipt-${receiptNumber}.pdf`,
		number: receiptNumber,
	}
}

export async function generateCreatorPayoutStatement(
	paymentId: string,
): Promise<GeneratedPdf> {
	const { payment, booking } = await fetchPaymentWithRelations(paymentId)
	const supabase = createServiceClient()

	const { data: numberData, error: numberError } = await supabase.rpc(
		'assign_payout_statement_number',
		{ p_payment_id: payment.id },
	)
	if (numberError || !numberData) {
		throw new Error(
			`[pdf/receipts] failed to assign payout statement number: ${
				numberError?.message ?? 'unknown'
			}`,
		)
	}
	const statementNumber = numberData

	const data: CreatorPayoutStatementData = {
		statementNumber,
		issuedAt: new Date(),
		currency: payment.currency,
		amountTotal: payment.amount_total,
		platformFee: payment.platform_fee,
		creatorPayout: payment.creator_payout,
		booking: { id: booking.id, title: booking.title },
		business: { companyName: booking.business.company_name },
		creator: {
			displayName: booking.creator.display_name,
			profileEmail: booking.creator.profile?.email ?? '',
		},
		payment: {
			stripeTransferId: payment.stripe_transfer_id,
			transferredAt: payment.transferred_at
				? new Date(payment.transferred_at)
				: null,
		},
	}

	const buffer = await renderToBuffer(<CreatorPayoutStatement data={data} />)
	return {
		buffer,
		filename: `Sprace-Payout-Statement-${statementNumber}.pdf`,
		number: statementNumber,
	}
}
