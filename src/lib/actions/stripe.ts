'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import type { ActionResult } from '@/types/actions'
import * as paymentsQuery from '@/lib/queries/payments'
import * as stripeQuery from '@/lib/queries/stripe'

export {
	createStripeConnectAccount,
	getStripeOnboardingLink,
} from '@/lib/actions/stripe-connect'

export async function getStripeAccountStatus() {
	return stripeQuery.getStripeAccountStatus()
}

export async function getPaymentForBooking(bookingId: string) {
	return paymentsQuery.getPaymentForBooking(bookingId)
}

const checkoutBookingIdSchema = z.string().uuid()

export async function createCheckoutSession(
	bookingId: string,
): Promise<ActionResult<{ url: string }>> {
	const parsed = checkoutBookingIdSchema.safeParse(bookingId)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidBookingId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	if (user.app_metadata?.role !== 'business') {
		return { success: false, error: 'errors.onlyBusinessCanPay' }
	}

	const { data: booking } = await supabase
		.from('bookings')
		.select(
			`
			id, status, title, budget, service_id,
			business:businesses!bookings_business_id_fkey(id, profile_id, company_name),
			creator:creators!bookings_creator_id_fkey(id, profile_id, stripe_account_id, stripe_onboarding_complete),
			service:services!bookings_service_id_fkey(id, name, price)
		`,
		)
		.eq('id', parsed.data)
		.single()

	if (!booking) {
		return { success: false, error: 'errors.bookingNotFound' }
	}

	const biz = booking.business as unknown as {
		id: string
		profile_id: string
		company_name: string
	}
	const creator = booking.creator as unknown as {
		id: string
		profile_id: string
		stripe_account_id: string | null
		stripe_onboarding_complete: boolean
	}
	const service = booking.service as unknown as {
		id: string
		name: string
		price: number
	} | null

	if (biz.profile_id !== user.id) {
		return { success: false, error: 'errors.notYourBooking' }
	}

	if (booking.status !== 'awaiting_payment') {
		return { success: false, error: 'errors.bookingNotAwaitingPayment' }
	}

	if (!creator.stripe_account_id || !creator.stripe_onboarding_complete) {
		return { success: false, error: 'errors.creatorNoPaymentAccount' }
	}

	const amountSek = booking.budget ?? service?.price
	if (!amountSek || amountSek <= 0) {
		return { success: false, error: 'errors.noAmountSet' }
	}

	const amountCents = Math.round(amountSek * 100)
	const { getPlatformFeePercent, calculateFees } = await import('@/lib/stripe')
	const feePercent = await getPlatformFeePercent()
	const fees = calculateFees(amountCents, feePercent)

	const { data: existingPayment } = await supabase
		.from('payments')
		.select('id, stripe_checkout_session_id')
		.eq('booking_id', parsed.data)
		.single()

	if (existingPayment?.stripe_checkout_session_id) {
		const existingSession = await getStripe().checkout.sessions.retrieve(
			existingPayment.stripe_checkout_session_id,
		)
		if (existingSession.status === 'open' && existingSession.url) {
			return { success: true, data: { url: existingSession.url } }
		}
	}

	const session = await getStripe().checkout.sessions.create({
		mode: 'payment',
		customer_email: user.email!,
		line_items: [
			{
				price_data: {
					currency: 'sek',
					product_data: {
						name: booking.title,
						description: service?.name ?? undefined,
					},
					unit_amount: amountCents,
				},
				quantity: 1,
			},
		],
		payment_intent_data: {
			transfer_group: `booking_${parsed.data}`,
			metadata: {
				booking_id: parsed.data,
				creator_stripe_account: creator.stripe_account_id,
			},
		},
		metadata: {
			booking_id: parsed.data,
		},
		success_url: `${env.siteUrl}/dashboard/bookings/${parsed.data}?payment=success`,
		cancel_url: `${env.siteUrl}/dashboard/bookings/${parsed.data}?payment=cancelled`,
	})

	// payments has RLS SELECT-only for participants. Writes happen here,
	// authorised by the ownership check above (biz.profile_id === user.id),
	// so we use the service-role client to bypass RLS safely.
	const serviceClient = createServiceClient()
	if (existingPayment) {
		await serviceClient
			.from('payments')
			.update({
				stripe_checkout_session_id: session.id,
				amount_total: fees.amountTotal,
				platform_fee: fees.platformFee,
				creator_payout: fees.creatorPayout,
			})
			.eq('id', existingPayment.id)
	} else {
		await serviceClient.from('payments').insert({
			booking_id: parsed.data,
			stripe_checkout_session_id: session.id,
			amount_total: fees.amountTotal,
			platform_fee: fees.platformFee,
			creator_payout: fees.creatorPayout,
		})
	}

	if (!session.url) {
		return { success: false, error: 'errors.couldNotCreateCheckout' }
	}

	return { success: true, data: { url: session.url } }
}

