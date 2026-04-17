'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useActionError } from '@/hooks/use-action-error'
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
import { openDispute } from '@/lib/actions/disputes'

interface DisputeSectionProps {
	bookingId: string
	bookingStatus: string
	dispute: {
		id: string
		reason: string
		status: string
		admin_note: string | null
		created_at: string
		resolved_at: string | null
		opened_by_name: string
	} | null
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
	open: 'default',
	under_review: 'default',
	resolved_refund: 'secondary',
	resolved_release: 'secondary',
	resolved_partial: 'secondary',
	dismissed: 'outline',
}

export function DisputeSection({
	bookingId,
	bookingStatus,
	dispute,
}: DisputeSectionProps) {
	const t = useTranslations('disputes')
	const te = useActionError()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [showForm, setShowForm] = useState(false)
	const [reason, setReason] = useState('')
	const router = useRouter()

	const canOpenDispute =
		!dispute && ['in_progress', 'delivered'].includes(bookingStatus)
	const hasActiveDispute =
		dispute && ['open', 'under_review'].includes(dispute.status)

	function handleSubmit() {
		if (reason.trim().length < 10) {
			setError(t('reasonRequired'))
			return
		}
		setError(null)
		startTransition(async () => {
			const result = await openDispute(bookingId, reason)
			if (result.success) {
				setShowForm(false)
				setReason('')
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	const statusKey = dispute?.status
		? `status${dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}`
		: ''

	return (
		<div className="flex flex-col gap-3">
			{dispute && (
				<Card>
					<CardContent className="py-4">
						<div className="flex items-center gap-2">
							<h4 className="font-heading text-sm font-semibold tracking-[-0.03em] text-foreground">
								{hasActiveDispute ? t('activeDispute') : t('disputeOpened')}
							</h4>
							<Badge variant={statusVariants[dispute.status] ?? 'outline'}>
								{t(statusKey as never)}
							</Badge>
						</div>

						<p className="mt-1 font-sans text-xs text-muted-foreground">
							{t('disputeOpenedBy', {
								name: dispute.opened_by_name,
								date: new Date(dispute.created_at).toLocaleDateString(
									undefined,
									{
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									},
								),
							})}
						</p>

						<div className="mt-3">
							<span className="font-sans text-xs font-medium text-muted-foreground">
								{t('disputeReason')}
							</span>
							<p className="mt-0.5 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
								{dispute.reason}
							</p>
						</div>

						{dispute.admin_note && (
							<div className="mt-3 rounded-lg bg-surface-container-low p-3">
								<span className="font-sans text-xs font-medium text-muted-foreground">
									{t('disputeAdminNote')}
								</span>
								<p className="mt-0.5 whitespace-pre-wrap font-sans text-sm leading-[1.7] text-foreground/70">
									{dispute.admin_note}
								</p>
							</div>
						)}

						{dispute.resolved_at && (
							<p className="mt-2 font-sans text-xs text-muted-foreground">
								{t('dateResolved')}:{' '}
								{new Date(dispute.resolved_at).toLocaleDateString(undefined, {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
							</p>
						)}
					</CardContent>
				</Card>
			)}

			{canOpenDispute && !showForm && (
				<div className="rounded-xl bg-surface-container-low p-4">
					<p className="font-sans text-sm text-muted-foreground">
						{t('disputeInfo')}
					</p>
					<Button
						variant="ghost"
						size="sm"
						className="mt-2"
						onClick={() => setShowForm(true)}
					>
						{t('openDispute')}
					</Button>
				</div>
			)}

			{showForm && (
				<Card>
					<CardContent className="py-4">
						{error && (
							<p
								id="dispute-error"
								role="alert"
								className="mb-3 font-sans text-sm text-destructive"
							>
								{error}
							</p>
						)}

						<Label htmlFor="dispute-reason">{t('reasonLabel')}</Label>
						<Textarea
							id="dispute-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t('reasonPlaceholder')}
							maxLength={2000}
							rows={4}
							className="mt-1.5"
							aria-required="true"
							aria-invalid={!!error}
							aria-describedby={error ? 'dispute-error' : undefined}
						/>

						<div className="mt-3 flex gap-2">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="secondary"
										size="sm"
										disabled={isPending || reason.trim().length < 10}
									>
										{isPending ? t('opening') : t('openDispute')}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
										<AlertDialogDescription>
											{t('confirmDescription')}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
										<AlertDialogAction onClick={handleSubmit}>
											{t('confirmAction')}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>

							<Button
								variant="ghost"
								size="sm"
								disabled={isPending}
								onClick={() => {
									setShowForm(false)
									setReason('')
									setError(null)
								}}
							>
								{t('cancelDialog')}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
