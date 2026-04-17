'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StarRating } from '@/components/ui/star-rating'
import { createReview } from '@/lib/actions/reviews'
import type { ReviewItem } from '@/lib/actions/reviews'

interface ReviewSectionProps {
	bookingId: string
	existingReviews: ReviewItem[]
	hasReviewed: boolean
	completedAt: string
}

const REVIEW_WINDOW_DAYS = 14

export function ReviewSection({
	bookingId,
	existingReviews,
	hasReviewed,
	completedAt,
}: ReviewSectionProps) {
	const t = useTranslations('reviews')
	const [isPending, startTransition] = useTransition()
	const [rating, setRating] = useState(0)
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()

	const [daysSinceCompleted] = useState(() =>
		Math.floor(
			(Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24),
		),
	)
	const canReview = !hasReviewed && daysSinceCompleted <= REVIEW_WINDOW_DAYS

	function handleSubmit(formData: FormData) {
		if (rating === 0) {
			setError(t('ratingRequired'))
			return
		}
		setError(null)
		formData.set('rating', String(rating))
		startTransition(async () => {
			const result = await createReview(formData)
			if (result.success) {
				router.refresh()
			} else {
				setError(t('submitFailed'))
			}
		})
	}

	return (
		<div className="space-y-4">
			{canReview && (
				<Card>
					<CardContent>
						<h3 className="font-heading text-base font-bold tracking-[-0.03em] text-foreground">
							{t('reviewWindowTitle')}
						</h3>
						<p className="mt-1 font-sans text-sm text-muted-foreground">
							{t('reviewWindowDescription')}
						</p>

						<form action={handleSubmit} className="mt-4 space-y-4">
							<input type="hidden" name="bookingId" value={bookingId} />
							<div>
								<Label htmlFor="rating">{t('ratingLabel')}</Label>
								<div
									className="mt-1.5"
									aria-invalid={!!error}
									aria-describedby={error ? 'review-error' : undefined}
								>
									<StarRating value={rating} onChange={setRating} size="lg" />
								</div>
							</div>
							<div>
								<Label htmlFor="comment">{t('commentLabel')}</Label>
								<Textarea
									id="comment"
									name="comment"
									placeholder={t('commentPlaceholder')}
									maxLength={2000}
									disabled={isPending}
									className="mt-1.5"
								/>
							</div>
							{error && (
								<p
									id="review-error"
									role="alert"
									className="font-sans text-sm text-destructive"
								>
									{error}
								</p>
							)}
							<Button
								type="submit"
								variant="brand"
								size="sm"
								disabled={isPending}
							>
								{isPending ? t('submitting') : t('submitReview')}
							</Button>
						</form>
					</CardContent>
				</Card>
			)}

			{!canReview &&
				!hasReviewed &&
				daysSinceCompleted > REVIEW_WINDOW_DAYS && (
					<p className="font-sans text-sm text-muted-foreground">
						{t('reviewWindowExpired')}
					</p>
				)}

			{existingReviews.length > 0 && (
				<div className="space-y-3">
					{existingReviews.map((review) => (
						<Card key={review.id}>
							<CardContent>
								<div className="flex items-start gap-3">
									<Avatar>
										<AvatarFallback>
											{review.reviewer?.full_name?.charAt(0)?.toUpperCase() ??
												'?'}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<p className="font-sans text-sm font-medium text-foreground">
												{review.reviewer?.full_name ??
													t('reviewBy', { name: '' })}
											</p>
											<StarRating value={review.rating} readonly size="sm" />
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
			)}
		</div>
	)
}
