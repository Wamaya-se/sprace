import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				'h-12 w-full min-w-0 rounded-lg border border-outline-variant/20 bg-surface-dim px-4 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-tertiary focus-visible:ring-2 focus-visible:ring-tertiary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
				className,
			)}
			{...props}
		/>
	)
}

export { Input }
