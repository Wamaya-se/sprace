import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
	'group/badge inline-flex h-7 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-3 font-sans text-xs font-medium whitespace-nowrap focus-visible:border-tertiary focus-visible:ring-2 focus-visible:ring-tertiary/20 [&>svg]:pointer-events-none [&>svg]:size-3!',
	{
		variants: {
			variant: {
				default: 'bg-brand/15 text-brand',
				secondary: 'bg-secondary-container/20 text-on-secondary-container',
				outline:
					'border-outline-variant/20 text-foreground/70 [a]:hover:bg-surface-container-high',
				chip: 'cursor-pointer select-none bg-surface-container-high text-foreground/70 hover:bg-surface-container-highest hover:text-foreground active:scale-[0.97]',
				chipActive:
					'cursor-pointer select-none bg-brand/15 text-brand border-brand/30 hover:bg-brand/20 active:scale-[0.97]',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

function Badge({
	className,
	variant = 'default',
	render,
	...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
	return useRender({
		defaultTagName: 'span',
		props: mergeProps<'span'>(
			{
				className: cn(badgeVariants({ variant }), className),
			},
			props,
		),
		render,
		state: {
			slot: 'badge',
			variant,
		},
	})
}

export { Badge, badgeVariants }
