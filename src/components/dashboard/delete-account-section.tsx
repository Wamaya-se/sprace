'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { deleteOwnAccount } from '@/lib/actions/account'

export function DeleteAccountSection() {
	const t = useTranslations('settings')
	const te = useActionError()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [confirmation, setConfirmation] = useState('')

	function handleDelete() {
		if (confirmation !== 'DELETE') return
		setError(null)
		startTransition(async () => {
			const result = await deleteOwnAccount(confirmation)
			if (!result.success) {
				setError(te(result.error))
			}
		})
	}

	return (
		<div>
			{error && (
				<p role="alert" className="mb-3 font-sans text-sm text-destructive">
					{error}
				</p>
			)}

			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" size="sm">
						{t('deleteAccount')}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('deleteAccountTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteAccountDescription')}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<div className="mt-2 flex flex-col gap-2">
						<Label htmlFor="delete-confirm">{t('deleteConfirmLabel')}</Label>
						<Input
							id="delete-confirm"
							value={confirmation}
							onChange={(e) => setConfirmation(e.target.value)}
							placeholder="DELETE"
							autoComplete="off"
						/>
					</div>

					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setConfirmation('')}>
							{t('cancel')}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={confirmation !== 'DELETE' || isPending}
						>
							{isPending ? t('deleting') : t('deleteAccountConfirm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
