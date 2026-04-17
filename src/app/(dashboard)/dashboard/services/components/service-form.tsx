'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useActionError } from '@/hooks/use-action-error'
import { createService, updateService } from '../actions'

interface ExistingMedia {
	id: string
	media_url: string
	sort_order: number
}

interface ServiceFormProps {
	mode: 'create' | 'edit'
	initialData?: {
		id: string
		name: string
		description: string | null
		price: number
		delivery_days: number
		is_active: boolean
		media: ExistingMedia[]
	}
}

export function ServiceForm({ mode, initialData }: ServiceFormProps) {
	const t = useTranslations('services')
	const te = useActionError()
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	const [name, setName] = useState(initialData?.name ?? '')
	const [description, setDescription] = useState(initialData?.description ?? '')
	const [price, setPrice] = useState(initialData?.price?.toString() ?? '')
	const [deliveryDays, setDeliveryDays] = useState(
		initialData?.delivery_days?.toString() ?? '7',
	)
	const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
	const [errors, setErrors] = useState<Record<string, string | undefined>>({})
	const [serverError, setServerError] = useState<string | null>(null)

	const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>(
		initialData?.media ?? [],
	)
	const [newMediaFiles, setNewMediaFiles] = useState<File[]>([])
	const [newMediaPreviews, setNewMediaPreviews] = useState<string[]>([])

	const totalMedia = existingMedia.length + newMediaFiles.length

	const handleMediaAdd = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files ?? [])
			const remaining = 4 - totalMedia
			const toAdd = files.slice(0, remaining)

			const previews = toAdd.map((f) => URL.createObjectURL(f))
			setNewMediaFiles((prev) => [...prev, ...toAdd])
			setNewMediaPreviews((prev) => [...prev, ...previews])
			setErrors((prev) => ({ ...prev, media: undefined }))
			e.target.value = ''
		},
		[totalMedia],
	)

	const handleRemoveExisting = useCallback((id: string) => {
		setExistingMedia((prev) => prev.filter((m) => m.id !== id))
	}, [])

	const handleRemoveNew = useCallback((index: number) => {
		setNewMediaFiles((prev) => prev.filter((_, i) => i !== index))
		setNewMediaPreviews((prev) => {
			URL.revokeObjectURL(prev[index])
			return prev.filter((_, i) => i !== index)
		})
	}, [])

	const validate = useCallback((): boolean => {
		const newErrors: Record<string, string | undefined> = {}
		if (!name.trim()) newErrors.name = t('nameRequired')
		if (!price || isNaN(Number(price)) || Number(price) <= 0) {
			newErrors.price = t('priceRequired')
		}
		if (
			!deliveryDays ||
			isNaN(Number(deliveryDays)) ||
			Number(deliveryDays) <= 0
		) {
			newErrors.deliveryDays = t('deliveryDaysRequired')
		}
		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}, [name, price, deliveryDays, t])

	const handleSubmit = () => {
		if (!validate()) return
		setServerError(null)

		const formData = new FormData()
		if (mode === 'edit' && initialData?.id) {
			formData.set('serviceId', initialData.id)
		}
		formData.set('name', name.trim())
		formData.set('description', description.trim())
		formData.set('price', price)
		formData.set('deliveryDays', deliveryDays)
		formData.set('isActive', String(isActive))

		for (const media of existingMedia) {
			formData.append('keepMediaIds', media.id)
		}
		for (const file of newMediaFiles) {
			formData.append('media', file)
		}

		startTransition(async () => {
			const action = mode === 'create' ? createService : updateService
			const result = await action(formData)
			if (result.success) {
				router.push('/dashboard/services')
			} else {
				setServerError(te(result.error))
			}
		})
	}

	return (
		<div className="mx-auto max-w-lg">
			<div className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="service-name">{t('name')}</Label>
					<Input
						id="service-name"
						value={name}
						onChange={(e) => {
							setName(e.target.value)
							setErrors((p) => ({ ...p, name: undefined }))
						}}
						placeholder={t('namePlaceholder')}
						aria-invalid={!!errors.name}
						aria-describedby={errors.name ? 'name-error' : undefined}
					/>
					{errors.name && (
						<p
							id="name-error"
							role="alert"
							className="font-sans text-xs text-destructive"
						>
							{errors.name}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="service-description">{t('descriptionLabel')}</Label>
					<Textarea
						id="service-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t('descriptionPlaceholder')}
						rows={4}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="service-price">{t('price')}</Label>
						<Input
							id="service-price"
							type="number"
							min="1"
							step="1"
							value={price}
							onChange={(e) => {
								setPrice(e.target.value)
								setErrors((p) => ({ ...p, price: undefined }))
							}}
							placeholder={t('pricePlaceholder')}
							aria-invalid={!!errors.price}
							aria-describedby={errors.price ? 'price-error' : undefined}
						/>
						{errors.price && (
							<p
								id="price-error"
								role="alert"
								className="font-sans text-xs text-destructive"
							>
								{errors.price}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="service-delivery">{t('deliveryDays')}</Label>
						<Input
							id="service-delivery"
							type="number"
							min="1"
							step="1"
							value={deliveryDays}
							onChange={(e) => {
								setDeliveryDays(e.target.value)
								setErrors((p) => ({ ...p, deliveryDays: undefined }))
							}}
							placeholder={t('deliveryDaysPlaceholder')}
							aria-invalid={!!errors.deliveryDays}
							aria-describedby={
								errors.deliveryDays ? 'delivery-error' : undefined
							}
						/>
						{errors.deliveryDays && (
							<p
								id="delivery-error"
								role="alert"
								className="font-sans text-xs text-destructive"
							>
								{errors.deliveryDays}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between rounded-lg border border-outline-variant/10 p-4">
					<div>
						<p className="font-sans text-sm font-medium text-foreground">
							{t('isActive')}
						</p>
						<p className="mt-0.5 font-sans text-xs text-muted-foreground">
							{t('isActiveHint')}
						</p>
					</div>
					<Switch
						checked={isActive}
						onCheckedChange={setIsActive}
						aria-label={t('isActive')}
					/>
				</div>

				<div className="space-y-2">
					<Label>{t('media')}</Label>
					<p className="font-sans text-xs text-muted-foreground">
						{t('mediaHint')}
					</p>

					{(existingMedia.length > 0 || newMediaPreviews.length > 0) && (
						<div className="mt-3 grid grid-cols-2 gap-3">
							{existingMedia.map((media) => (
								<div
									key={media.id}
									className="group relative aspect-video overflow-hidden rounded-lg"
								>
									<Image
										src={media.media_url}
										alt=""
										fill
										className="object-cover"
										sizes="(max-width: 640px) 50vw, 240px"
									/>
									<button
										type="button"
										onClick={() => handleRemoveExisting(media.id)}
										className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-foreground opacity-0 transition-opacity hover:bg-surface-dim group-focus-within:opacity-100 group-hover:opacity-100"
										aria-label={t('removeImage')}
									>
										<svg
											className="h-3 w-3"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							))}
							{newMediaPreviews.map((url, i) => (
								<div
									key={url}
									className="group relative aspect-video overflow-hidden rounded-lg"
								>
									<Image
										src={url}
										alt=""
										fill
										className="object-cover"
										sizes="(max-width: 640px) 50vw, 240px"
									/>
									<button
										type="button"
										onClick={() => handleRemoveNew(i)}
										className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-foreground opacity-0 transition-opacity hover:bg-surface-dim group-focus-within:opacity-100 group-hover:opacity-100"
										aria-label={t('removeImage')}
									>
										<svg
											className="h-3 w-3"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							))}
						</div>
					)}

					{totalMedia < 4 && (
						<label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-outline-variant/20 p-6 hover:border-outline-variant/40">
							<svg
								className="h-8 w-8 text-muted-foreground"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
								/>
							</svg>
							<span className="font-sans text-xs text-muted-foreground">
								{t('mediaDrop')}
							</span>
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp"
								multiple
								onChange={handleMediaAdd}
								className="sr-only"
							/>
						</label>
					)}
					{errors.media && (
						<p role="alert" className="font-sans text-xs text-destructive">
							{errors.media}
						</p>
					)}
				</div>
			</div>

			{serverError && (
				<div role="alert" className="mt-6 rounded-lg bg-destructive/10 p-3">
					<p className="font-sans text-sm text-destructive">{serverError}</p>
				</div>
			)}

			<div className="mt-8 flex items-center justify-end gap-3">
				<Button
					type="button"
					variant="ghost"
					onClick={() => router.push('/dashboard/services')}
					disabled={isPending}
				>
					{t('cancel')}
				</Button>
				<Button
					type="button"
					variant="brand"
					onClick={handleSubmit}
					disabled={isPending}
				>
					{isPending ? t('saving') : t('save')}
				</Button>
			</div>
		</div>
	)
}
