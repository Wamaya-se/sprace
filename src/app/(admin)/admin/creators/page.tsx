import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ReviewActions } from './components/review-actions'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: t('adminCreatorsTitle'),
	}
}

export default async function AdminCreatorsPage() {
	const t = await getTranslations('admin')
	const supabase = await createClient()

	const { data: pendingCreators } = await supabase
		.from('creators')
		.select(
			'id, display_name, bio, status, created_at, profile_id, profiles(email), creator_specialties(specialties(name))',
		)
		.eq('status', 'pending_review')
		.order('created_at', { ascending: true })

	const creatorsWithEmail = (pendingCreators ?? []).map((creator) => ({
		id: creator.id,
		profileId: creator.profile_id,
		displayName: creator.display_name,
		bio: creator.bio,
		email: (creator.profiles as unknown as { email: string })?.email ?? '',
		createdAt: creator.created_at,
		specialties:
			(
				creator.creator_specialties as unknown as {
					specialties: { name: string }
				}[]
			)
				?.map((cs) => cs.specialties?.name)
				.filter(Boolean) ?? [],
	}))

	return (
		<div className="mx-auto max-w-4xl">
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('creatorsDescription')}
			</p>

			<div className="mt-2 flex items-center gap-2">
				<Badge variant="secondary">
					{t('pendingReview')}: {creatorsWithEmail.length}
				</Badge>
			</div>

			{creatorsWithEmail.length === 0 ? (
				<Card className="mt-6">
					<CardContent className="py-12 text-center">
						<p className="font-sans text-sm text-muted-foreground">
							{t('reviewQueueEmpty')}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="mt-6 space-y-3">
					{creatorsWithEmail.map((creator) => (
						<Card key={creator.id}>
							<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<h2 className="truncate font-heading text-base font-bold tracking-[-0.02em] text-foreground">
											{creator.displayName}
										</h2>
										<Badge variant="secondary">
											{t('statusPendingReview')}
										</Badge>
									</div>
									<p className="mt-0.5 font-sans text-xs text-muted-foreground">
										{creator.email}
										{' · '}
										{t('joined')}: {formatDate(creator.createdAt)}
									</p>
									{creator.bio && (
										<p className="mt-2 line-clamp-2 font-sans text-sm leading-[1.7] text-foreground/60">
											{creator.bio}
										</p>
									)}
									{creator.specialties.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-1">
											{creator.specialties.map((s) => (
												<Badge key={s} variant="outline">
													{s}
												</Badge>
											))}
										</div>
									)}
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<Button variant="ghost" size="sm" asChild>
										<Link href={`/admin/users/${creator.profileId}`}>
											{t('viewUser')}
										</Link>
									</Button>
									<ReviewActions creatorId={creator.id} />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}
