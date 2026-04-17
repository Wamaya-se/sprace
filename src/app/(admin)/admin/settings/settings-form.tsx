'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useActionError } from '@/hooks/use-action-error'
import { updatePlatformSettings } from './actions'

interface SettingsFormProps {
	settings: Record<string, string>
}

export function SettingsForm({ settings }: SettingsFormProps) {
	const t = useTranslations('admin')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const translateError = useActionError()
	const [error, setError] = useState<string | null>(null)
	const [errorField, setErrorField] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	const [platformName, setPlatformName] = useState(settings.platform_name || '')
	const [contactEmail, setContactEmail] = useState(settings.contact_email || '')
	const [activeLocales, setActiveLocales] = useState(
		settings.active_locales || '',
	)
	const [supportUrl, setSupportUrl] = useState(settings.support_url || '')
	const [termsUrl, setTermsUrl] = useState(settings.terms_url || '')
	const [privacyUrl, setPrivacyUrl] = useState(settings.privacy_url || '')

	const [legalName, setLegalName] = useState(settings.platform_legal_name || '')
	const [orgNumber, setOrgNumber] = useState(settings.platform_org_number || '')
	const [vatNumber, setVatNumber] = useState(settings.platform_vat_number || '')
	const [addressLine1, setAddressLine1] = useState(
		settings.platform_address_line1 || '',
	)
	const [addressLine2, setAddressLine2] = useState(
		settings.platform_address_line2 || '',
	)
	const [postalCode, setPostalCode] = useState(
		settings.platform_postal_code || '',
	)
	const [city, setCity] = useState(settings.platform_city || '')
	const [countryCode, setCountryCode] = useState(
		settings.platform_country_code || 'SE',
	)
	const [billingEmail, setBillingEmail] = useState(
		settings.platform_billing_email || '',
	)
	const [website, setWebsite] = useState(settings.platform_website || '')

	function handleSave() {
		setError(null)
		setErrorField(null)
		setSuccess(false)
		startTransition(async () => {
			const result = await updatePlatformSettings([
				{ key: 'platform_name', value: platformName.trim() },
				{ key: 'contact_email', value: contactEmail.trim() },
				{ key: 'active_locales', value: activeLocales.trim() },
				{ key: 'support_url', value: supportUrl.trim() },
				{ key: 'terms_url', value: termsUrl.trim() },
				{ key: 'privacy_url', value: privacyUrl.trim() },
				{ key: 'platform_legal_name', value: legalName.trim() },
				{ key: 'platform_org_number', value: orgNumber.trim() },
				{ key: 'platform_vat_number', value: vatNumber.trim() },
				{ key: 'platform_address_line1', value: addressLine1.trim() },
				{ key: 'platform_address_line2', value: addressLine2.trim() },
				{ key: 'platform_postal_code', value: postalCode.trim() },
				{ key: 'platform_city', value: city.trim() },
				{
					key: 'platform_country_code',
					value: countryCode.trim().toUpperCase(),
				},
				{ key: 'platform_billing_email', value: billingEmail.trim() },
				{ key: 'platform_website', value: website.trim() },
			])

			if (!result.success) {
				setError(translateError(result.error) || t('settingsSaveFailed'))
				setErrorField(result.field ?? null)
			} else {
				setSuccess(true)
				router.refresh()
				setTimeout(() => setSuccess(false), 3000)
			}
		})
	}

	return (
		<div className="space-y-6">
			{error && (
				<div role="alert" className="rounded-lg bg-destructive/10 p-3">
					<p className="font-sans text-sm text-destructive">{error}</p>
				</div>
			)}

			{success && (
				<div role="status" className="rounded-lg bg-green-500/10 p-3">
					<p className="font-sans text-sm text-green-400">
						{t('settingsSaved')}
					</p>
				</div>
			)}

			<Card>
				<CardContent>
					<h2 className="font-heading text-base font-bold tracking-[-0.02em] text-foreground">
						{t('settingsGeneral')}
					</h2>

					<div className="mt-4 space-y-4">
						<div>
							<Label htmlFor="platform-name">{t('platformNameLabel')}</Label>
							<Input
								id="platform-name"
								value={platformName}
								onChange={(e) => setPlatformName(e.target.value)}
								className="mt-1.5"
							/>
							<p className="mt-1 font-sans text-xs text-muted-foreground">
								{t('platformNameHint')}
							</p>
						</div>

						<div>
							<Label htmlFor="contact-email">{t('contactEmailLabel')}</Label>
							<Input
								id="contact-email"
								type="email"
								value={contactEmail}
								onChange={(e) => setContactEmail(e.target.value)}
								placeholder="hello@sprace.com"
								className="mt-1.5"
								aria-invalid={errorField === 'contact_email' || undefined}
							/>
							<p className="mt-1 font-sans text-xs text-muted-foreground">
								{t('contactEmailHint')}
							</p>
						</div>

						<div>
							<Label htmlFor="active-locales">{t('activeLocalesLabel')}</Label>
							<Input
								id="active-locales"
								value={activeLocales}
								onChange={(e) => setActiveLocales(e.target.value)}
								placeholder="en, sv"
								className="mt-1.5"
							/>
							<p className="mt-1 font-sans text-xs text-muted-foreground">
								{t('activeLocalesHint')}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<h2 className="font-heading text-base font-bold tracking-[-0.02em] text-foreground">
						{t('settingsPlatformEntity')}
					</h2>
					<p className="mt-1 font-sans text-xs text-muted-foreground">
						{t('settingsPlatformEntityHint')}
					</p>

					<div className="mt-4 space-y-4">
						<div>
							<Label htmlFor="platform-legal-name">
								{t('platformLegalNameLabel')}
							</Label>
							<Input
								id="platform-legal-name"
								value={legalName}
								onChange={(e) => setLegalName(e.target.value)}
								placeholder="Sprace AB"
								className="mt-1.5"
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label htmlFor="platform-org-number">
									{t('platformOrgNumberLabel')}
								</Label>
								<Input
									id="platform-org-number"
									value={orgNumber}
									onChange={(e) => setOrgNumber(e.target.value)}
									placeholder="556123-4567"
									className="mt-1.5"
									aria-invalid={
										errorField === 'platform_org_number' || undefined
									}
								/>
							</div>
							<div>
								<Label htmlFor="platform-vat-number">
									{t('platformVatNumberLabel')}
								</Label>
								<Input
									id="platform-vat-number"
									value={vatNumber}
									onChange={(e) => setVatNumber(e.target.value)}
									placeholder="SE556123456701"
									className="mt-1.5"
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="platform-address-line1">
								{t('platformAddressLine1Label')}
							</Label>
							<Input
								id="platform-address-line1"
								value={addressLine1}
								onChange={(e) => setAddressLine1(e.target.value)}
								className="mt-1.5"
							/>
						</div>
						<div>
							<Label htmlFor="platform-address-line2">
								{t('platformAddressLine2Label')}
							</Label>
							<Input
								id="platform-address-line2"
								value={addressLine2}
								onChange={(e) => setAddressLine2(e.target.value)}
								className="mt-1.5"
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							<div>
								<Label htmlFor="platform-postal-code">
									{t('platformPostalCodeLabel')}
								</Label>
								<Input
									id="platform-postal-code"
									value={postalCode}
									onChange={(e) => setPostalCode(e.target.value)}
									className="mt-1.5"
								/>
							</div>
							<div>
								<Label htmlFor="platform-city">{t('platformCityLabel')}</Label>
								<Input
									id="platform-city"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									className="mt-1.5"
								/>
							</div>
							<div>
								<Label htmlFor="platform-country-code">
									{t('platformCountryCodeLabel')}
								</Label>
								<Input
									id="platform-country-code"
									value={countryCode}
									onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
									maxLength={2}
									placeholder="SE"
									className="mt-1.5"
									aria-invalid={
										errorField === 'platform_country_code' || undefined
									}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="platform-billing-email">
								{t('platformBillingEmailLabel')}
							</Label>
							<Input
								id="platform-billing-email"
								type="email"
								value={billingEmail}
								onChange={(e) => setBillingEmail(e.target.value)}
								placeholder="billing@sprace.com"
								className="mt-1.5"
								aria-invalid={
									errorField === 'platform_billing_email' || undefined
								}
							/>
						</div>

						<div>
							<Label htmlFor="platform-website">
								{t('platformWebsiteLabel')}
							</Label>
							<Input
								id="platform-website"
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
								placeholder="sprace.com"
								className="mt-1.5"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<h2 className="font-heading text-base font-bold tracking-[-0.02em] text-foreground">
						{t('settingsLinks')}
					</h2>

					<div className="mt-4 space-y-4">
						<div>
							<Label htmlFor="support-url">{t('supportUrlLabel')}</Label>
							<Input
								id="support-url"
								type="url"
								value={supportUrl}
								onChange={(e) => setSupportUrl(e.target.value)}
								placeholder="https://help.sprace.com"
								className="mt-1.5"
							/>
							<p className="mt-1 font-sans text-xs text-muted-foreground">
								{t('supportUrlHint')}
							</p>
						</div>

						<Separator />

						<div>
							<Label htmlFor="terms-url">{t('termsUrlLabel')}</Label>
							<Input
								id="terms-url"
								type="url"
								value={termsUrl}
								onChange={(e) => setTermsUrl(e.target.value)}
								placeholder="https://sprace.com/terms"
								className="mt-1.5"
							/>
						</div>

						<div>
							<Label htmlFor="privacy-url">{t('privacyUrlLabel')}</Label>
							<Input
								id="privacy-url"
								type="url"
								value={privacyUrl}
								onChange={(e) => setPrivacyUrl(e.target.value)}
								placeholder="https://sprace.com/privacy"
								className="mt-1.5"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button variant="brand" onClick={handleSave} disabled={isPending}>
					{isPending ? t('savingSettings') : t('saveSettings')}
				</Button>
			</div>
		</div>
	)
}
