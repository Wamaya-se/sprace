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
import { suspendUser, unsuspendUser } from '@/lib/actions/moderation'

interface SuspensionActionsProps {
	userId: string
	isSuspended: boolean
}

export function SuspensionActions({
	userId,
	isSuspended,
}: SuspensionActionsProps) {
	const t = useTranslations('moderation')
	const te = useActionError()
	const router = useRouter()
	const [reason, setReason] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	function handleSuspend() {
		setError(null)
		startTransition(async () => {
			const result = await suspendUser(userId, reason)
			if (result.success) {
				setReason('')
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	function handleUnsuspend() {
		setError(null)
		startTransition(async () => {
			const result = await unsuspendUser(userId)
			if (result.success) {
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	return (
		<div className="flex flex-col gap-3">
			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}

			{isSuspended ? (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="secondary" size="sm">
							{t('unsuspendUser')}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('unsuspendDialogTitle')}</AlertDialogTitle>
							<AlertDialogDescription>
								{t('unsuspendDialogDescription')}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
							<AlertDialogAction
								onClick={(e) => {
									e.preventDefault()
									handleUnsuspend()
								}}
								disabled={isPending}
							>
								{t('confirmUnsuspend')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			) : (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="destructive" size="sm">
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
							<Label htmlFor="suspend-reason-user">
								{t('suspendReasonLabel')}
							</Label>
							<Textarea
								id="suspend-reason-user"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder={t('suspendReasonPlaceholder')}
								maxLength={2000}
								rows={3}
								className="mt-1.5"
							/>
						</div>

						<AlertDialogFooter>
							<AlertDialogCancel onClick={() => setReason('')}>
								{t('cancel')}
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={(e) => {
									e.preventDefault()
									handleSuspend()
								}}
								disabled={isPending || reason.trim().length < 5}
							>
								{t('confirmSuspend')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	)
}
