import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SaveCreatorButton } from '@/components/dashboard/save-creator-button'
import { StarRating } from '@/components/ui/star-rating'

export interface CreatorCardData {
	id: string
	display_name: string
	bio: string | null
	hourly_rate: number | null
	followers_count: number | null
	slug: string | null
	avatar_url: string | null
	specialties: { id: string; name: string; slug: string }[]
	markets: {
		id: string
		name: string
		slug: string
		flag_emoji: string | null
	}[]
	averageRating?: number | null
	totalReviews?: number
}

interface CreatorCardProps {
	creator: CreatorCardData
	isSaved?: boolean
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

export async function CreatorCard({
	creator,
	isSaved = false,
}: CreatorCardProps) {
	const t = await getTranslations('discover')

	return (
		<div className="group relative">
			<Link
				href={`/dashboard/discover/${creator.slug}`}
				className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/40 focus-visible:rounded-xl"
			>
				<Card className="h-full bg-surface-container transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:bg-surface-container-high">
					<CardContent className="flex flex-col gap-4 p-5">
						<div className="flex items-start gap-4">
							<Avatar className="size-14">
								{creator.avatar_url ? (
									<AvatarImage
										src={creator.avatar_url}
										alt={creator.display_name}
									/>
								) : null}
								<AvatarFallback className="text-base">
									{getInitials(creator.display_name)}
								</AvatarFallback>
							</Avatar>

							<div className="min-w-0 flex-1">
								<h2 className="truncate pr-8 font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
									{creator.display_name}
								</h2>

								<div className="mt-1 flex flex-wrap items-center gap-3 font-sans text-xs text-muted-foreground">
									{creator.averageRating != null &&
										(creator.totalReviews ?? 0) > 0 && (
											<span className="flex items-center gap-1">
												<StarRating
													value={Math.round(creator.averageRating)}
													readonly
													size="sm"
												/>
												<span>{creator.averageRating.toFixed(1)}</span>
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
								</div>
							</div>
						</div>

						{creator.bio && (
							<p className="line-clamp-2 font-sans text-sm leading-[1.7] text-muted-foreground">
								{creator.bio}
							</p>
						)}

						{creator.specialties.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{creator.specialties.slice(0, 3).map((spec) => (
									<Badge
										key={spec.id}
										variant="secondary"
										className="text-[11px]"
									>
										{spec.name}
									</Badge>
								))}
								{creator.specialties.length > 3 && (
									<Badge variant="outline" className="text-[11px]">
										+{creator.specialties.length - 3}
									</Badge>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</Link>

			<div className="absolute top-4 right-4 z-10">
				<SaveCreatorButton creatorId={creator.id} initialSaved={isSaved} />
			</div>
		</div>
	)
}
