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
import {
	acceptApplication,
	declineApplication,
	shortlistApplication,
	startApplicationConversation,
	withdrawApplication,
} from '@/lib/actions/campaigns'
import type { Database } from '@/types/supabase'

type ApplicationStatus = Database['public']['Enums']['application_status']

interface Props {
	applicationId: string
	status: ApplicationStatus
	role: 'business' | 'creator'
	conversationId: string | null
	bookingId: string | null
}

export function ApplicationActions({
	applicationId,
	status,
	role,
	conversationId,
	bookingId,
}: Props) {
	const t = useTranslations('campaigns')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function runAction<T>(action: () => Promise<{ success: boolean; data?: T }>) {
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

	function handleStartChat() {
		setError(null)
		startTransition(async () => {
			const result = await startApplicationConversation(applicationId)
			if (result.success) {
				router.push(`/dashboard/messages/${result.data.conversationId}`)
			} else {
				setError(t('updateFailed'))
			}
		})
	}

	const canChat =
		!['withdrawn', 'declined', 'accepted'].includes(status) && !bookingId

	return (
		<div className="flex flex-col gap-2">
			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}
			<div className="flex flex-wrap gap-2">
				{canChat && (
					<Button
						size="sm"
						variant="outline"
						onClick={
							conversationId
								? () => router.push(`/dashboard/messages/${conversationId}`)
								: handleStartChat
						}
						disabled={isPending}
					>
						{conversationId ? t('openChat') : t('startChat')}
					</Button>
				)}

				{role === 'business' && status === 'pending' && (
					<Button
						size="sm"
						variant="secondary"
						disabled={isPending}
						onClick={() => runAction(() => shortlistApplication(applicationId))}
					>
						{isPending ? t('shortlisting') : t('shortlist')}
					</Button>
				)}

				{role === 'business' &&
					(status === 'pending' || status === 'shortlisted') && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button size="sm" disabled={isPending}>
									{isPending ? t('accepting') : t('accept')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t('acceptConfirmTitle')}</AlertDialogTitle>
									<AlertDialogDescription>
										{t('acceptConfirmDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
									<AlertDialogAction
										onClick={() =>
											runAction(() => acceptApplication(applicationId))
										}
									>
										{t('acceptConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}

				{role === 'business' &&
					(status === 'pending' || status === 'shortlisted') && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="ghost" size="sm" disabled={isPending}>
									{isPending ? t('declining') : t('decline')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										{t('declineConfirmTitle')}
									</AlertDialogTitle>
									<AlertDialogDescription>
										{t('declineConfirmDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
									<AlertDialogAction
										onClick={() =>
											runAction(() => declineApplication(applicationId))
										}
									>
										{t('declineConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}

				{role === 'creator' &&
					(status === 'pending' || status === 'shortlisted') && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="ghost" size="sm" disabled={isPending}>
									{isPending ? t('withdrawing') : t('withdraw')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										{t('withdrawConfirmTitle')}
									</AlertDialogTitle>
									<AlertDialogDescription>
										{t('withdrawConfirmDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
									<AlertDialogAction
										onClick={() =>
											runAction(() => withdrawApplication(applicationId))
										}
									>
										{t('withdrawConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
			</div>
		</div>
	)
}
