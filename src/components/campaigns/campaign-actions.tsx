'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import {
	cancelCampaign,
	closeCampaign,
	publishCampaign,
} from '@/lib/actions/campaigns'
import type { Database } from '@/types/supabase'

type CampaignStatus = Database['public']['Enums']['campaign_status']

interface Props {
	campaignId: string
	status: CampaignStatus
	isOwner: boolean
	slug: string
}

export function CampaignActions({ campaignId, status, isOwner, slug }: Props) {
	const t = useTranslations('campaigns')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function runAction(action: () => Promise<{ success: boolean }>) {
		setError(null)
		startTransition(async () => {
			const result = await action()
			if (result.success) {
				router.refresh()
			} else {
				setError(t('updateFailed'))
			}
		})
	}

	if (!isOwner) return null

	return (
		<div className="flex flex-col gap-2">
			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}
			<div className="flex flex-wrap gap-2">
				{status === 'draft' && (
					<>
						<Button asChild size="sm" variant="outline">
							<Link href={`/dashboard/campaigns/${campaignId}/edit`}>
								{t('edit')}
							</Link>
						</Button>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button size="sm" disabled={isPending}>
									{isPending ? t('publishing') : t('publish')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										{t('publishConfirmTitle')}
									</AlertDialogTitle>
									<AlertDialogDescription>
										{t('publishConfirmDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => runAction(() => publishCampaign(campaignId))}
									>
										{t('publishConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="ghost" size="sm" disabled={isPending}>
									{isPending ? t('cancelling') : t('cancel')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t('cancelConfirmTitle')}</AlertDialogTitle>
									<AlertDialogDescription>
										{t('cancelConfirmDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => runAction(() => cancelCampaign(campaignId))}
									>
										{t('cancelConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</>
				)}

				{status === 'open' && (
					<>
						<Button asChild size="sm" variant="outline">
							<Link href={`/campaigns/${slug}`}>{t('viewPublic')}</Link>
						</Button>
						<Button asChild size="sm" variant="outline">
							<Link href={`/dashboard/campaigns/${campaignId}/edit`}>
								{t('edit')}
							</Link>
						</Button>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="secondary" size="sm" disabled={isPending}>
									{isPending ? t('closing') : t('close')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t('closeConfirmTitle')}</AlertDialogTitle>
									<AlertDialogDescription>
										{t('closeConfirmDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => runAction(() => closeCampaign(campaignId))}
									>
										{t('closeConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="ghost" size="sm" disabled={isPending}>
									{isPending ? t('cancelling') : t('cancel')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t('cancelConfirmTitle')}</AlertDialogTitle>
									<AlertDialogDescription>
										{t('cancelConfirmDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => runAction(() => cancelCampaign(campaignId))}
									>
										{t('cancelConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</>
				)}

				{status === 'closed' && (
					<Button asChild size="sm" variant="outline">
						<Link href={`/campaigns/${slug}`}>{t('viewPublic')}</Link>
					</Button>
				)}
			</div>
		</div>
	)
}
