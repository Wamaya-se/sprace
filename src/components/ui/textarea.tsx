import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'min-h-24 w-full rounded-lg border border-outline-variant/20 bg-surface-dim px-4 py-3 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-tertiary focus-visible:ring-2 focus-visible:ring-tertiary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
				className,
			)}
			{...props}
		/>
	)
}

export { Textarea }
