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
import { useActionError } from '@/hooks/use-action-error'
import { deleteBroadcast, sendBroadcast } from '@/lib/actions/broadcasts'
import type { BroadcastStatus } from '@/lib/validation/admin'

interface Props {
	broadcastId: string
	status: BroadcastStatus
}

export function BroadcastRowActions({ broadcastId, status }: Props) {
	const t = useTranslations('broadcasts')
	const te = useActionError()
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	if (status === 'sent') {
		return null
	}

	function runSend() {
		setError(null)
		startTransition(async () => {
			const result = await sendBroadcast(broadcastId)
			if (!result.success) {
				setError(te(result.error))
				return
			}
			router.refresh()
		})
	}

	function runDelete() {
		setError(null)
		startTransition(async () => {
			const result = await deleteBroadcast(broadcastId)
			if (!result.success) {
				setError(te(result.error))
				return
			}
			router.refresh()
		})
	}

	return (
		<div className="flex shrink-0 flex-col items-end gap-2">
			{error && (
				<p role="alert" className="font-sans text-xs text-destructive">
					{error}
				</p>
			)}
			<div className="flex gap-2">
				<Button
					variant="brand"
					size="sm"
					onClick={runSend}
					disabled={isPending}
				>
					{isPending ? t('sending') : t('sendNow')}
				</Button>

				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="ghost" size="sm" disabled={isPending}>
							{t('delete')}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
							<AlertDialogDescription>
								{t('deleteDialogDescription')}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
							<AlertDialogAction
								onClick={(e) => {
									e.preventDefault()
									runDelete()
								}}
								disabled={isPending}
							>
								{t('confirmDelete')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	)
}
