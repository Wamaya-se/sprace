import * as React from 'react'

import { cn } from '@/lib/utils'

function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
	return (
		<select
			data-slot="native-select"
			className={cn(
				'h-10 min-w-0 appearance-none rounded-lg border border-outline-variant/20 bg-surface-dim px-3 pr-8 font-sans text-sm text-foreground outline-none focus-visible:border-tertiary focus-visible:ring-2 focus-visible:ring-tertiary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
				'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231a1a1a80%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff80%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[position:right_0.5rem_center] bg-no-repeat',
				className,
			)}
			{...props}
		/>
	)
}

export { NativeSelect }
