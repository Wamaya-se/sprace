'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionError } from '@/hooks/use-action-error'
import { updateCreatorDac7, updateCreatorDac7Address } from '@/lib/actions/dac7'

export interface CreatorDac7ViewData {
	hasPersonalNumber: boolean
	personalNumberLast4: string | null
	birthDate: string | null
	addressLine1: string | null
	addressLine2: string | null
	postalCode: string | null
	city: string | null
	countryCode: string
}

interface Props {
	data: CreatorDac7ViewData
	isComplete: boolean
}

export function CreatorDac7Section({ data, isComplete }: Props) {
	const t = useTranslations('dashboard')
	const router = useRouter()
	const translateError = useActionError()
	const [editing, setEditing] = useState(!isComplete)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [errorField, setErrorField] = useState<string | null>(null)

	const [personalNumber, setPersonalNumber] = useState('')
	const [addressLine1, setAddressLine1] = useState(data.addressLine1 ?? '')
	const [addressLine2, setAddressLine2] = useState(data.addressLine2 ?? '')
	const [postalCode, setPostalCode] = useState(data.postalCode ?? '')
	const [city, setCity] = useState(data.city ?? '')
	const [countryCode, setCountryCode] = useState(data.countryCode || 'SE')

	function handleSave() {
		setError(null)
		setErrorField(null)
		startTransition(async () => {
			const addressPayload = {
				addressLine1: addressLine1.trim(),
				addressLine2: addressLine2.trim(),
				postalCode: postalCode.trim(),
				city: city.trim(),
				countryCode: countryCode.trim().toUpperCase(),
			}
			const result =
				data.hasPersonalNumber && personalNumber.trim() === ''
					? await updateCreatorDac7Address(addressPayload)
					: await updateCreatorDac7({
							personalNumber: personalNumber.trim(),
							...addressPayload,
						})
			if (!result.success) {
				setError(translateError(result.error) || t('dac7SaveFailed'))
				setErrorField(result.field ?? null)
				return
			}
			setPersonalNumber('')
			setEditing(false)
			router.refresh()
		})
	}

	return (
		<Card>
			<CardContent>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<h3 className="font-heading text-base font-bold tracking-[-0.02em] text-foreground">
							{t('sectionCreatorDac7')}
						</h3>
						{!isComplete && (
							<Badge
								variant="outline"
								className="border-destructive/30 bg-destructive/10 text-destructive"
							>
								{t('badgeRequired')}
							</Badge>
						)}
					</div>
				</div>

				<p className="mt-1 font-sans text-xs leading-[1.6] text-muted-foreground">
					{t('sectionCreatorDac7Description')}
				</p>

				{error && (
					<div role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3">
						<p className="font-sans text-sm text-destructive">{error}</p>
					</div>
				)}

				{editing ? (
					<div className="mt-4 space-y-4">
						<div>
							<Label htmlFor="cr-personal-number">
								{t('personalNumberLabel')}
							</Label>
							<Input
								id="cr-personal-number"
								value={personalNumber}
								onChange={(e) => setPersonalNumber(e.target.value)}
								placeholder={
									data.hasPersonalNumber
										? `•••••• ${data.personalNumberLast4 ?? ''}`
										: 'YYYYMMDD-XXXX'
								}
								className="mt-1.5"
								autoComplete="off"
								inputMode="numeric"
								aria-invalid={errorField === 'personalNumber' || undefined}
								aria-describedby="cr-personal-number-hint"
							/>
							<p
								id="cr-personal-number-hint"
								className="mt-1 font-sans text-xs text-muted-foreground"
							>
								{data.hasPersonalNumber
									? t('personalNumberChangeHint')
									: t('personalNumberHint')}
							</p>
						</div>

						<div>
							<Label htmlFor="cr-addr1">{t('addressLine1Label')}</Label>
							<Input
								id="cr-addr1"
								value={addressLine1}
								onChange={(e) => setAddressLine1(e.target.value)}
								className="mt-1.5"
								aria-invalid={errorField === 'addressLine1' || undefined}
								required
							/>
						</div>
						<div>
							<Label htmlFor="cr-addr2">{t('addressLine2Label')}</Label>
							<Input
								id="cr-addr2"
								value={addressLine2}
								onChange={(e) => setAddressLine2(e.target.value)}
								className="mt-1.5"
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-3">
							<div>
								<Label htmlFor="cr-postal">{t('postalCodeLabel')}</Label>
								<Input
									id="cr-postal"
									value={postalCode}
									onChange={(e) => setPostalCode(e.target.value)}
									className="mt-1.5"
									aria-invalid={errorField === 'postalCode' || undefined}
									required
								/>
							</div>
							<div>
								<Label htmlFor="cr-city">{t('cityLabel')}</Label>
								<Input
									id="cr-city"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									className="mt-1.5"
									aria-invalid={errorField === 'city' || undefined}
									required
								/>
							</div>
							<div>
								<Label htmlFor="cr-country">{t('countryCodeLabel')}</Label>
								<Input
									id="cr-country"
									value={countryCode}
									onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
									maxLength={2}
									placeholder="SE"
									className="mt-1.5"
									aria-invalid={errorField === 'countryCode' || undefined}
									required
								/>
							</div>
						</div>

						<div className="flex justify-end gap-2">
							{isComplete && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setEditing(false)}
									disabled={isPending}
								>
									{t('cancelEdit')}
								</Button>
							)}
							<Button
								variant="brand"
								size="sm"
								onClick={handleSave}
								disabled={isPending}
							>
								{isPending ? t('savingSection') : t('saveSection')}
							</Button>
						</div>
					</div>
				) : (
					<div className="mt-4 space-y-2">
						<Row
							label={t('personalNumberLabel')}
							value={
								data.personalNumberLast4
									? `•••••• ${data.personalNumberLast4}`
									: t('notSet')
							}
						/>
						{data.birthDate && (
							<Row label={t('birthDateLabel')} value={data.birthDate} />
						)}
						{data.addressLine1 && (
							<Row label={t('addressLine1Label')} value={data.addressLine1} />
						)}
						{data.addressLine2 && (
							<Row label={t('addressLine2Label')} value={data.addressLine2} />
						)}
						{data.postalCode && (
							<Row label={t('postalCodeLabel')} value={data.postalCode} />
						)}
						{data.city && <Row label={t('cityLabel')} value={data.city} />}
						{data.countryCode && (
							<Row label={t('countryCodeLabel')} value={data.countryCode} />
						)}

						<div className="pt-3">
							<Button
								variant="ghost"
								size="xs"
								onClick={() => setEditing(true)}
							>
								{t('editSection')}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-2">
			<span className="font-sans text-xs text-muted-foreground">{label}</span>
			<span className="truncate font-sans text-sm text-foreground/70">
				{value}
			</span>
		</div>
	)
}
