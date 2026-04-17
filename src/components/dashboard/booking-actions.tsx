'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { updateBookingStatus } from '@/lib/actions/bookings'

interface BookingActionsProps {
	bookingId: string
	status: string
	userRole: string
}

type ActionConfig = {
	key: string
	newStatus: string
	labelKey: string
	pendingKey: string
	variant: 'brand' | 'secondary' | 'ghost' | 'destructive'
	confirm?: {
		titleKey: string
		descriptionKey: string
		confirmKey: string
		cancelKey: string
	}
}

function getAvailableActions(status: string, role: string): ActionConfig[] {
	const actions: ActionConfig[] = []

	if (status === 'pending' && role === 'creator') {
		actions.push({
			key: 'accept',
			newStatus: 'awaiting_payment',
			labelKey: 'accept',
			pendingKey: 'accepting',
			variant: 'brand',
		})
		actions.push({
			key: 'decline',
			newStatus: 'declined',
			labelKey: 'decline',
			pendingKey: 'declining',
			variant: 'ghost',
			confirm: {
				titleKey: 'declineConfirmTitle',
				descriptionKey: 'declineConfirmDescription',
				confirmKey: 'declineConfirm',
				cancelKey: 'cancelDialog',
			},
		})
	}

	if (status === 'accepted' && role === 'creator') {
		actions.push({
			key: 'start-work',
			newStatus: 'in_progress',
			labelKey: 'startWork',
			pendingKey: 'starting',
			variant: 'brand',
		})
	}

	// "Mark Delivered" and "Approve/Request Revision" are now handled by
	// the delivery system (DeliveryForm + DeliveryReview components)

	if (
		['pending', 'awaiting_payment', 'accepted', 'in_progress'].includes(status)
	) {
		const canCancel =
			role === 'business' ||
			(role === 'creator' &&
				['pending', 'accepted', 'in_progress'].includes(status))

		if (canCancel) {
			actions.push({
				key: 'cancel',
				newStatus: 'cancelled',
				labelKey: 'cancel',
				pendingKey: 'cancelling',
				variant: 'ghost',
				confirm: {
					titleKey: 'cancelConfirmTitle',
					descriptionKey: 'cancelConfirmDescription',
					confirmKey: 'cancelConfirm',
					cancelKey: 'cancelDialog',
				},
			})
		}
	}

	return actions
}

export function BookingActions({
	bookingId,
	status,
	userRole,
}: BookingActionsProps) {
	const t = useTranslations('bookings')
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()

	function handleAction(newStatus: string) {
		setError(null)
		startTransition(async () => {
			const result = await updateBookingStatus(bookingId, newStatus)
			if (result.success) {
				router.refresh()
			} else {
				setError(t('updateFailed'))
			}
		})
	}

	const actions = getAvailableActions(status, userRole)

	if (actions.length === 0) return null

	return (
		<div className="flex flex-col gap-2">
			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}
			<div className="flex flex-wrap gap-2">
				{actions.map((action) => {
					if (action.confirm) {
						return (
							<AlertDialog key={action.key}>
								<AlertDialogTrigger asChild>
									<Button
										variant={action.variant}
										size="sm"
										disabled={isPending}
									>
										{isPending
											? t(action.pendingKey as never)
											: t(action.labelKey as never)}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{t(action.confirm.titleKey as never)}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{t(action.confirm.descriptionKey as never)}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											{t(action.confirm.cancelKey as never)}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => handleAction(action.newStatus)}
										>
											{t(action.confirm.confirmKey as never)}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)
					}

					return (
						<Button
							key={action.key}
							variant={action.variant}
							size="sm"
							disabled={isPending}
							onClick={() => handleAction(action.newStatus)}
						>
							{isPending
								? t(action.pendingKey as never)
								: t(action.labelKey as never)}
						</Button>
					)
				})}
			</div>
		</div>
	)
}
