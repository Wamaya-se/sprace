import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('adminSettingsTitle'),
	}
}

export default async function AdminSettingsPage() {
	const t = await getTranslations('admin')
	const supabase = await createClient()

	const { data: rows } = await supabase
		.from('platform_settings')
		.select('key, value')
		.in('key', [
			'platform_name',
			'contact_email',
			'active_locales',
			'support_url',
			'terms_url',
			'privacy_url',
			'platform_legal_name',
			'platform_org_number',
			'platform_vat_number',
			'platform_address_line1',
			'platform_address_line2',
			'platform_postal_code',
			'platform_city',
			'platform_country_code',
			'platform_billing_email',
			'platform_website',
		])

	const settings: Record<string, string> = {}
	for (const row of rows || []) {
		settings[row.key] = row.value
	}

	return (
		<div className="mx-auto max-w-2xl">
			<p className="mb-6 font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('platformSettingsDescription')}
			</p>

			<SettingsForm settings={settings} />
		</div>
	)
}
