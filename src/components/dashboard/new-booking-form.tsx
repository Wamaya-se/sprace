'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { createBooking } from '@/lib/actions/bookings'

interface Service {
	id: string
	name: string
	price: number
}

interface NewBookingFormProps {
	creatorId: string
	creatorName: string
	services: Service[]
}

export function NewBookingForm({
	creatorId,
	creatorName,
	services,
}: NewBookingFormProps) {
	const t = useTranslations('bookings')
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()

	function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			const result = await createBooking(formData)
			if (result.success) {
				router.push(`/dashboard/bookings/${result.data.id}`)
			} else {
				setError(t('createFailed'))
			}
		})
	}

	return (
		<form action={handleSubmit} className="flex flex-col gap-6">
			<div>
				<p className="font-sans text-sm text-muted-foreground">
					{t('sentTo', { name: creatorName })}
				</p>
			</div>

			<input type="hidden" name="creatorId" value={creatorId} />

			<div className="flex flex-col gap-2">
				<Label htmlFor="title">{t('briefTitle')}</Label>
				<Input
					id="title"
					name="title"
					placeholder={t('briefTitlePlaceholder')}
					required
					maxLength={200}
					disabled={isPending}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="description">{t('briefDescription')}</Label>
				<Textarea
					id="description"
					name="description"
					placeholder={t('briefDescriptionPlaceholder')}
					required
					rows={6}
					maxLength={5000}
					disabled={isPending}
				/>
			</div>

			{services.length > 0 && (
				<div className="flex flex-col gap-2">
					<Label htmlFor="serviceId">{t('service')}</Label>
					<NativeSelect id="serviceId" name="serviceId" disabled={isPending}>
						<option value="">{t('selectService')}</option>
						{services.map((s) => (
							<option key={s.id} value={s.id}>
								{t('serviceOption', {
									name: s.name,
									price: s.price.toLocaleString(),
								})}
							</option>
						))}
					</NativeSelect>
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<Label htmlFor="budget">{t('budget')}</Label>
					<Input
						id="budget"
						name="budget"
						type="number"
						min={1}
						step="any"
						placeholder={t('budgetPlaceholder')}
						disabled={isPending}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="deadline">{t('deadline')}</Label>
					<Input
						id="deadline"
						name="deadline"
						type="date"
						disabled={isPending}
					/>
				</div>
			</div>

			{error && (
				<p role="alert" className="font-sans text-sm text-destructive">
					{error}
				</p>
			)}

			<div className="flex gap-3 pt-2">
				<Button type="submit" disabled={isPending}>
					{isPending ? t('creating') : t('createBooking')}
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={() => router.back()}
					disabled={isPending}
				>
					{t('cancel')}
				</Button>
			</div>
		</form>
	)
}
