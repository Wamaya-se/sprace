'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createCampaign, updateCampaign } from '@/lib/actions/campaigns'

interface OptionRef {
	id: string
	name: string
}

interface Props {
	specialties: OptionRef[]
	markets: OptionRef[]
	existing?: {
		id: string
		title: string
		description: string
		budget_per_creator: number | null
		total_budget: number | null
		deadline: string | null
		specialty_ids: string[]
		market_ids: string[]
	}
}

export function NewCampaignForm({ specialties, markets, existing }: Props) {
	const t = useTranslations('campaigns')
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()
	const isEdit = Boolean(existing)

	function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			if (isEdit && existing) {
				const result = await updateCampaign(existing.id, formData)
				if (result.success) {
					router.push(`/dashboard/campaigns/${existing.id}`)
					router.refresh()
				} else {
					setError(t('updateFailed'))
				}
			} else {
				const result = await createCampaign(formData)
				if (result.success) {
					router.push(`/dashboard/campaigns/${result.data.id}`)
					router.refresh()
				} else {
					setError(t('createFailed'))
				}
			}
		})
	}

	return (
		<form action={handleSubmit} className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Label htmlFor="title">{t('titleLabel')}</Label>
				<Input
					id="title"
					name="title"
					placeholder={t('titlePlaceholder')}
					required
					minLength={5}
					maxLength={200}
					defaultValue={existing?.title}
					disabled={isPending}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="description">{t('descriptionLabel')}</Label>
				<Textarea
					id="description"
					name="description"
					placeholder={t('descriptionPlaceholder')}
					required
					minLength={20}
					maxLength={10000}
					rows={8}
					defaultValue={existing?.description}
					disabled={isPending}
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<Label htmlFor="budgetPerCreator">{t('budgetPerCreatorLabel')}</Label>
					<Input
						id="budgetPerCreator"
						name="budgetPerCreator"
						type="number"
						min={1}
						step="any"
						placeholder={t('budgetPerCreatorPlaceholder')}
						defaultValue={existing?.budget_per_creator ?? undefined}
						disabled={isPending}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="totalBudget">{t('totalBudgetLabel')}</Label>
					<Input
						id="totalBudget"
						name="totalBudget"
						type="number"
						min={1}
						step="any"
						placeholder={t('totalBudgetPlaceholder')}
						defaultValue={existing?.total_budget ?? undefined}
						disabled={isPending}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="deadline">{t('deadlineLabel')}</Label>
				<Input
					id="deadline"
					name="deadline"
					type="date"
					defaultValue={existing?.deadline ?? undefined}
					disabled={isPending}
				/>
			</div>

			{specialties.length > 0 && (
				<fieldset className="flex flex-col gap-2">
					<legend className="font-sans text-sm font-medium text-foreground">
						{t('specialtiesLabel')}
					</legend>
					<p className="font-sans text-xs text-muted-foreground">
						{t('specialtiesDescription')}
					</p>
					<div className="flex flex-wrap gap-2">
						{specialties.map((s) => {
							const checked = existing?.specialty_ids.includes(s.id)
							return (
								<label
									key={s.id}
									className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-1.5 font-sans text-sm"
								>
									<input
										type="checkbox"
										name="specialtyIds"
										value={s.id}
										defaultChecked={checked}
										disabled={isPending}
										className="h-4 w-4"
									/>
									{s.name}
								</label>
							)
						})}
					</div>
				</fieldset>
			)}

			{markets.length > 0 && (
				<fieldset className="flex flex-col gap-2">
					<legend className="font-sans text-sm font-medium text-foreground">
						{t('marketsLabel')}
					</legend>
					<p className="font-sans text-xs text-muted-foreground">
						{t('marketsDescription')}
					</p>
					<div className="flex flex-wrap gap-2">
						{markets.map((m) => {
							const checked = existing?.market_ids.includes(m.id)
							return (
								<label
									key={m.id}
									className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-1.5 font-sans text-sm"
								>
									<input
										type="checkbox"
										name="marketIds"
										value={m.id}
										defaultChecked={checked}
										disabled={isPending}
										className="h-4 w-4"
									/>
									{m.name}
								</label>
							)
						})}
					</div>
				</fieldset>
			)}

			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}

			<div className="flex gap-3 pt-2">
				<Button type="submit" disabled={isPending}>
					{isPending
						? isEdit
							? t('saving')
							: t('creating')
						: isEdit
							? t('save')
							: t('createCampaign')}
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={() => router.back()}
					disabled={isPending}
				>
					{t('cancelDialog')}
				</Button>
			</div>
		</form>
	)
}
