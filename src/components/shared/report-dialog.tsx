'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useActionError } from '@/hooks/use-action-error'
import { createReport } from '@/lib/actions/reports'
import {
	REPORT_CATEGORIES,
	type CreateReportInput,
} from '@/lib/validation/moderation'

interface ReportDialogProps {
	targetType: 'profile' | 'booking'
	targetId: string
	trigger?: React.ReactNode
}

type DialogStage = 'form' | 'success'

export function ReportDialog({
	targetType,
	targetId,
	trigger,
}: ReportDialogProps) {
	const t = useTranslations('reports')
	const te = useActionError()
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [stage, setStage] = useState<DialogStage>('form')
	const [category, setCategory] =
		useState<(typeof REPORT_CATEGORIES)[number]>('spam')
	const [reason, setReason] = useState('')
	const [error, setError] = useState<string | null>(null)

	function reset() {
		setStage('form')
		setCategory('spam')
		setReason('')
		setError(null)
	}

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) reset()
	}

	function handleSubmit() {
		setError(null)
		const payload: CreateReportInput = {
			targetType,
			targetId,
			category,
			reason,
		}
		startTransition(async () => {
			const result = await createReport(payload)
			if (result.success) {
				setStage('success')
			} else {
				setError(te(result.error))
			}
		})
	}

	const labelFor = (c: (typeof REPORT_CATEGORIES)[number]) => {
		switch (c) {
			case 'spam':
				return t('categorySpam')
			case 'fraud':
				return t('categoryFraud')
			case 'harassment':
				return t('categoryHarassment')
			case 'inappropriate':
				return t('categoryInappropriate')
			case 'other':
				return t('categoryOther')
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogTrigger asChild>
				{trigger ?? (
					<Button variant="ghost" size="sm">
						{t('reportButton')}
					</Button>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent>
				{stage === 'form' ? (
					<>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('dialogTitle')}</AlertDialogTitle>
							<AlertDialogDescription>
								{t('dialogDescription')}
							</AlertDialogDescription>
						</AlertDialogHeader>

						<div className="mt-2 flex flex-col gap-4">
							<fieldset>
								<Label id="report-category-label">{t('categoryLabel')}</Label>
								<div
									role="radiogroup"
									aria-labelledby="report-category-label"
									className="mt-2 flex flex-wrap gap-2"
								>
									{REPORT_CATEGORIES.map((c) => (
										<Button
											key={c}
											type="button"
											variant={category === c ? 'chip' : 'ghost'}
											size="sm"
											role="radio"
											aria-checked={category === c}
											onClick={() => setCategory(c)}
										>
											{labelFor(c)}
										</Button>
									))}
								</div>
							</fieldset>

							<div>
								<Label htmlFor="report-reason">{t('detailsLabel')}</Label>
								<Textarea
									id="report-reason"
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									placeholder={t('detailsPlaceholder')}
									rows={4}
									minLength={10}
									maxLength={2000}
									required
									className="mt-1.5"
									aria-describedby={error ? 'report-error' : undefined}
									aria-invalid={error ? true : undefined}
								/>
							</div>

							{error && (
								<p
									id="report-error"
									role="alert"
									className="font-sans text-sm text-destructive"
								>
									{error}
								</p>
							)}
						</div>

						<AlertDialogFooter>
							<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
							<Button
								variant="brand"
								size="default"
								onClick={handleSubmit}
								disabled={isPending || reason.trim().length < 10}
							>
								{isPending ? t('submitting') : t('submit')}
							</Button>
						</AlertDialogFooter>
					</>
				) : (
					<>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('successTitle')}</AlertDialogTitle>
							<AlertDialogDescription>
								{t('successBody')}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<Button
								variant="secondary"
								onClick={() => handleOpenChange(false)}
							>
								{t('close')}
							</Button>
						</AlertDialogFooter>
					</>
				)}
			</AlertDialogContent>
		</AlertDialog>
	)
}