export async function processPayoutForBooking(
	bookingId: string,
): Promise<ActionResult> {
	const parsed = checkoutBookingIdSchema.safeParse(bookingId)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidBookingId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const { data: payment } = await supabase
		.from('payments')
		.select(
			`
			id, status, creator_payout, stripe_payment_intent_id, currency,
			booking:bookings!payments_booking_id_fkey(
				id, title, creator:creators!bookings_creator_id_fkey(stripe_account_id, profile_id)
			)
		`,
		)
		.eq('booking_id', parsed.data)
		.single()

	if (!payment) {
		return { success: false, error: 'errors.paymentNotFound' }
	}

	if (payment.status !== 'captured') {
		return { success: false, error: 'errors.paymentNotCaptured' }
	}

	const booking = payment.booking as unknown as {
		id: string
		title: string
		creator: { stripe_account_id: string | null; profile_id: string }
	}

	const isAdmin = user.app_metadata?.role === 'admin'
	if (!isAdmin && booking?.creator?.profile_id !== user.id) {
		return { success: false, error: 'errors.forbidden' }
	}

	if (!booking?.creator?.stripe_account_id) {
		return { success: false, error: 'errors.creatorStripeNotFound' }
	}

	try {
		const transfer = await getStripe().transfers.create({
			amount: payment.creator_payout,
			currency: payment.currency,
			destination: booking.creator.stripe_account_id,
			transfer_group: `booking_${parsed.data}`,
			metadata: { booking_id: parsed.data, payment_id: payment.id },
		})

		await createServiceClient()
			.from('payments')
			.update({
				status: 'transferred',
				stripe_transfer_id: transfer.id,
				transferred_at: new Date().toISOString(),
			})
			.eq('id', payment.id)

		const { getTranslations } = await import('next-intl/server')
		const nt = await getTranslations('notifications')
		const { createNotification } = await import('@/lib/notifications')
		const payoutAmount = (payment.creator_payout / 100).toLocaleString()
		await createNotification({
			userId: booking.creator.profile_id,
			type: 'payout_sent',
			title: nt('payoutSent'),
			body: nt('payoutSentBody', {
				amount: payoutAmount,
				title: booking.title,
			}),
			link: `/dashboard/bookings/${parsed.data}`,
		}).catch((err) =>
			console.error('[processPayoutForBooking] notification failed', err),
		)

		revalidatePath(`/dashboard/bookings/${parsed.data}`)
		return { success: true, data: undefined }
	} catch (err) {
		console.error('[processPayoutForBooking]', err)
		return { success: false, error: 'errors.transferFailed' }
	}
}

export async function refundPayment(bookingId: string): Promise<ActionResult> {
	const parsed = checkoutBookingIdSchema.safeParse(bookingId)
	if (!parsed.success) {
		return { success: false, error: 'errors.invalidBookingId' }
	}

	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	const { data: payment } = await supabase
		.from('payments')
		.select(
			`
			id, status, stripe_payment_intent_id,
			booking:bookings!payments_booking_id_fkey(
				business:businesses!bookings_business_id_fkey(profile_id)
			)
		`,
		)
		.eq('booking_id', parsed.data)
		.single()

	if (!payment) {
		return { success: false, error: 'errors.paymentNotFound' }
	}

	if (payment.status !== 'captured') {
		return { success: false, error: 'errors.paymentCannotBeRefunded' }
	}

	if (!payment.stripe_payment_intent_id) {
		return { success: false, error: 'errors.noPaymentIntent' }
	}

	const refundBooking = payment.booking as unknown as {
		business: { profile_id: string } | null
	} | null

	const isAdmin = user.app_metadata?.role === 'admin'
	if (!isAdmin && refundBooking?.business?.profile_id !== user.id) {
		return { success: false, error: 'errors.forbidden' }
	}

	try {
		await getStripe().refunds.create({
			payment_intent: payment.stripe_payment_intent_id,
			metadata: { booking_id: parsed.data, payment_id: payment.id },
		})

		await createServiceClient()
			.from('payments')
			.update({
				status: 'refunded',
				refunded_at: new Date().toISOString(),
			})
			.eq('id', payment.id)

		revalidatePath(`/dashboard/bookings/${parsed.data}`)
		return { success: true, data: undefined }
	} catch (err) {
		console.error('[refundPayment]', err)
		return { success: false, error: 'errors.refundFailed' }
	}
}
