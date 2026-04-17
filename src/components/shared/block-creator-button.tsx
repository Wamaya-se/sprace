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
import { blockUser, unblockUser } from '@/lib/actions/blocks'

interface BlockCreatorButtonProps {
	profileId: string
	displayName: string
	isBlocked: boolean
	size?: 'sm' | 'default'
	variant?: 'ghost' | 'outline' | 'destructive' | 'secondary'
}

export function BlockCreatorButton({
	profileId,
	displayName,
	isBlocked,
	size = 'sm',
	variant = 'ghost',
}: BlockCreatorButtonProps) {
	const t = useTranslations('blocking')
	const te = useActionError()
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function handleConfirm() {
		setError(null)
		startTransition(async () => {
			const result = isBlocked
				? await unblockUser(profileId)
				: await blockUser(profileId)
			if (result.success) {
				setOpen(false)
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	const triggerLabel = isBlocked ? t('unblockCreator') : t('blockCreator')
	const pendingLabel = isBlocked ? t('unblocking') : t('blocking')

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button variant={variant} size={size}>
					{triggerLabel}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isBlocked
							? t('confirmUnblockTitle', { name: displayName })
							: t('confirmBlockTitle', { name: displayName })}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isBlocked
							? t('confirmUnblockDescription')
							: t('confirmBlockDescription')}
					</AlertDialogDescription>
				</AlertDialogHeader>

				{error && (
					<p role="alert" className="mt-2 font-sans text-sm text-destructive">
						{error}
					</p>
				)}

				<AlertDialogFooter>
					<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault()
							handleConfirm()
						}}
						disabled={isPending}
					>
						{isPending
							? pendingLabel
							: isBlocked
								? t('confirmUnblock')
								: t('confirmBlock')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
