'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useActionError } from '@/hooks/use-action-error'
import {
	createCheckoutSession,
	getPaymentForBooking,
} from '@/lib/actions/stripe'

interface PaymentCardProps {
	bookingId: string
	bookingStatus: string
	userRole: string
}

type PaymentData = Awaited<ReturnType<typeof getPaymentForBooking>>

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> =
	{
		pending: 'outline',
		captured: 'default',
		transferred: 'secondary',
		refunded: 'outline',
		failed: 'outline',
	}

export function PaymentCard({
	bookingId,
	bookingStatus,
	userRole,
}: PaymentCardProps) {
	const t = useTranslations('payments')
	const ts = useTranslations('bookings')
	const te = useActionError()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [payment, setPayment] = useState<PaymentData>(null)

	useEffect(() => {
		getPaymentForBooking(bookingId).then(setPayment)
	}, [bookingId])

	const showPayButton =
		bookingStatus === 'awaiting_payment' && userRole === 'business'

	function handlePay() {
		setError(null)
		startTransition(async () => {
			const result = await createCheckoutSession(bookingId)
			if (result.success) {
				window.location.href = result.data.url
			} else {
				setError(te(result.error))
			}
		})
	}

	if (!payment && !showPayButton) return null

	const statusKey =
		`status${(payment?.status ?? 'pending').charAt(0).toUpperCase() + (payment?.status ?? 'pending').slice(1)}` as never

	return (
		<>
			<Separator className="my-6" />
			<div>
				<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
					{t('title')}
				</h3>
				<Card className="mt-3">
					<CardContent className="py-4">
						{showPayButton && (
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<p className="font-sans text-sm text-foreground/60">
									{ts('statusAwaitingPayment')}
								</p>
								<Button
									variant="brand"
									size="sm"
									disabled={isPending}
									onClick={handlePay}
								>
									{isPending ? ts('paying') : ts('payNow')}
								</Button>
							</div>
						)}

						{payment && (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="font-sans text-sm text-muted-foreground">
										{t('status')}
									</span>
									<Badge
										variant={statusBadgeVariant[payment.status] ?? 'outline'}
									>
										{t(statusKey)}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-sans text-sm text-muted-foreground">
										{t('amount')}
									</span>
									<span className="font-sans text-sm font-medium text-foreground">
										{t('amountFormatted', {
											amount: (payment.amount_total / 100).toLocaleString(),
										})}
									</span>
								</div>
								{userRole === 'creator' && payment.status !== 'pending' && (
									<div className="flex items-center justify-between">
										<span className="font-sans text-sm text-muted-foreground">
											{t('creatorPayout')}
										</span>
										<span className="font-sans text-sm font-medium text-foreground">
											{t('amountFormatted', {
												amount: (payment.creator_payout / 100).toLocaleString(),
											})}
										</span>
									</div>
								)}
							</div>
						)}

						{error && (
							<p
								role="alert"
								className="mt-2 font-sans text-sm text-destructive"
							>
								{error}
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	)
}
