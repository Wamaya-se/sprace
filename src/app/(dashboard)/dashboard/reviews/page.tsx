import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getUserReviews } from '@/lib/queries/reviews'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StarRating } from '@/components/ui/star-rating'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return { title: t('reviewsTitle') }
}

export default async function ReviewsPage() {
	const t = await getTranslations('reviews')
	const { received, given } = await getUserReviews()

	return (
		<div className="mx-auto max-w-2xl">
			<p className="font-sans text-base leading-[1.7] text-muted-foreground">
				{t('description')}
			</p>

			{received.length === 0 && given.length === 0 ? (
				<div className="mt-12 text-center">
					<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
						{t('empty')}
					</h2>
					<p className="mt-2 font-sans text-sm text-muted-foreground">
						{t('emptyDescription')}
					</p>
				</div>
			) : (
				<div className="mt-8 space-y-8">
					{received.length > 0 && (
						<section>
							<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
								{t('receivedReviews')}
							</h2>
							<div className="mt-4 space-y-3">
								{received.map((review) => (
									<Card key={review.id}>
										<CardContent className="py-4">
											<div className="flex items-start gap-3">
												<Avatar>
													<AvatarFallback>
														{review.reviewer?.full_name
															?.charAt(0)
															?.toUpperCase() ?? '?'}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<p className="font-sans text-sm font-medium text-foreground">
															{review.reviewer?.full_name ?? ''}
														</p>
														<StarRating
															value={review.rating}
															readonly
															size="sm"
														/>
														<time
															dateTime={review.created_at}
															className="font-sans text-xs text-muted-foreground"
														>
															{new Date(review.created_at).toLocaleDateString(
																undefined,
																{
																	month: 'short',
																	day: 'numeric',
																	year: 'numeric',
																},
															)}
														</time>
													</div>
													{review.booking && (
														<p className="mt-0.5 font-sans text-xs text-muted-foreground">
															{review.booking.title}
														</p>
													)}
													{review.comment && (
														<p className="mt-1 font-sans text-sm text-foreground/60">
															{review.comment}
														</p>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</section>
					)}

					{given.length > 0 && (
						<section>
							<h2 className="font-heading text-lg font-bold tracking-[-0.03em] text-foreground">
								{t('givenReviews')}
							</h2>
							<div className="mt-4 space-y-3">
								{given.map((review) => (
									<Card key={review.id}>
										<CardContent className="py-4">
											<div className="flex items-start gap-3">
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<StarRating
															value={review.rating}
															readonly
															size="sm"
														/>
														<time
															dateTime={review.created_at}
															className="font-sans text-xs text-muted-foreground"
														>
															{new Date(review.created_at).toLocaleDateString(
																undefined,
																{
																	month: 'short',
																	day: 'numeric',
																	year: 'numeric',
																},
															)}
														</time>
													</div>
													{review.booking && (
														<p className="mt-0.5 font-sans text-xs text-muted-foreground">
															{review.booking.title}
														</p>
													)}
													{review.comment && (
														<p className="mt-1 font-sans text-sm text-foreground/60">
															{review.comment}
														</p>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</section>
					)}
				</div>
			)}
		</div>
	)
}
