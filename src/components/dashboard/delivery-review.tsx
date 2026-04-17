'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { approveDelivery, requestRevision } from '@/lib/actions/deliveries'

interface DeliveryReviewProps {
	deliveryId: string
	revisionsUsed: number
	maxRevisions: number
}

export function DeliveryReview({
	deliveryId,
	revisionsUsed,
	maxRevisions,
}: DeliveryReviewProps) {
	const t = useTranslations('deliveries')
	const te = useActionError()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [showRevisionForm, setShowRevisionForm] = useState(false)
	const [revisionComment, setRevisionComment] = useState('')
	const router = useRouter()

	const canRequestRevision = revisionsUsed < maxRevisions

	function handleApprove() {
		setError(null)
		startTransition(async () => {
			const result = await approveDelivery(deliveryId)
			if (result.success) {
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	function handleRequestRevision() {
		if (!revisionComment.trim()) {
			setError(t('revisionCommentRequired'))
			return
		}
		setError(null)
		startTransition(async () => {
			const result = await requestRevision(deliveryId, revisionComment)
			if (result.success) {
				setShowRevisionForm(false)
				setRevisionComment('')
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	return (
		<div className="flex flex-col gap-3">
			{error && (
				<p
					id="revision-error"
					role="alert"
					className="font-sans text-sm text-destructive"
				>
					{error}
				</p>
			)}

			<p className="font-sans text-xs text-muted-foreground">
				{t('revisionsUsed', { used: revisionsUsed, max: maxRevisions })}
			</p>

			<div className="flex flex-wrap gap-2">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="brand" size="sm" disabled={isPending}>
							{isPending ? t('approving') : t('approve')}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('approveConfirmTitle')}</AlertDialogTitle>
							<AlertDialogDescription>
								{t('approveConfirmDescription')}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
							<AlertDialogAction onClick={handleApprove}>
								{t('approveConfirm')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{canRequestRevision && !showRevisionForm && (
					<Button
						variant="secondary"
						size="sm"
						disabled={isPending}
						onClick={() => setShowRevisionForm(true)}
					>
						{t('requestRevision')}
					</Button>
				)}

				{!canRequestRevision && (
					<p className="self-center font-sans text-xs text-muted-foreground">
						{t('maxRevisionsReached')}
					</p>
				)}
			</div>

			{showRevisionForm && (
				<div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-4">
					<Label htmlFor="revision-comment">{t('revisionCommentLabel')}</Label>
					<Textarea
						id="revision-comment"
						value={revisionComment}
						onChange={(e) => setRevisionComment(e.target.value)}
						placeholder={t('revisionCommentPlaceholder')}
						maxLength={2000}
						rows={3}
						aria-required="true"
						aria-invalid={!!error}
						aria-describedby={error ? 'revision-error' : undefined}
					/>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							size="sm"
							disabled={isPending}
							onClick={handleRequestRevision}
						>
							{isPending ? t('requesting') : t('requestRevision')}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							disabled={isPending}
							onClick={() => {
								setShowRevisionForm(false)
								setRevisionComment('')
							}}
						>
							{t('cancelDialog')}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
