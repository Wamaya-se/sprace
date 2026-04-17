'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { saveCreator, unsaveCreator } from '@/lib/actions/saved-creators'

interface SaveCreatorButtonProps {
	creatorId: string
	initialSaved: boolean
	size?: 'icon' | 'default'
}

export function SaveCreatorButton({
	creatorId,
	initialSaved,
	size = 'icon',
}: SaveCreatorButtonProps) {
	const t = useTranslations('savedCreators')
	const [isSaved, setIsSaved] = useState(initialSaved)
	const [isPending, startTransition] = useTransition()

	function handleToggle() {
		startTransition(async () => {
			const prev = isSaved
			setIsSaved(!prev)

			const result = prev
				? await unsaveCreator(creatorId)
				: await saveCreator(creatorId)

			if (!result.success) {
				setIsSaved(prev)
			}
		})
	}

	if (size === 'default') {
		return (
			<Button
				variant={isSaved ? 'secondary' : 'outline'}
				size="sm"
				onClick={handleToggle}
				disabled={isPending}
				aria-label={isSaved ? t('unsave') : t('save')}
				aria-pressed={isSaved}
			>
				<HeartIcon filled={isSaved} />
				{isSaved ? t('saved') : t('save')}
			</Button>
		)
	}

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={handleToggle}
			disabled={isPending}
			aria-label={isSaved ? t('unsave') : t('save')}
			aria-pressed={isSaved}
			className={
				isSaved
					? 'text-brand hover:text-brand/80'
					: 'text-muted-foreground hover:text-brand'
			}
		>
			<HeartIcon filled={isSaved} />
		</Button>
	)
}

function HeartIcon({ filled }: { filled: boolean }) {
	if (filled) {
		return (
			<svg
				className="size-4"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M11.995 7.23319C10.5455 5.60999 8.12832 5.17335 6.31215 6.65972C4.49598 8.14609 4.2403 10.6312 5.66654 12.3892L11.995 18.25L18.3235 12.3892C19.7498 10.6312 19.5253 8.13046 17.6779 6.65972C15.8305 5.18899 13.4446 5.60999 11.995 7.23319Z" />
			</svg>
		)
	}

	return (
		<svg
			className="size-4"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
		</svg>
	)
}
