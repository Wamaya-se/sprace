'use client'

import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-sans text-sm font-medium whitespace-nowrap outline-none select-none transition-transform transition-opacity focus-visible:border-tertiary focus-visible:ring-2 focus-visible:ring-tertiary/20 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				brand:
					'bg-gradient-to-r from-brand to-brand-container text-on-brand hover:opacity-90',
				secondary:
					'bg-surface-container-highest text-brand hover:bg-surface-container-highest/80',
				ghost:
					'text-foreground/70 hover:bg-surface-container-high hover:text-foreground',
				chip: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80',
				outline:
					'border-outline-variant/20 text-foreground/70 hover:bg-surface-container-high hover:text-foreground',
				destructive:
					'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20',
				link: 'text-brand underline-offset-4 hover:underline',
				default: 'bg-primary text-primary-foreground hover:bg-primary/80',
			},
			size: {
				default: 'h-10 gap-2 px-5',
				xs: 'h-6 gap-1 rounded-md px-2 text-xs',
				sm: 'h-8 gap-1.5 rounded-md px-3 text-[0.8rem]',
				lg: 'h-12 gap-2 px-6 text-base',
				icon: 'size-10',
				'icon-xs': 'size-6 rounded-md',
				'icon-sm': 'size-8 rounded-md',
				'icon-lg': 'size-12',
			},
		},
		defaultVariants: {
			variant: 'brand',
			size: 'default',
		},
	},
)

interface ButtonProps
	extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

function Button({
	className,
	variant = 'brand',
	size = 'default',
	asChild,
	children,
	...props
}: ButtonProps) {
	if (asChild && React.isValidElement(children)) {
		return (
			<ButtonPrimitive
				data-slot="button"
				nativeButton={false}
				className={cn(buttonVariants({ variant, size, className }))}
				render={children}
				{...props}
			/>
		)
	}

	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			{children}
		</ButtonPrimitive>
	)
}

export { Button, buttonVariants }
export type { ButtonProps }
