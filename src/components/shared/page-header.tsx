import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
	title: ReactNode
	description?: ReactNode
	actions?: ReactNode
	className?: string
}

export function PageHeader({
	title,
	description,
	actions,
	className,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-foreground md:text-3xl">
					{title}
				</h1>
				{description && (
					<p className="mt-2 max-w-2xl font-sans text-sm leading-[1.7] text-muted-foreground">
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
