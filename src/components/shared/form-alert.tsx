import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'error' | 'success' | 'info' | 'warning'

interface FormAlertProps {
	variant?: Variant
	children: ReactNode
	className?: string
	role?: 'alert' | 'status'
}

const variantStyles: Record<Variant, string> = {
	error: 'bg-destructive/10 text-destructive',
	success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
	info: 'bg-tertiary/10 text-tertiary',
	warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
}

export function FormAlert({
	variant = 'error',
	children,
	className,
	role,
}: FormAlertProps) {
	const resolvedRole = role ?? (variant === 'error' ? 'alert' : 'status')
	return (
		<div
			role={resolvedRole}
			className={cn(
				'rounded-xl px-4 py-3 font-sans text-sm leading-[1.7]',
				variantStyles[variant],
				className,
			)}
		>
			{children}
		</div>
	)
}
