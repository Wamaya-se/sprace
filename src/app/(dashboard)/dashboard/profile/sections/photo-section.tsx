'use client'

import Image from 'next/image'
import { useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SectionEditorHeader } from './section-editor-header'

interface PhotoSectionProps {
	displayName: string
	initial: string
	avatarUrl: string | null
	avatarFile: File | null
	setAvatarFile: (file: File | null) => void
	isEditing: boolean
	onEdit: () => void
	onSave: () => void
	onCancel: () => void
	isPending: boolean
	otherEditing: boolean
}

export function PhotoSection({
	displayName,
	initial,
	avatarUrl,
	avatarFile,
	setAvatarFile,
	isEditing,
	onEdit,
	onSave,
	onCancel,
	isPending,
	otherEditing,
}: PhotoSectionProps) {
	const t = useTranslations('onboarding')
	const td = useTranslations('dashboard')

	const avatarPreview = useMemo(
		() => (avatarFile ? URL.createObjectURL(avatarFile) : null),
		[avatarFile],
	)

	useEffect(() => {
		if (!avatarPreview) return
		return () => {
			URL.revokeObjectURL(avatarPreview)
		}
	}, [avatarPreview])

	return (
		<Card>
			<CardContent>
				<SectionEditorHeader
					title={td('sectionPhoto')}
					isEditing={isEditing}
					onEdit={onEdit}
					onSave={onSave}
					onCancel={onCancel}
					isPending={isPending}
					editLabel={td('changePhoto')}
					saveLabel={isPending ? td('savingSection') : td('saveSection')}
					cancelLabel={td('cancelEdit')}
					disabled={otherEditing}
					canSave={!!avatarFile}
				/>

				{isEditing ? (
					<div className="mt-4">
						<div className="flex items-center gap-4">
							{avatarPreview || avatarUrl ? (
								<Image
									src={avatarPreview || avatarUrl!}
									alt={displayName}
									width={80}
									height={80}
									className="h-20 w-20 rounded-full object-cover"
								/>
							) : (
								<Avatar className="h-20 w-20">
									<AvatarFallback className="text-xl">{initial}</AvatarFallback>
								</Avatar>
							)}
							<div>
								<label
									htmlFor="avatar-upload"
									className="inline-flex cursor-pointer items-center rounded-lg bg-surface-container-highest px-4 py-2 font-sans text-sm font-medium text-brand transition-opacity hover:opacity-80"
								>
									{t('avatarChange')}
								</label>
								<input
									id="avatar-upload"
									type="file"
									accept="image/jpeg,image/png,image/webp"
									className="sr-only"
									onChange={(e) => {
										const file = e.target.files?.[0] || null
										setAvatarFile(file)
									}}
								/>
								<p className="mt-1 font-sans text-xs text-muted-foreground">
									{t('avatarHint')}
								</p>
							</div>
						</div>
					</div>
				) : (
					<div className="mt-3 flex items-center gap-3">
						{avatarUrl ? (
							<Image
								src={avatarUrl}
								alt={displayName}
								width={48}
								height={48}
								className="h-12 w-12 rounded-full object-cover"
							/>
						) : (
							<Avatar className="h-12 w-12">
								<AvatarFallback>{initial}</AvatarFallback>
							</Avatar>
						)}
						<p className="font-sans text-sm text-muted-foreground">
							{avatarUrl ? displayName : t('notSet')}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
