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
import { cancelCampaign } from '@/lib/actions/campaigns'

interface Props {
	campaignId: string
}

export function CampaignAdminActions({ campaignId }: Props) {
	const t = useTranslations('campaigns')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function handleCancel() {
		setError(null)
		startTransition(async () => {
			const result = await cancelCampaign(campaignId)
			if (result.success) {
				router.refresh()
			} else {
				setError(t('cancelFailed'))
			}
		})
	}

	return (
		<div className="flex flex-col gap-2">
			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="ghost" size="sm" disabled={isPending}>
						{isPending ? t('cancelling') : t('forceCancel')}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('cancelConfirmTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('forceCancelDescription')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
						<AlertDialogAction onClick={handleCancel}>
							{t('cancelConfirm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
