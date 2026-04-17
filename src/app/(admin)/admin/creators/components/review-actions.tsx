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
import { updateCreatorStatus } from '../../actions'

interface ReviewActionsProps {
	creatorId: string
}

export function ReviewActions({ creatorId }: ReviewActionsProps) {
	const t = useTranslations('admin')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const te = useActionError()

	const handleAction = (status: 'active' | 'draft') => {
		setError(null)
		startTransition(async () => {
			const result = await updateCreatorStatus(creatorId, status)
			if (!result.success) {
				setError(te(result.error))
			} else {
				router.refresh()
			}
		})
	}

	return (
		<div className="flex items-center gap-2">
			{error && (
				<p role="alert" className="mr-2 font-sans text-xs text-destructive">
					{t('reviewFailed')}
				</p>
			)}

			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="ghost" size="sm" disabled={isPending}>
						{t('rejectCreator')}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('rejectCreator')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('rejectDescription')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('changeRoleCancel')}</AlertDialogCancel>
						<AlertDialogAction onClick={() => handleAction('draft')}>
							{t('rejectConfirm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="brand" size="sm" disabled={isPending}>
						{t('approveCreator')}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('approveCreator')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('approveDescription')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('changeRoleCancel')}</AlertDialogCancel>
						<AlertDialogAction onClick={() => handleAction('active')}>
							{t('approveConfirm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
