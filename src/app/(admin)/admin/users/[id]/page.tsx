import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UserActions } from './components/user-actions'
import {
	BusinessVerificationPanel,
	type BusinessVerificationData,
} from './components/business-verification'
import { isValidOrgNumber } from '@/lib/validation/se-identifiers'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('adminUserDetailTitle'),
	}
}

interface UserDetailPageProps {
	params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
	const { id } = await params
	const t = await getTranslations('admin')
	const supabase = await createClient()

	const {
		data: { user: currentUser },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !currentUser) {
		redirect('/login')
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select(
			'id, full_name, email, role, avatar_url, preferred_locale, created_at',
		)
		.eq('id', id)
		.single()

	if (!profile) {
		notFound()
	}

	const isSelf = currentUser.id === profile.id

	let creatorData: {
		id: string
		displayName: string
		bio: string | null
		portfolioUrl: string | null
		instagramHandle: string | null
		tiktokHandle: string | null
		youtubeHandle: string | null
		followersCount: number | null
		hourlyRate: number | null
		slug: string | null
		status: 'draft' | 'pending_review' | 'active' | 'suspended'
		specialties: string[]
		markets: string[]
		servicesCount: number
	} | null = null

	let businessData: {
		companyName: string
		orgNumber: string | null
		website: string | null
		industry: string | null
		contactEmail: string | null
	} | null = null

	let businessVerification: BusinessVerificationData | null = null

	if (profile.role === 'creator') {
		const { data: creator } = await supabase
			.from('creators')
			.select(
				'id, display_name, bio, portfolio_url, instagram_handle, tiktok_handle, youtube_handle, followers_count, hourly_rate, slug, status',
			)
			.eq('profile_id', profile.id)
			.single()

		if (creator) {
			const [specialtiesRes, marketsRes, servicesRes] = await Promise.all([
				supabase
					.from('creator_specialties')
					.select('specialty_id, specialties(name)')
					.eq('creator_id', creator.id),
				supabase
					.from('creator_markets')
					.select('market_id, markets(name)')
					.eq('creator_id', creator.id),
				supabase
					.from('services')
					.select('id', { count: 'exact', head: true })
					.eq('creator_id', creator.id),
			])

			creatorData = {
				id: creator.id,
				displayName: creator.display_name,
				bio: creator.bio,
				portfolioUrl: creator.portfolio_url,
				instagramHandle: creator.instagram_handle,
				tiktokHandle: creator.tiktok_handle,
				youtubeHandle: creator.youtube_handle,
				followersCount: creator.followers_count,
				hourlyRate: creator.hourly_rate,
				slug: creator.slug,
				status: creator.status,
				specialties: (specialtiesRes.data ?? [])
					.map(
						(s) => (s.specialties as unknown as { name: string })?.name ?? '',
					)
					.filter(Boolean),
				markets: (marketsRes.data ?? [])
					.map((m) => (m.markets as unknown as { name: string })?.name ?? '')
					.filter(Boolean),
				servicesCount: servicesRes.count ?? 0,
			}
		}
	}

	if (profile.role === 'business') {
		const { data: business } = await supabase
			.from('businesses')
			.select(
				'id, company_name, org_number, website, industry, contact_email, org_number_verification, org_number_verified_at, org_number_verification_note',
			)
			.eq('profile_id', profile.id)
			.single()

		if (business) {
			businessData = {
				companyName: business.company_name,
				orgNumber: business.org_number,
				website: business.website,
				industry: business.industry,
				contactEmail: business.contact_email,
			}
			businessVerification = {
				businessId: business.id,
				orgNumber: business.org_number,
				orgNumberVerification: business.org_number_verification,
				orgNumberVerifiedAt: business.org_number_verified_at,
				orgNumberVerificationNote: business.org_number_verification_note,
				isOrgNumberFormatValid: business.org_number
					? isValidOrgNumber(business.org_number)
					: false,
			}
		}
	}

	const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> =
		{
			creator: 'default',
			business: 'secondary',
			admin: 'outline',
		}

	const statusBadgeVariant: Record<
		string,
		'default' | 'secondary' | 'outline'
	> = {
		draft: 'outline',
		pending_review: 'secondary',
		active: 'default',
		suspended: 'outline',
	}

	const roleLabel: Record<string, string> = {
		creator: t('roleCreator'),
		business: t('roleBusiness'),
		admin: t('roleAdmin'),
	}

	const statusLabel: Record<string, string> = {
		draft: t('statusDraft'),
		pending_review: t('statusPendingReview'),
		active: t('statusActive'),
		suspended: t('statusSuspended'),
	}

	return (
		<div className="mx-auto max-w-3xl">
			<Button variant="ghost" size="sm" asChild className="mb-6">
				<Link href="/admin/users">
					<svg
						className="mr-1 h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={1.5}
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15.75 19.5L8.25 12l7.5-7.5"
						/>
					</svg>
					{t('backToUsers')}
				</Link>
			</Button>

			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground">
						{profile.full_name || profile.email}
					</h2>
					<p className="mt-1 font-sans text-sm text-muted-foreground">
						{profile.email}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant={roleBadgeVariant[profile.role]}>
						{roleLabel[profile.role]}
					</Badge>
					{creatorData && (
						<Badge variant={statusBadgeVariant[creatorData.status]}>
							{statusLabel[creatorData.status]}
						</Badge>
					)}
				</div>
			</div>

			<Separator className="my-6" />

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardContent>
						<h3 className="font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
							{t('profileInfo')}
						</h3>
						<dl className="mt-4 space-y-3">
							<div>
								<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
									{t('name')}
								</dt>
								<dd className="mt-0.5 font-sans text-sm text-foreground/70">
									{profile.full_name || t('notSet')}
								</dd>
							</div>
							<div>
								<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
									{t('email')}
								</dt>
								<dd className="mt-0.5 font-sans text-sm text-foreground/70">
									{profile.email}
								</dd>
							</div>
							<div>
								<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
									{t('joined')}
								</dt>
								<dd className="mt-0.5 font-sans text-sm text-foreground/70">
									{formatDate(profile.created_at)}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				{creatorData && (
					<Card>
						<CardContent>
							<h3 className="font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
								{t('creatorInfo')}
							</h3>
							<dl className="mt-4 space-y-3">
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('displayName')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{creatorData.displayName}
									</dd>
								</div>
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('bio')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{creatorData.bio || t('noBio')}
									</dd>
								</div>
								{creatorData.slug && (
									<div>
										<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
											{t('slug')}
										</dt>
										<dd className="mt-0.5 font-sans text-sm text-foreground/70">
											{creatorData.slug}
										</dd>
									</div>
								)}
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('hourlyRate')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{creatorData.hourlyRate
											? `${creatorData.hourlyRate} SEK`
											: t('notSet')}
									</dd>
								</div>
								{creatorData.specialties.length > 0 && (
									<div>
										<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
											{t('specialties')}
										</dt>
										<dd className="mt-1.5 flex flex-wrap gap-1">
											{creatorData.specialties.map((s) => (
												<Badge key={s} variant="outline">
													{s}
												</Badge>
											))}
										</dd>
									</div>
								)}
								{creatorData.markets.length > 0 && (
									<div>
										<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
											{t('markets')}
										</dt>
										<dd className="mt-1.5 flex flex-wrap gap-1">
											{creatorData.markets.map((m) => (
												<Badge key={m} variant="outline">
													{m}
												</Badge>
											))}
										</dd>
									</div>
								)}
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('servicesCount')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{creatorData.servicesCount}
									</dd>
								</div>
								{(creatorData.instagramHandle ||
									creatorData.tiktokHandle ||
									creatorData.youtubeHandle) && (
									<div>
										<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
											{t('socialLinks')}
										</dt>
										<dd className="mt-1 space-y-1">
											{creatorData.instagramHandle && (
												<p className="font-sans text-sm text-foreground/70">
													Instagram: @{creatorData.instagramHandle}
												</p>
											)}
											{creatorData.tiktokHandle && (
												<p className="font-sans text-sm text-foreground/70">
													TikTok: @{creatorData.tiktokHandle}
												</p>
											)}
											{creatorData.youtubeHandle && (
												<p className="font-sans text-sm text-foreground/70">
													YouTube: @{creatorData.youtubeHandle}
												</p>
											)}
										</dd>
									</div>
								)}
								{creatorData.portfolioUrl && (
									<div>
										<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
											{t('portfolioUrl')}
										</dt>
										<dd className="mt-0.5 font-sans text-sm text-brand">
											<a
												href={creatorData.portfolioUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												{creatorData.portfolioUrl}
											</a>
										</dd>
									</div>
								)}
							</dl>
						</CardContent>
					</Card>
				)}

				{businessData && (
					<Card>
						<CardContent>
							<h3 className="font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
								{t('businessInfo')}
							</h3>
							<dl className="mt-4 space-y-3">
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('companyName')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{businessData.companyName}
									</dd>
								</div>
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('orgNumber')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{businessData.orgNumber || t('notSet')}
									</dd>
								</div>
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('website')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{businessData.website ? (
											<a
												href={businessData.website}
												target="_blank"
												rel="noopener noreferrer"
												className="text-brand"
											>
												{businessData.website}
											</a>
										) : (
											t('notSet')
										)}
									</dd>
								</div>
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('industry')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{businessData.industry || t('notSet')}
									</dd>
								</div>
								<div>
									<dt className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
										{t('contactEmail')}
									</dt>
									<dd className="mt-0.5 font-sans text-sm text-foreground/70">
										{businessData.contactEmail || t('notSet')}
									</dd>
								</div>
							</dl>
						</CardContent>
					</Card>
				)}
			</div>

			<Separator className="my-8" />

			<Card>
				<CardContent>
					<h3 className="mb-4 font-heading text-sm font-semibold tracking-[-0.02em] text-foreground">
						{t('actions')}
					</h3>
					<UserActions
						userId={profile.id}
						currentRole={profile.role}
						creatorId={creatorData?.id}
						creatorStatus={creatorData?.status}
						isSelf={isSelf}
					/>
					{businessVerification && (
						<BusinessVerificationPanel data={businessVerification} />
					)}
				</CardContent>
			</Card>
		</div>
	)
}
