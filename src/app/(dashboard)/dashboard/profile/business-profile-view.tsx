'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateBusinessInfo, updateBusinessContact } from './business-actions'
import {
	BusinessBillingSection,
	type BusinessBillingData,
} from './business-billing-section'

interface BusinessData {
	id: string
	company_name: string
	org_number: string | null
	website: string | null
	industry: string | null
	contact_email: string | null
}

interface BusinessProfileViewProps {
	business: BusinessData
	billing: BusinessBillingData
	isBillingComplete: boolean
}

type EditingSection = 'info' | 'contact' | null

export function BusinessProfileView({
	business,
	billing,
	isBillingComplete,
}: BusinessProfileViewProps) {
	const t = useTranslations('dashboard')
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [editing, setEditing] = useState<EditingSection>(null)
	const [error, setError] = useState<string | null>(null)

	const [companyName, setCompanyName] = useState(business.company_name)
	const [orgNumber, setOrgNumber] = useState(business.org_number || '')
	const [industry, setIndustry] = useState(business.industry || '')

	const [website, setWebsite] = useState(business.website || '')
	const [contactEmail, setContactEmail] = useState(business.contact_email || '')

	const startEdit = useCallback((section: EditingSection) => {
		setEditing(section)
		setError(null)
	}, [])

	const cancelEdit = useCallback(() => {
		setCompanyName(business.company_name)
		setOrgNumber(business.org_number || '')
		setIndustry(business.industry || '')
		setWebsite(business.website || '')
		setContactEmail(business.contact_email || '')
		setEditing(null)
		setError(null)
	}, [business])

	function handleSave() {
		setError(null)
		startTransition(async () => {
			let result

			switch (editing) {
				case 'info':
					result = await updateBusinessInfo(
						companyName.trim(),
						orgNumber.trim(),
						industry.trim(),
					)
					if (!result.success) {
						setError(t('companyInfoSaveFailed'))
					}
					break
				case 'contact':
					result = await updateBusinessContact(
						website.trim(),
						contactEmail.trim(),
					)
					if (!result.success) {
						setError(t('companyContactSaveFailed'))
					}
					break
				default:
					return
			}

			if (result?.success) {
				setEditing(null)
				router.refresh()
			}
		})
	}

	const isNewBusiness = !business.company_name || business.company_name === ''

	if (isNewBusiness) {
		return (
			<div className="mx-auto max-w-lg space-y-6">
				<Card>
					<CardContent className="space-y-4 py-8 text-center">
						<h2 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground">
							{t('completeCompanyTitle')}
						</h2>
						<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
							{t('completeCompanyDescription')}
						</p>
						<Button
							variant="brand"
							onClick={() => startEdit('info')}
							className="mt-2"
						>
							{t('completeCompanyCta')}
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-lg space-y-4">
			{/* Header */}
			<div className="flex items-center gap-4">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest">
					<span className="font-heading text-xl font-bold text-brand">
						{business.company_name.charAt(0).toUpperCase()}
					</span>
				</div>
				<div className="min-w-0 flex-1">
					<h2 className="truncate font-heading text-lg font-bold tracking-[-0.02em] text-foreground">
						{business.company_name}
					</h2>
					{business.industry && (
						<p className="font-sans text-xs text-muted-foreground">
							{business.industry}
						</p>
					)}
				</div>
			</div>

			{error && (
				<div role="alert" className="rounded-lg bg-destructive/10 p-3">
					<p className="font-sans text-sm text-destructive">{error}</p>
				</div>
			)}

			{/* Company info section */}
			<Card>
				<CardContent>
					<SectionHeader
						title={t('sectionCompanyInfo')}
						isEditing={editing === 'info'}
						onEdit={() => startEdit('info')}
						onSave={handleSave}
						onCancel={cancelEdit}
						isPending={isPending}
						editLabel={t('editSection')}
						saveLabel={isPending ? t('savingSection') : t('saveSection')}
						cancelLabel={t('cancelEdit')}
						disabled={editing !== null && editing !== 'info'}
						canSave={!!companyName.trim()}
					/>

					{editing === 'info' ? (
						<div className="mt-4 space-y-4">
							<div>
								<Label htmlFor="edit-company-name">
									{t('companyNameLabel')}
								</Label>
								<Input
									id="edit-company-name"
									value={companyName}
									onChange={(e) => setCompanyName(e.target.value)}
									placeholder={t('companyNamePlaceholder')}
									className="mt-1.5"
								/>
							</div>
							<div>
								<Label htmlFor="edit-org-number">{t('orgNumberLabel')}</Label>
								<Input
									id="edit-org-number"
									value={orgNumber}
									onChange={(e) => setOrgNumber(e.target.value)}
									placeholder={t('orgNumberPlaceholder')}
									className="mt-1.5"
								/>
							</div>
							<div>
								<Label htmlFor="edit-industry">{t('industryLabel')}</Label>
								<Input
									id="edit-industry"
									value={industry}
									onChange={(e) => setIndustry(e.target.value)}
									placeholder={t('industryPlaceholder')}
									className="mt-1.5"
								/>
							</div>
						</div>
					) : (
						<div className="mt-3 space-y-2">
							<div className="flex justify-between">
								<span className="font-sans text-xs text-muted-foreground">
									{t('companyNameLabel')}
								</span>
								<span className="font-sans text-sm text-foreground/70">
									{business.company_name}
								</span>
							</div>
							{business.org_number && (
								<div className="flex justify-between">
									<span className="font-sans text-xs text-muted-foreground">
										{t('orgNumberLabel')}
									</span>
									<span className="font-sans text-sm text-foreground/70">
										{business.org_number}
									</span>
								</div>
							)}
							{business.industry && (
								<div className="flex justify-between">
									<span className="font-sans text-xs text-muted-foreground">
										{t('industryLabel')}
									</span>
									<span className="font-sans text-sm text-foreground/70">
										{business.industry}
									</span>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			<BusinessBillingSection
				business={billing}
				isComplete={isBillingComplete}
			/>

			{/* Contact & web section */}
			<Card>
				<CardContent>
					<SectionHeader
						title={t('sectionCompanyContact')}
						isEditing={editing === 'contact'}
						onEdit={() => startEdit('contact')}
						onSave={handleSave}
						onCancel={cancelEdit}
						isPending={isPending}
						editLabel={t('editSection')}
						saveLabel={isPending ? t('savingSection') : t('saveSection')}
						cancelLabel={t('cancelEdit')}
						disabled={editing !== null && editing !== 'contact'}
						canSave={true}
					/>

					{editing === 'contact' ? (
						<div className="mt-4 space-y-4">
							<div>
								<Label htmlFor="edit-website">{t('websiteLabel')}</Label>
								<Input
									id="edit-website"
									type="url"
									value={website}
									onChange={(e) => setWebsite(e.target.value)}
									placeholder={t('websitePlaceholder')}
									className="mt-1.5"
								/>
							</div>
							<div>
								<Label htmlFor="edit-contact-email">
									{t('contactEmailLabel')}
								</Label>
								<Input
									id="edit-contact-email"
									type="email"
									value={contactEmail}
									onChange={(e) => setContactEmail(e.target.value)}
									placeholder={t('contactEmailPlaceholder')}
									className="mt-1.5"
								/>
							</div>
						</div>
					) : (
						<div className="mt-3 space-y-2">
							{business.website ? (
								<div className="flex justify-between">
									<span className="font-sans text-xs text-muted-foreground">
										{t('websiteLabel')}
									</span>
									<a
										href={business.website}
										target="_blank"
										rel="noopener noreferrer"
										className="truncate font-sans text-sm text-brand hover:underline"
									>
										{business.website}
									</a>
								</div>
							) : null}
							{business.contact_email ? (
								<div className="flex justify-between">
									<span className="font-sans text-xs text-muted-foreground">
										{t('contactEmailLabel')}
									</span>
									<span className="font-sans text-sm text-foreground/70">
										{business.contact_email}
									</span>
								</div>
							) : null}
							{!business.website && !business.contact_email && (
								<p className="font-sans text-sm text-muted-foreground">
									{t('companyProfileComingSoon')}
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

interface SectionHeaderProps {
	title: string
	isEditing: boolean
	onEdit: () => void
	onSave: () => void
	onCancel: () => void
	isPending: boolean
	editLabel: string
	saveLabel: string
	cancelLabel: string
	disabled: boolean
	canSave: boolean
}

function SectionHeader({
	title,
	isEditing,
	onEdit,
	onSave,
	onCancel,
	isPending,
	editLabel,
	saveLabel,
	cancelLabel,
	disabled,
	canSave,
}: SectionHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<h3 className="font-heading text-base font-bold tracking-[-0.02em] text-foreground">
				{title}
			</h3>
			{isEditing ? (
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="xs"
						onClick={onCancel}
						disabled={isPending}
					>
						{cancelLabel}
					</Button>
					<Button
						variant="brand"
						size="xs"
						onClick={onSave}
						disabled={isPending || !canSave}
					>
						{saveLabel}
					</Button>
				</div>
			) : (
				<Button variant="ghost" size="xs" onClick={onEdit} disabled={disabled}>
					{editLabel}
				</Button>
			)}
		</div>
	)
}
