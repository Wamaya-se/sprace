'use client'

import { Button } from '@/components/ui/button'

interface SectionEditorHeaderProps {
	title: string
	isEditing: boolean
	onEdit: () => void
	onSave: () => void
	onCancel: () => void
	isPending: boolean
	editLabel: string
	saveLabel: string
	cancelLabel: string
	disabled: boolean
	canSave: boolean
}

export function SectionEditorHeader({
	title,
	isEditing,
	onEdit,
	onSave,
	onCancel,
	isPending,
	editLabel,
	saveLabel,
	cancelLabel,
	disabled,
	canSave,
}: SectionEditorHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<h3 className="font-heading text-base font-bold tracking-[-0.02em] text-foreground">
				{title}
			</h3>
			{isEditing ? (
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="xs"
						onClick={onCancel}
						disabled={isPending}
					>
						{cancelLabel}
					</Button>
					<Button
						variant="brand"
						size="xs"
						onClick={onSave}
						disabled={isPending || !canSave}
					>
						{saveLabel}
					</Button>
				</div>
			) : (
				<Button variant="ghost" size="xs" onClick={onEdit} disabled={disabled}>
					{editLabel}
				</Button>
			)}
		</div>
	)
}
