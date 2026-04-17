'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useActionError } from '@/hooks/use-action-error'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toggleServiceActive, deleteService } from '../actions'

interface ServiceMedia {
	id: string
	media_url: string
}

interface ServiceCardProps {
	service: {
		id: string
		name: string
		description: string | null
		price: number
		delivery_days: number
		is_active: boolean
		media: ServiceMedia[]
	}
}

export function ServiceCard({ service }: ServiceCardProps) {
	const t = useTranslations('services')
	const te = useActionError()
	const [isToggling, startToggle] = useTransition()
	const [isDeleting, startDelete] = useTransition()
	const [deleteError, setDeleteError] = useState<string | null>(null)
	const [toggleError, setToggleError] = useState<string | null>(null)

	const thumbnail = service.media[0]?.media_url

	function handleToggle() {
		setToggleError(null)
		startToggle(async () => {
			const result = await toggleServiceActive(service.id)
			if (!result.success) {
				setToggleError(te(result.error))
			}
		})
	}

	function handleDelete() {
		setDeleteError(null)
		startDelete(async () => {
			const result = await deleteService(service.id)
			if (!result.success) {
				setDeleteError(te(result.error))
			}
		})
	}

	return (
		<Card className="overflow-hidden">
			{thumbnail && (
				<div className="relative aspect-video">
					<Image
						src={thumbnail}
						alt=""
						fill
						className="object-cover"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
					/>
				</div>
			)}
			<CardContent className="space-y-3 p-4">
				<div className="flex items-start justify-between gap-2">
					<h3 className="font-heading text-base font-bold tracking-[-0.03em] text-foreground line-clamp-1">
						{service.name}
					</h3>
					<Badge variant={service.is_active ? 'chipActive' : 'chip'}>
						{service.is_active ? t('active') : t('inactive')}
					</Badge>
				</div>

				{service.description && (
					<p className="font-sans text-sm leading-[1.7] text-muted-foreground line-clamp-2">
						{service.description}
					</p>
				)}

				<div className="flex items-center gap-3 font-sans text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						{t('priceFormatted', { price: service.price })}
					</span>
					<span aria-hidden="true">·</span>
					<span>{t('delivery', { days: service.delivery_days })}</span>
				</div>

				<div className="flex items-center justify-between border-t border-outline-variant/10 pt-3">
					<div className="flex items-center gap-2">
						<Switch
							checked={service.is_active}
							onCheckedChange={handleToggle}
							disabled={isToggling}
							aria-label={t('isActive')}
						/>
						<span className="font-sans text-xs text-muted-foreground">
							{service.is_active ? t('active') : t('inactive')}
						</span>
					</div>

					<div className="flex items-center gap-1">
						<Button variant="ghost" size="sm" asChild>
							<Link href={`/dashboard/services/${service.id}/edit`}>
								{t('edit')}
							</Link>
						</Button>

						<AlertDialog>
							<AlertDialogTrigger
								render={
									<Button variant="destructive" size="sm" disabled={isDeleting}>
										{t('delete')}
									</Button>
								}
							/>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
									<AlertDialogDescription>
										{t('deleteDescription')}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{t('deleteCancel')}</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										onClick={handleDelete}
										disabled={isDeleting}
									>
										{t('deleteConfirm')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>

				{toggleError && (
					<p role="alert" className="font-sans text-xs text-destructive">
						{toggleError}
					</p>
				)}
				{deleteError && (
					<p role="alert" className="font-sans text-xs text-destructive">
						{deleteError}
					</p>
				)}
			</CardContent>
		</Card>
	)
}
