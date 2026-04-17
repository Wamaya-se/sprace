'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'

import { cn } from '@/lib/utils'

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				'peer group/switch relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none focus-visible:border-tertiary focus-visible:ring-2 focus-visible:ring-tertiary/20 data-checked:bg-brand data-unchecked:bg-surface-container-highest data-disabled:cursor-not-allowed data-disabled:opacity-50',
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className="pointer-events-none block size-4 rounded-full bg-white ring-0 transition-transform data-checked:translate-x-[calc(100%+2px)] data-unchecked:translate-x-0.5"
			/>
		</SwitchPrimitive.Root>
	)
}

export { Switch }
