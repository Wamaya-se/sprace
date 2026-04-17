'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { updatePlatformSettings } from './actions'

interface SettingsFormProps {
	settings: Record<string, string>
}

export function SettingsForm({ settings }: SettingsFormProps) {
	const t = useTranslations('admin')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	const [platformName, setPlatformName] = useState(settings.platform_name || '')
	const [contactEmail, setContactEmail] = useState(settings.contact_email || '')
	const [activeLocales, setActiveLocales] = useState(
		settings.active_locales || '',
	)
	const [supportUrl, setSupportUrl] = useState(settings.support_url || '')
	const [termsUrl, setTermsUrl] = useState(settings.terms_url || '')
	const [privacyUrl, setPrivacyUrl] = useState(settings.privacy_url || '')

	function handleSave() {
		setError(null)
		setSuccess(false)
		startTransition(async () => {
			const result = await updatePlatformSettings([
				{ key: 'platform_name', value: platformName.trim() },
				{ key: 'contact_email', value: contactEmail.trim() },
				{ key: 'active_locales', value: activeLocales.trim() },
				{ key: 'support_url', value: supportUrl.trim() },
				{ key: 'terms_url', value: termsUrl.trim() },
				{ key: 'privacy_url', value: privacyUrl.trim() },
			])

			if (!result.success) {
				setError(t('settingsSaveFailed'))
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

			{/* General settings */}
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

			{/* Links settings */}
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

			{/* Save button */}
			<div className="flex justify-end">
				<Button variant="brand" onClick={handleSave} disabled={isPending}>
					{isPending ? t('savingSettings') : t('saveSettings')}
				</Button>
			</div>
		</div>
	)
}
