import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
	const body = await request.text()
	const signature = request.headers.get('stripe-signature')

	if (!signature) {
		return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
	}

	let event: Stripe.Event
	try {
		event = getStripe().webhooks.constructEvent(
			body,
			signature,
			env.stripeWebhookSecret,
		)
	} catch (err) {
		console.error('[stripe/webhook] signature verification failed', err)
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
	}

	const supabase = createAdminClient()

	// Check for duplicate delivery first (dedup without claiming the slot yet).
	const { data: existingEvent, error: lookupError } = await supabase
		.from('stripe_webhook_events')
		.select('event_id')
		.eq('event_id', event.id)
		.maybeSingle()

	if (lookupError) {
		console.error('[stripe/webhook] idempotency lookup failed', lookupError)
		return NextResponse.json(
			{ error: 'Idempotency lookup failed' },
			{ status: 500 },
		)
	}

	if (existingEvent) {
		return NextResponse.json({ received: true, duplicate: true })
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session
				const bookingId = session.metadata?.booking_id
				if (!bookingId) break

				const paymentIntentId =
					typeof session.payment_intent === 'string'
						? session.payment_intent
						: session.payment_intent?.id

				const { error: paymentUpdateError } = await supabase
					.from('payments')
					.update({
						status: 'captured',
						stripe_payment_intent_id: paymentIntentId ?? null,
						captured_at: new Date().toISOString(),
					})
					.eq('booking_id', bookingId)

				if (paymentUpdateError) {
					console.error(
						'[stripe/webhook] payment update failed',
						paymentUpdateError,
					)
					return NextResponse.json(
						{ error: 'Payment update failed' },
						{ status: 500 },
					)
				}

				const { error: bookingUpdateError } = await supabase
					.from('bookings')
					.update({ status: 'accepted' })
					.eq('id', bookingId)
					.eq('status', 'awaiting_payment')

				if (bookingUpdateError) {
					console.error(
						'[stripe/webhook] booking update failed',
						bookingUpdateError,
					)
					return NextResponse.json(
						{ error: 'Booking update failed' },
						{ status: 500 },
					)
				}

				const { data: booking } = await supabase
					.from('bookings')
					.select(
						`title,
					creator:creators!bookings_creator_id_fkey(profile_id, stripe_onboarding_complete),
					business:businesses!bookings_business_id_fkey(profile_id, contact_email, profile:profiles!businesses_profile_id_fkey(email))`,
					)
					.eq('id', bookingId)
					.single()

				if (booking) {
					const { getTranslations } = await import('next-intl/server')
					const nt = await getTranslations('notifications')
					const creator = booking.creator as unknown as {
						profile_id: string
						stripe_onboarding_complete: boolean
					} | null
					const business = booking.business as unknown as {
						profile_id: string
						contact_email: string | null
						profile: { email: string } | null
					} | null

					const notifications: Promise<void>[] = []

					if (creator) {
						notifications.push(
							createNotification({
								userId: creator.profile_id,
								type: 'payment_received',
								title: nt('paymentReceived'),
								body: nt('paymentReceivedBody', { title: booking.title }),
								link: `/dashboard/bookings/${bookingId}`,
							}),
							createNotification({
								userId: creator.profile_id,
								type: 'booking_accepted',
								title: nt('bookingAccepted'),
								body: nt('bookingAcceptedBody', { title: booking.title }),
								link: `/dashboard/bookings/${bookingId}`,
							}),
						)

						if (!creator.stripe_onboarding_complete) {
							notifications.push(
								createNotification({
									userId: creator.profile_id,
									type: 'stripe_onboarding_required',
									title: nt('stripeOnboardingRequired'),
									body: nt('stripeOnboardingRequiredBody', {
										title: booking.title,
									}),
									link: '/dashboard/settings',
								}),
							)
						}
					}

					if (business) {
						notifications.push(
							createNotification({
								userId: business.profile_id,
								type: 'booking_accepted',
								title: nt('bookingAccepted'),
								body: nt('bookingAcceptedBody', { title: booking.title }),
								link: `/dashboard/bookings/${bookingId}`,
							}),
						)
					}

					await Promise.all(notifications).catch((err) =>
						console.error('[webhook] payment notifications failed', err),
					)

					// Deliver PDF receipt to business. Non-fatal — if this fails the
					// booking still went through; the receipt can be regenerated
					// on-demand from the booking detail page.
					if (business) {
						const recipient = business.contact_email ?? business.profile?.email
						if (recipient) {
							const { data: paymentRow } = await supabase
								.from('payments')
								.select('id')
								.eq('booking_id', bookingId)
								.single()
							if (paymentRow?.id) {
								const { deliverBusinessReceipt } =
									await import('@/lib/pdf/delivery')
								await deliverBusinessReceipt({
									paymentId: paymentRow.id,
									to: recipient,
									subject: nt('receiptEmailSubject', {
										title: booking.title,
									}),
									bodyTitle: nt('receiptEmailTitle'),
									bodyText: nt('receiptEmailBody', { title: booking.title }),
									link: `/dashboard/bookings/${bookingId}`,
									ctaLabel: nt('viewBooking'),
								})
							}
						}
					}
				}

				break
			}

			case 'checkout.session.expired': {
				const session = event.data.object as Stripe.Checkout.Session
				const bookingId = session.metadata?.booking_id
				if (!bookingId) break

				const { error: paymentFailErr } = await supabase
					.from('payments')
					.update({ status: 'failed' })
					.eq('booking_id', bookingId)
					.eq('status', 'pending')

				if (paymentFailErr) {
					console.error(
						'[stripe/webhook] payment expire update failed',
						paymentFailErr,
					)
					return NextResponse.json(
						{ error: 'Payment expire update failed' },
						{ status: 500 },
					)
				}

				const { error: bookingRevertErr } = await supabase
					.from('bookings')
					.update({ status: 'pending' })
					.eq('id', bookingId)
					.eq('status', 'awaiting_payment')

				if (bookingRevertErr) {
					console.error(
						'[stripe/webhook] booking revert failed',
						bookingRevertErr,
					)
					return NextResponse.json(
						{ error: 'Booking revert failed' },
						{ status: 500 },
					)
				}

				const { data: expiredBooking } = await supabase
					.from('bookings')
					.select(
						`title, business:businesses!bookings_business_id_fkey(profile_id)`,
					)
					.eq('id', bookingId)
					.single()

				if (expiredBooking) {
					const biz = expiredBooking.business as unknown as {
						profile_id: string
					} | null
					if (biz) {
						const { getTranslations } = await import('next-intl/server')
						const nt = await getTranslations('notifications')
						await createNotification({
							userId: biz.profile_id,
							type: 'awaiting_payment',
							title: nt('awaitingPayment'),
							body: nt('paymentExpiredBody', { title: expiredBooking.title }),
							link: `/dashboard/bookings/${bookingId}`,
						}).catch((err) =>
							console.error('[webhook] expired notification failed', err),
						)
					}
				}

				break
			}

			case 'account.updated': {
				const account = event.data.object as Stripe.Account
				if (account.charges_enabled) {
					const { error: onboardingErr } = await supabase
						.from('creators')
						.update({ stripe_onboarding_complete: true })
						.eq('stripe_account_id', account.id)

					if (onboardingErr) {
						console.error(
							'[stripe/webhook] onboarding flag update failed',
							onboardingErr,
						)
						return NextResponse.json(
							{ error: 'Onboarding update failed' },
							{ status: 500 },
						)
					}
				}
				break
			}
		}
	} catch (err) {
		console.error('[stripe/webhook] unhandled error', err)
		return NextResponse.json(
			{ error: 'Webhook processing failed' },
			{ status: 500 },
		)
	}

	// Only record idempotency AFTER successful processing so retries are
	// safe when processing fails mid-flight.
	const { error: insertIdempotencyError } = await supabase
		.from('stripe_webhook_events')
		.insert({ event_id: event.id, event_type: event.type })

	if (insertIdempotencyError && insertIdempotencyError.code !== '23505') {
		// Processing succeeded but we couldn't record idempotency.
		// Log loudly — a retry will re-process, which could double-notify users,
		// but is safer than acking a flaky state.
		console.error(
			'[stripe/webhook] idempotency insert failed',
			insertIdempotencyError,
		)
	}

	return NextResponse.json({ received: true })
}
