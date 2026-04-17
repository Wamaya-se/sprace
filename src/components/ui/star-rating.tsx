'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface StarRatingProps {
	value: number
	onChange?: (value: number) => void
	readonly?: boolean
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

const sizeClasses = {
	sm: 'h-4 w-4',
	md: 'h-5 w-5',
	lg: 'h-6 w-6',
}

export function StarRating({
	value,
	onChange,
	readonly = false,
	size = 'md',
	className,
}: StarRatingProps) {
	const t = useTranslations('reviews')
	const [hoverValue, setHoverValue] = useState(0)

	const displayValue = hoverValue || value

	return (
		<div
			className={cn('flex gap-0.5', className)}
			role={readonly ? 'img' : 'radiogroup'}
			aria-label={
				readonly ? t('averageRating', { rating: String(value) }) : undefined
			}
		>
			{[1, 2, 3, 4, 5].map((star) => {
				const isFilled = star <= displayValue

				if (readonly) {
					return (
						<svg
							key={star}
							className={cn(
								sizeClasses[size],
								isFilled ? 'text-brand' : 'text-muted-foreground/40',
							)}
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					)
				}

				return (
					<button
						key={star}
						type="button"
						onClick={() => onChange?.(star)}
						onMouseEnter={() => setHoverValue(star)}
						onMouseLeave={() => setHoverValue(0)}
						className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						aria-label={t('starLabel', { count: String(star) })}
						role="radio"
						aria-checked={star === value}
					>
						<svg
							className={cn(
								sizeClasses[size],
								isFilled ? 'text-brand' : 'text-muted-foreground/40',
								'duration-100',
							)}
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					</button>
				)
			})}
		</div>
	)
}
