'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useActionError } from '@/hooks/use-action-error'
import { verifyBusinessOrgNumber } from '@/app/(admin)/admin/actions'

export interface BusinessVerificationData {
	businessId: string
	orgNumber: string | null
	orgNumberVerification: 'unverified' | 'pending' | 'verified' | 'rejected'
	orgNumberVerifiedAt: string | null
	orgNumberVerificationNote: string | null
	isOrgNumberFormatValid: boolean
}

interface Props {
	data: BusinessVerificationData
}

export function BusinessVerificationPanel({ data }: Props) {
	const t = useTranslations('admin')
	const router = useRouter()
	const te = useActionError()
	const [isPending, startTransition] = useTransition()
	const [note, setNote] = useState(data.orgNumberVerificationNote ?? '')
	const [error, setError] = useState<string | null>(null)

	function decide(
		decision: 'verified' | 'rejected' | 'pending' | 'unverified',
	) {
		setError(null)
		startTransition(async () => {
			const result = await verifyBusinessOrgNumber(
				data.businessId,
				decision,
				note.trim() || undefined,
			)
			if (!result.success) {
				setError(te(result.error))
				return
			}
			router.refresh()
		})
	}

	const variantMap: Record<
		BusinessVerificationData['orgNumberVerification'],
		{
			variant: 'outline' | 'secondary' | 'default'
			className?: string
		}
	> = {
		unverified: { variant: 'outline' },
		pending: { variant: 'secondary' },
		verified: { variant: 'default' },
		rejected: {
			variant: 'outline',
			className: 'border-destructive/30 bg-destructive/10 text-destructive',
		},
	}

	const labelMap: Record<
		BusinessVerificationData['orgNumberVerification'],
		string
	> = {
		unverified: t('orgVerifyUnverified'),
		pending: t('orgVerifyPending'),
		verified: t('orgVerifyVerified'),
		rejected: t('orgVerifyRejected'),
	}

	return (
		<div className="space-y-4 border-t border-outline-variant/10 pt-6">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
						{t('orgVerifyTitle')}
					</h3>
					<p className="mt-1 font-sans text-xs leading-[1.6] text-muted-foreground">
						{t('orgVerifyDescription')}
					</p>
				</div>
				<Badge
					variant={variantMap[data.orgNumberVerification].variant}
					className={variantMap[data.orgNumberVerification].className}
				>
					{labelMap[data.orgNumberVerification]}
				</Badge>
			</div>

			<div className="space-y-1 rounded-lg bg-surface-container-highest p-3">
				<div className="flex items-center justify-between">
					<span className="font-sans text-xs text-muted-foreground">
						{t('orgNumber')}
					</span>
					<span className="font-sans text-sm text-foreground/80">
						{data.orgNumber ?? t('notSet')}
					</span>
				</div>
				{data.orgNumber && (
					<div className="flex items-center justify-between">
						<span className="font-sans text-xs text-muted-foreground">
							{t('orgVerifyFormatCheck')}
						</span>
						<span
							className={
								data.isOrgNumberFormatValid
									? 'font-sans text-sm text-green-400'
									: 'font-sans text-sm text-destructive'
							}
						>
							{data.isOrgNumberFormatValid
								? t('orgVerifyFormatOk')
								: t('orgVerifyFormatFail')}
						</span>
					</div>
				)}
				{data.orgNumberVerifiedAt && (
					<div className="flex items-center justify-between">
						<span className="font-sans text-xs text-muted-foreground">
							{t('orgVerifyVerifiedAt')}
						</span>
						<span className="font-sans text-sm text-foreground/70">
							{new Date(data.orgNumberVerifiedAt).toLocaleString('sv-SE')}
						</span>
					</div>
				)}
			</div>

			<div>
				<Label htmlFor="org-verify-note">{t('orgVerifyNoteLabel')}</Label>
				<Textarea
					id="org-verify-note"
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder={t('orgVerifyNotePlaceholder')}
					rows={2}
					className="mt-1.5"
				/>
			</div>

			{error && (
				<div role="alert" className="rounded-lg bg-destructive/10 p-3">
					<p className="font-sans text-sm text-destructive">{error}</p>
				</div>
			)}

			<div className="flex flex-wrap gap-2">
				<Button
					variant="brand"
					size="sm"
					onClick={() => decide('verified')}
					disabled={isPending || !data.isOrgNumberFormatValid}
				>
					{t('orgVerifyApprove')}
				</Button>
				<Button
					variant="secondary"
					size="sm"
					onClick={() => decide('pending')}
					disabled={isPending}
				>
					{t('orgVerifySetPending')}
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => decide('rejected')}
					disabled={isPending}
				>
					{t('orgVerifyReject')}
				</Button>
				{data.orgNumberVerification !== 'unverified' && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => decide('unverified')}
						disabled={isPending}
					>
						{t('orgVerifyReset')}
					</Button>
				)}
			</div>
		</div>
	)
}
