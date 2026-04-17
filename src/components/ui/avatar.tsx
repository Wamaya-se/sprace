'use client'

import * as React from 'react'
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'

import { cn } from '@/lib/utils'

function Avatar({
	className,
	size = 'default',
	...props
}: AvatarPrimitive.Root.Props & {
	size?: 'default' | 'sm' | 'lg'
}) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			data-size={size}
			className={cn(
				'group/avatar relative flex size-9 shrink-0 rounded-full bg-surface-container-highest select-none data-[size=lg]:size-12 data-[size=sm]:size-7',
				className,
			)}
			{...props}
		/>
	)
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn(
				'aspect-square size-full rounded-full object-cover',
				className,
			)}
			{...props}
		/>
	)
}

function AvatarFallback({
	className,
	...props
}: AvatarPrimitive.Fallback.Props) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				'flex size-full items-center justify-center rounded-full font-heading text-sm font-bold text-brand group-data-[size=sm]/avatar:text-xs group-data-[size=lg]/avatar:text-base',
				className,
			)}
			{...props}
		/>
	)
}

export { Avatar, AvatarImage, AvatarFallback }
