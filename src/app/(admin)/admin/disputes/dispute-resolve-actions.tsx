'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { resolveDispute } from '@/lib/actions/disputes'

interface DisputeResolveActionsProps {
	disputeId: string
}

const resolutions = [
	{ value: 'resolved_refund', labelKey: 'resolutionRefund' },
	{ value: 'resolved_release', labelKey: 'resolutionRelease' },
	{ value: 'resolved_partial', labelKey: 'resolutionPartial' },
	{ value: 'dismissed', labelKey: 'resolutionDismissed' },
] as const

export function DisputeResolveActions({
	disputeId,
}: DisputeResolveActionsProps) {
	const t = useTranslations('disputes')
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [showForm, setShowForm] = useState(false)
	const [selectedResolution, setSelectedResolution] = useState<string>('')
	const [adminNote, setAdminNote] = useState('')
	const router = useRouter()
	const te = useActionError()

	function handleResolve() {
		if (!selectedResolution) return
		setError(null)
		startTransition(async () => {
			const result = await resolveDispute(
				disputeId,
				selectedResolution,
				adminNote || undefined,
			)
			if (result.success) {
				setShowForm(false)
				setSelectedResolution('')
				setAdminNote('')
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	if (!showForm) {
		return (
			<Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
				{t('resolveDispute')}
			</Button>
		)
	}

	return (
		<div className="rounded-xl bg-surface-container-low p-4">
			{error && (
				<p
					id="resolve-error"
					role="alert"
					className="mb-3 font-sans text-sm text-destructive"
				>
					{error}
				</p>
			)}

			<div className="flex flex-col gap-3">
				<div>
					<Label id={`resolution-label-${disputeId}`}>
						{t('resolutionLabel')}
					</Label>
					<div
						className="mt-1.5 flex flex-wrap gap-2"
						role="radiogroup"
						aria-labelledby={`resolution-label-${disputeId}`}
					>
						{resolutions.map((res) => (
							<Button
								key={res.value}
								variant={selectedResolution === res.value ? 'chip' : 'ghost'}
								size="sm"
								role="radio"
								aria-checked={selectedResolution === res.value}
								onClick={() => setSelectedResolution(res.value)}
							>
								{t(res.labelKey)}
							</Button>
						))}
					</div>
				</div>

				<div>
					<Label htmlFor={`admin-note-${disputeId}`}>
						{t('adminNoteLabel')}
					</Label>
					<Textarea
						id={`admin-note-${disputeId}`}
						value={adminNote}
						onChange={(e) => setAdminNote(e.target.value)}
						placeholder={t('adminNotePlaceholder')}
						maxLength={2000}
						rows={3}
						className="mt-1.5"
						aria-describedby={error ? 'resolve-error' : undefined}
					/>
				</div>

				<div className="flex gap-2">
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="brand"
								size="sm"
								disabled={isPending || !selectedResolution}
							>
								{isPending ? t('resolving') : t('resolveDispute')}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t('resolveDispute')}</AlertDialogTitle>
								<AlertDialogDescription>
									{t(
										resolutions.find((r) => r.value === selectedResolution)
											?.labelKey ?? 'resolutionRefund',
									)}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t('cancelDialog')}</AlertDialogCancel>
								<AlertDialogAction onClick={handleResolve}>
									{t('resolveDispute')}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					<Button
						variant="ghost"
						size="sm"
						disabled={isPending}
						onClick={() => {
							setShowForm(false)
							setSelectedResolution('')
							setAdminNote('')
							setError(null)
						}}
					>
						{t('cancelDialog')}
					</Button>
				</div>
			</div>
		</div>
	)
}
