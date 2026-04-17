'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useActionError } from '@/hooks/use-action-error'
import { resolveReport, suspendUser } from '@/lib/actions/moderation'
import type { ReportStatus, ReportTargetType } from '@/lib/queries/reports'

interface ReportActionsProps {
	reportId: string
	status: ReportStatus
	targetType: ReportTargetType
	targetOwnerId: string | null
}

export function ReportActions({
	reportId,
	status,
	targetType,
	targetOwnerId,
}: ReportActionsProps) {
	const t = useTranslations('moderation')
	const te = useActionError()
	const router = useRouter()

	const [adminNote, setAdminNote] = useState('')
	const [suspendReason, setSuspendReason] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const canSuspend = targetType === 'profile' && targetOwnerId != null
	const isTerminal = status === 'resolved' || status === 'dismissed'

	function runResolve(next: 'reviewing' | 'resolved' | 'dismissed') {
		setError(null)
		startTransition(async () => {
			const result = await resolveReport(reportId, {
				status: next,
				adminNote: adminNote.trim() ? adminNote.trim() : undefined,
			})
			if (result.success) {
				setAdminNote('')
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	function runSuspend() {
		if (!targetOwnerId) return
		setError(null)
		startTransition(async () => {
			const result = await suspendUser(targetOwnerId, suspendReason)
			if (result.success) {
				setSuspendReason('')
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	return (
		<div className="mt-4 flex flex-col gap-3 rounded-xl bg-surface-container-low p-4">
			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}

			{!isTerminal && (
				<div>
					<Label htmlFor={`admin-note-${reportId}`}>
						{t('adminNoteLabel')}
					</Label>
					<Textarea
						id={`admin-note-${reportId}`}
						value={adminNote}
						onChange={(e) => setAdminNote(e.target.value)}
						placeholder={t('adminNotePlaceholder')}
						maxLength={2000}
						rows={3}
						className="mt-1.5"
					/>
				</div>
			)}

			<div className="flex flex-wrap gap-2">
				{status === 'pending' && (
					<Button
						variant="secondary"
						size="sm"
						disabled={isPending}
						onClick={() => runResolve('reviewing')}
					>
						{isPending ? t('resolving') : t('startReview')}
					</Button>
				)}

				{!isTerminal && (
					<>
						<Button
							variant="brand"
							size="sm"
							disabled={isPending}
							onClick={() => runResolve('resolved')}
						>
							{isPending ? t('resolving') : t('resolve')}
						</Button>

						<Button
							variant="ghost"
							size="sm"
							disabled={isPending}
							onClick={() => runResolve('dismissed')}
						>
							{isPending ? t('resolving') : t('dismiss')}
						</Button>
					</>
				)}

				{canSuspend && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive" size="sm" disabled={isPending}>
								{t('suspendUser')}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t('suspendDialogTitle')}</AlertDialogTitle>
								<AlertDialogDescription>
									{t('suspendDialogDescription')}
								</AlertDialogDescription>
							</AlertDialogHeader>

							<div className="mt-2">
								<Label htmlFor={`suspend-reason-${reportId}`}>
									{t('suspendReasonLabel')}
								</Label>
								<Textarea
									id={`suspend-reason-${reportId}`}
									value={suspendReason}
									onChange={(e) => setSuspendReason(e.target.value)}
									placeholder={t('suspendReasonPlaceholder')}
									maxLength={2000}
									rows={3}
									className="mt-1.5"
								/>
							</div>

							<AlertDialogFooter>
								<AlertDialogCancel onClick={() => setSuspendReason('')}>
									{t('cancel')}
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={(e) => {
										e.preventDefault()
										runSuspend()
									}}
									disabled={isPending || suspendReason.trim().length < 5}
								>
									{t('confirmSuspend')}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</div>
		</div>
	)
}
