import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
	title: ReactNode
	description?: ReactNode
	actions?: ReactNode
	className?: string
	level?: 2 | 3
}

export function SectionHeader({
	title,
	description,
	actions,
	className,
	level = 2,
}: SectionHeaderProps) {
	const Heading = level === 2 ? 'h2' : 'h3'
	return (
		<div
			className={cn(
				'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between',
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				<Heading
					className={cn(
						'font-heading tracking-[-0.03em] text-foreground',
						level === 2 ? 'text-lg font-semibold' : 'text-base font-semibold',
					)}
				>
					{title}
				</Heading>
				{description && (
					<p className="mt-1 font-sans text-sm leading-[1.7] text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{actions && (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			)}
		</div>
	)
}
