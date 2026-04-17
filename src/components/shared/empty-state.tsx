import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
	title: ReactNode
	description?: ReactNode
	icon?: ReactNode
	action?: ReactNode
	className?: string
}

export function EmptyState({
	title,
	description,
	icon,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center rounded-xl bg-surface-container py-16 text-center',
				className,
			)}
		>
			{icon && (
				<div className="mb-4 text-muted-foreground" aria-hidden="true">
					{icon}
				</div>
			)}
			<h2 className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
				{title}
			</h2>
			{description && (
				<p className="mt-2 max-w-sm font-sans text-sm leading-[1.7] text-muted-foreground">
					{description}
				</p>
			)}
			{action && <div className="mt-6">{action}</div>}
		</div>
	)
}
