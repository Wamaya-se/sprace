import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import { StarRating } from '@/components/ui/star-rating'
import { CreatorServiceCard } from '@/components/shared/creator-service-card'
import { SocialLink } from '@/components/shared/social-link'

interface CreatorData {
	id: string
	display_name: string
	bio: string | null
	portfolio_url: string | null
	instagram_handle: string | null
	tiktok_handle: string | null
	youtube_handle: string | null
	followers_count: number | null
	hourly_rate: number | null
	slug: string | null
	status: string
	created_at: string
	profile: { avatar_url: string | null }
	specialties: { id: string; name: string; slug: string }[]
	markets: {
		id: string
		name: string
		slug: string
		flag_emoji: string | null
	}[]
	services: {
		id: string
		name: string
		description: string | null
		price: number
		delivery_days: number
		is_active: boolean
		sort_order: number
		media: {
			id: string
			media_url: string
			media_type: string
			sort_order: number
		}[]
	}[]
}

interface ReviewData {
	id: string
	rating: number
	comment: string | null
	created_at: string
	reviewer: {
		id: string
		full_name: string | null
		avatar_url: string | null
	} | null
}

interface CreatorPublicProfileProps {
	creator: CreatorData
	backLink?: { href: string; label: string }
	isCompact?: boolean
	saveButton?: React.ReactNode
	contactButton?: React.ReactNode
	reviews?: ReviewData[]
	averageRating?: number | null
	totalReviews?: number
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2)
}

