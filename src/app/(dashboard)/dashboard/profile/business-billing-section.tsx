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
import { updateBusinessBillingDetails } from '@/lib/actions/dac7'

export interface BusinessBillingData {
	vatNumber: string | null
	addressLine1: string | null
	addressLine2: string | null
	postalCode: string | null
	city: string | null
	countryCode: string
	orgNumberVerification: 'unverified' | 'pending' | 'verified' | 'rejected'
}

interface Props {
	business: BusinessBillingData
	isComplete: boolean
}

export function BusinessBillingSection({ business, isComplete }: Props) {
	const t = useTranslations('dashboard')
	const router = useRouter()
	const translateError = useActionError()
	const [editing, setEditing] = useState(!isComplete)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [errorField, setErrorField] = useState<string | null>(null)

	const [vatNumber, setVatNumber] = useState(business.vatNumber ?? '')
	const [addressLine1, setAddressLine1] = useState(business.addressLine1 ?? '')
	const [addressLine2, setAddressLine2] = useState(business.addressLine2 ?? '')
	const [postalCode, setPostalCode] = useState(business.postalCode ?? '')
	const [city, setCity] = useState(business.city ?? '')
	const [countryCode, setCountryCode] = useState(business.countryCode || 'SE')

	function handleSave() {
		setError(null)
		setErrorField(null)
		startTransition(async () => {
			const result = await updateBusinessBillingDetails({
				vatNumber: vatNumber.trim(),
				addressLine1: addressLine1.trim(),
				addressLine2: addressLine2.trim(),
				postalCode: postalCode.trim(),
				city: city.trim(),
				countryCode: countryCode.trim().toUpperCase(),
			})
			if (!result.success) {
				setError(translateError(result.error) || t('billingSaveFailed'))
				setErrorField(result.field ?? null)
				return
			}
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
							{t('sectionBusinessBilling')}
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
					<VerificationBadge status={business.orgNumberVerification} />
				</div>

				<p className="mt-1 font-sans text-xs leading-[1.6] text-muted-foreground">
					{t('sectionBusinessBillingDescription')}
				</p>

				{error && (
					<div role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3">
						<p className="font-sans text-sm text-destructive">{error}</p>
					</div>
				)}

				{editing ? (
					<div className="mt-4 space-y-4">
						<div>
							<Label htmlFor="biz-vat">{t('vatNumberLabel')}</Label>
							<Input
								id="biz-vat"
								value={vatNumber}
								onChange={(e) => setVatNumber(e.target.value)}
								placeholder="SE556123456701"
								className="mt-1.5"
								aria-invalid={errorField === 'vatNumber' || undefined}
							/>
							<p className="mt-1 font-sans text-xs text-muted-foreground">
								{t('vatNumberHint')}
							</p>
						</div>
						<div>
							<Label htmlFor="biz-addr1">{t('addressLine1Label')}</Label>
							<Input
								id="biz-addr1"
								value={addressLine1}
								onChange={(e) => setAddressLine1(e.target.value)}
								className="mt-1.5"
								aria-invalid={errorField === 'addressLine1' || undefined}
								required
							/>
						</div>
						<div>
							<Label htmlFor="biz-addr2">{t('addressLine2Label')}</Label>
							<Input
								id="biz-addr2"
								value={addressLine2}
								onChange={(e) => setAddressLine2(e.target.value)}
								className="mt-1.5"
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-3">
							<div>
								<Label htmlFor="biz-postal">{t('postalCodeLabel')}</Label>
								<Input
									id="biz-postal"
									value={postalCode}
									onChange={(e) => setPostalCode(e.target.value)}
									className="mt-1.5"
									aria-invalid={errorField === 'postalCode' || undefined}
									required
								/>
							</div>
							<div>
								<Label htmlFor="biz-city">{t('cityLabel')}</Label>
								<Input
									id="biz-city"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									className="mt-1.5"
									aria-invalid={errorField === 'city' || undefined}
									required
								/>
							</div>
							<div>
								<Label htmlFor="biz-country">{t('countryCodeLabel')}</Label>
								<Input
									id="biz-country"
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
						{business.addressLine1 && (
							<Row
								label={t('addressLine1Label')}
								value={business.addressLine1}
							/>
						)}
						{business.addressLine2 && (
							<Row
								label={t('addressLine2Label')}
								value={business.addressLine2}
							/>
						)}
						{business.postalCode && (
							<Row label={t('postalCodeLabel')} value={business.postalCode} />
						)}
						{business.city && (
							<Row label={t('cityLabel')} value={business.city} />
						)}
						{business.countryCode && (
							<Row label={t('countryCodeLabel')} value={business.countryCode} />
						)}
						{business.vatNumber && (
							<Row label={t('vatNumberLabel')} value={business.vatNumber} />
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

function VerificationBadge({
	status,
}: {
	status: BusinessBillingData['orgNumberVerification']
}) {
	const t = useTranslations('dashboard')
	const map: Record<
		BusinessBillingData['orgNumberVerification'],
		{
			label: string
			variant: 'outline' | 'secondary' | 'default'
			className?: string
		}
	> = {
		unverified: { label: t('orgVerifyUnverified'), variant: 'outline' },
		pending: { label: t('orgVerifyPending'), variant: 'secondary' },
		verified: { label: t('orgVerifyVerified'), variant: 'default' },
		rejected: {
			label: t('orgVerifyRejected'),
			variant: 'outline',
			className: 'border-destructive/30 bg-destructive/10 text-destructive',
		},
	}
	const entry = map[status]
	return (
		<Badge variant={entry.variant} className={entry.className}>
			{entry.label}
		</Badge>
	)
}
