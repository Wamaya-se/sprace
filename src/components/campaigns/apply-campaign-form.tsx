'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { applyCampaign } from '@/lib/actions/campaigns'

interface Props {
	campaignId: string
	existing?: {
		pitch: string
		proposed_price: number | null
	}
}

export function ApplyCampaignForm({ campaignId, existing }: Props) {
	const t = useTranslations('campaigns')
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [done, setDone] = useState(false)
	const router = useRouter()

	function handleSubmit(formData: FormData) {
		setError(null)
		formData.append('campaignId', campaignId)
		startTransition(async () => {
			const result = await applyCampaign(formData)
			if (result.success) {
				setDone(true)
				router.refresh()
			} else {
				setError(t('applyFailed'))
			}
		})
	}

	if (done) {
		return (
			<div className="rounded-xl bg-surface-container p-5 text-center">
				<p className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
					{t('applicationSent')}
				</p>
				<p className="mt-1 font-sans text-sm text-muted-foreground">
					{t('applicationSentDescription')}
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => router.push('/dashboard/campaigns')}
					className="mt-4"
				>
					{t('myApplications')}
				</Button>
			</div>
		)
	}

	return (
		<form action={handleSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Label htmlFor="pitch">{t('pitchLabel')}</Label>
				<Textarea
					id="pitch"
					name="pitch"
					placeholder={t('pitchPlaceholder')}
					required
					minLength={20}
					maxLength={2000}
					rows={6}
					defaultValue={existing?.pitch}
					disabled={isPending}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="proposedPrice">{t('proposedPriceLabel')}</Label>
				<Input
					id="proposedPrice"
					name="proposedPrice"
					type="number"
					min={1}
					step="any"
					placeholder={t('proposedPricePlaceholder')}
					defaultValue={existing?.proposed_price ?? undefined}
					disabled={isPending}
				/>
			</div>

			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}

			<Button type="submit" disabled={isPending}>
				{isPending
					? t('applying')
					: existing
						? t('updateApplication')
						: t('apply')}
			</Button>
		</form>
	)
}