function formatFollowers(count: number): string {
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
	if (count >= 1_000)
		return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`
	return count.toString()
}

export async function CreatorPublicProfile({
	creator,
	backLink,
	isCompact,
	saveButton,
	contactButton,
	reviews = [],
	averageRating = null,
	totalReviews = 0,
}: CreatorPublicProfileProps) {
	const t = await getTranslations('creatorProfile')

	const hasSocialLinks =
		creator.instagram_handle || creator.tiktok_handle || creator.youtube_handle

	return (
		<article className={isCompact ? 'pb-16' : 'pb-32'}>
			{/* Hero section */}
			<section
				className={`relative overflow-hidden ${isCompact ? '' : 'pt-16'}`}
			>
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />

				<div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
					{/* Breadcrumb / back link */}
					<nav aria-label={t('breadcrumbAria')} className="mb-10">
						<ol className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
							<li>
								<Link
									href={backLink?.href ?? '/'}
									className="hover:text-foreground/70"
								>
									{backLink?.label ?? t('breadcrumbHome')}
								</Link>
							</li>
							<li aria-hidden="true">/</li>
							<li>
								<span className="text-foreground/70">
									{creator.display_name}
								</span>
							</li>
						</ol>
					</nav>

					<div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
						{/* Avatar */}
						<div className="shrink-0">
							<Avatar className="size-28 md:size-36">
								{creator.profile.avatar_url ? (
									<AvatarImage
										src={creator.profile.avatar_url}
										alt={creator.display_name}
									/>
								) : null}
								<AvatarFallback className="text-2xl md:text-3xl">
									{getInitials(creator.display_name)}
								</AvatarFallback>
							</Avatar>
						</div>

						{/* Info */}
						<div className="flex-1">
							<div className="flex flex-wrap items-center gap-3">
								<h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl">
									{creator.display_name}
								</h1>
								{creator.status === 'active' && (
									<Badge variant="default" className="gap-1.5">
										<svg
											width="12"
											height="12"
											viewBox="0 0 12 12"
											fill="none"
											aria-hidden="true"
										>
											<path
												d="M10 3L4.5 8.5L2 6"
												stroke="currentColor"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										{t('active')}
									</Badge>
								)}
							</div>

							{/* Specialties */}
							{creator.specialties.length > 0 && (
								<div className="mt-4 flex flex-wrap gap-2">
									{creator.specialties.map((spec) => (
										<Badge key={spec.id} variant="secondary">
											{spec.name}
										</Badge>
									))}
								</div>
							)}

							{/* Quick stats */}
							<div className="mt-6 flex flex-wrap items-center gap-6 font-sans text-sm text-muted-foreground">
								{averageRating != null && totalReviews > 0 && (
									<span className="flex items-center gap-1.5">
										<StarRating
											value={Math.round(averageRating)}
											readonly
											size="sm"
										/>
										<span>
											{averageRating.toFixed(1)} ({totalReviews})
										</span>
									</span>
								)}
								{(creator.followers_count ?? 0) > 0 && (
									<span>
										{t('followers', {
											count: formatFollowers(creator.followers_count ?? 0),
										})}
									</span>
								)}
								{creator.hourly_rate && (
									<span>
										{creator.hourly_rate} SEK{t('perHour')}
									</span>
								)}
								{creator.markets.length > 0 && (
									<span>
										{creator.markets
											.map((m) => m.flag_emoji || m.name)
											.join(' ')}
									</span>
								)}
								<span>
									{t('memberSince', { date: formatDate(creator.created_at) })}
								</span>
							</div>

							{/* CTA */}
							<div className="mt-8 flex flex-wrap items-center gap-3">
								{contactButton ?? (
									<Button size="lg">{t('contactCreator')}</Button>
								)}
								{creator.portfolio_url && (
									<Button asChild variant="secondary" size="lg">
										<a
											href={creator.portfolio_url}
											target="_blank"
											rel="noopener noreferrer"
										>
											{t('viewPortfolio')}
										</a>
									</Button>
								)}
								{saveButton}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Content sections */}
			<div className="mx-auto max-w-7xl px-6">
				<div className="grid gap-12 pt-16 lg:grid-cols-[1fr_340px]">
					{/* Main content */}
					<div className="space-y-16">
						{/* About */}
						<section>
							<h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
								{t('about')}
							</h2>
							<div className="mt-4">
								{creator.bio ? (
									<p className="whitespace-pre-line font-sans text-base leading-[1.7] text-foreground/70">
										{creator.bio}
									</p>
								) : (
									<p className="font-sans text-base leading-[1.7] text-muted-foreground italic">
										{t('noBio')}
									</p>
								)}
							</div>
						</section>

						{/* Services */}
						{creator.services.length > 0 && (
							<section>
								<h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
									{t('services')}
								</h2>
								<div className="mt-6 grid gap-4 sm:grid-cols-2">
									{creator.services.map((service) => (
										<CreatorServiceCard key={service.id} service={service} />
									))}
								</div>
							</section>
						)}
						{/* Reviews */}
						{reviews.length > 0 && (
							<section>
								<div className="flex items-center gap-3">
									<h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground">
										{t('reviews') || 'Reviews'}
									</h2>
									{averageRating != null && (
										<span className="flex items-center gap-1.5 font-sans text-sm text-muted-foreground">
											<StarRating
												value={Math.round(averageRating)}
												readonly
												size="sm"
											/>
											{averageRating.toFixed(1)}
										</span>
									)}
								</div>
								<div className="mt-6 space-y-4">
									{reviews.map((review) => (
										<Card key={review.id} className="bg-surface-container">
											<CardContent className="flex items-start gap-4 p-5">
												<Avatar className="size-10">
													{review.reviewer?.avatar_url ? (
														<AvatarImage
															src={review.reviewer.avatar_url}
															alt={review.reviewer.full_name ?? ''}
														/>
													) : null}
													<AvatarFallback>
														{review.reviewer?.full_name
															?.charAt(0)
															?.toUpperCase() ?? '?'}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<span className="font-sans text-sm font-medium text-foreground">
															{review.reviewer?.full_name ?? ''}
														</span>
														<StarRating
															value={review.rating}
															readonly
															size="sm"
														/>
													</div>
													{review.comment && (
														<p className="mt-1 font-sans text-sm leading-[1.7] text-foreground/60">
															{review.comment}
														</p>
													)}
													<p className="mt-1 font-sans text-xs text-muted-foreground">
														{formatDate(review.created_at)}
													</p>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</section>
						)}
					</div>

					{/* Sidebar */}
					<aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
						{/* Rates & info card */}
						<Card className="bg-surface-container p-6">
							<CardContent className="space-y-5 p-0">
								<h3 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
									{t('ratesAndInfo')}
								</h3>

								{creator.hourly_rate && (
									<div>
										<span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
											{t('hourlyRate')}
										</span>
										<p className="mt-1 font-heading text-xl font-bold tracking-[-0.03em] text-brand">
											{creator.hourly_rate} SEK{t('perHour')}
										</p>
									</div>
								)}

								{creator.services.length > 0 && (
									<div>
										<span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
											{t('services')}
										</span>
										<p className="mt-1 font-sans text-sm text-foreground/70">
											{t('priceFrom', {
												price: Math.min(
													...creator.services.map((s) => s.price),
												).toLocaleString('sv-SE'),
											})}
										</p>
									</div>
								)}

								<Separator />

								{/* Markets */}
								{creator.markets.length > 0 && (
									<div>
										<span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
											{t('markets')}
										</span>
										<div className="mt-2 flex flex-wrap gap-2">
											{creator.markets.map((market) => (
												<Badge key={market.id} variant="outline">
													{market.flag_emoji && (
														<span>{market.flag_emoji}</span>
													)}
													{market.name}
												</Badge>
											))}
										</div>
									</div>
								)}

								{/* Social links */}
								{hasSocialLinks && (
									<>
										<Separator />
										<div>
											<span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
												{t('socialLinks')}
											</span>
											<div className="mt-3 space-y-2">
												{creator.instagram_handle && (
													<SocialLink
														platform="Instagram"
														handle={creator.instagram_handle}
														href={`https://instagram.com/${creator.instagram_handle}`}
													/>
												)}
												{creator.tiktok_handle && (
													<SocialLink
														platform="TikTok"
														handle={creator.tiktok_handle}
														href={`https://tiktok.com/@${creator.tiktok_handle}`}
													/>
												)}
												{creator.youtube_handle && (
													<SocialLink
														platform="YouTube"
														handle={creator.youtube_handle}
														href={`https://youtube.com/@${creator.youtube_handle}`}
													/>
												)}
											</div>
										</div>
									</>
								)}
							</CardContent>
						</Card>
					</aside>
				</div>
			</div>
		</article>
	)
}
