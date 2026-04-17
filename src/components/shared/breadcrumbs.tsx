import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
	label: ReactNode
	href?: string
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[]
	className?: string
	ariaLabel?: string
}

export function Breadcrumbs({
	items,
	className,
	ariaLabel = 'Breadcrumb',
}: BreadcrumbsProps) {
	return (
		<nav aria-label={ariaLabel} className={className}>
			<ol className="flex flex-wrap items-center gap-2 font-sans text-sm text-muted-foreground">
				{items.map((item, index) => {
					const isLast = index === items.length - 1
					return (
						<li key={index} className="flex items-center gap-2">
							{item.href && !isLast ? (
								<Link
									href={item.href}
									className={cn('hover:text-foreground/70')}
								>
									{item.label}
								</Link>
							) : (
								<span
									className={isLast ? 'text-foreground/70' : undefined}
									aria-current={isLast ? 'page' : undefined}
								>
									{item.label}
								</span>
							)}
							{!isLast && (
								<span aria-hidden="true" className="text-muted-foreground/60">
									/
								</span>
							)}
						</li>
					)
				})}
			</ol>
		</nav>
	)
}
