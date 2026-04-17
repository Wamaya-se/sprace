'use client'

import { useState, useRef, useTransition, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useActionError } from '@/hooks/use-action-error'
import { createDelivery } from '@/lib/actions/deliveries'

interface DeliveryFormProps {
	bookingId: string
}

const MAX_FILES = 10
const MAX_SIZE_MB = 50

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DeliveryForm({ bookingId }: DeliveryFormProps) {
	const t = useTranslations('deliveries')
	const te = useActionError()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [files, setFiles] = useState<File[]>([])
	const fileInputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files)
			setFiles((prev) => {
				const combined = [...prev, ...newFiles].slice(0, MAX_FILES)
				return combined
			})
		}
	}

	function removeFile(index: number) {
		setFiles((prev) => prev.filter((_, i) => i !== index))
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault()
		if (e.dataTransfer.files) {
			const newFiles = Array.from(e.dataTransfer.files)
			setFiles((prev) => {
				const combined = [...prev, ...newFiles].slice(0, MAX_FILES)
				return combined
			})
		}
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setError(null)

		if (files.length === 0) {
			setError(t('noFiles'))
			return
		}

		const formData = new FormData()
		formData.set('bookingId', bookingId)

		const commentEl = e.currentTarget.elements.namedItem(
			'comment',
		) as HTMLTextAreaElement
		if (commentEl?.value) {
			formData.set('comment', commentEl.value)
		}

		for (const file of files) {
			formData.append('files', file)
		}

		startTransition(async () => {
			const result = await createDelivery(formData)
			if (result.success) {
				setFiles([])
				if (fileInputRef.current) fileInputRef.current.value = ''
				router.refresh()
			} else {
				setError(te(result.error))
			}
		})
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="flex flex-col gap-4">
				{error && (
					<p
						id="delivery-error"
						role="alert"
						className="font-sans text-sm text-destructive"
					>
						{error}
					</p>
				)}

				<div>
					<Label htmlFor="delivery-files">{t('filesLabel')}</Label>
					<p className="mt-0.5 font-sans text-xs text-muted-foreground">
						{t('filesDescription', {
							maxFiles: String(MAX_FILES),
							maxSize: `${MAX_SIZE_MB}MB`,
						})}
					</p>
					<div
						className="mt-2 flex min-h-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant/50"
						onDrop={handleDrop}
						onDragOver={(e) => e.preventDefault()}
						onClick={() => fileInputRef.current?.click()}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								fileInputRef.current?.click()
							}
						}}
						role="button"
						tabIndex={0}
						aria-label={t('dragOrClick')}
						aria-describedby={error ? 'delivery-error' : undefined}
					>
						<div className="flex flex-col items-center gap-1 px-4 py-4">
							<svg
								className="h-6 w-6 text-muted-foreground"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
								/>
							</svg>
							<span className="font-sans text-sm text-muted-foreground">
								{t('dragOrClick')}
							</span>
						</div>
					</div>
					<input
						ref={fileInputRef}
						id="delivery-files"
						type="file"
						multiple
						className="sr-only"
						onChange={handleFileChange}
						accept="image/*,video/*,.pdf,.zip"
					/>
				</div>

				{files.length > 0 && (
					<div className="flex flex-col gap-1.5">
						<span className="font-sans text-xs text-muted-foreground">
							{t('selectedFiles', { count: files.length })}
						</span>
						{files.map((file, i) => (
							<div
								key={`${file.name}-${file.size}-${i}`}
								className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2"
							>
								<div className="flex items-center gap-2 overflow-hidden">
									{file.type.startsWith('image/') && (
										<FilePreview file={file} />
									)}
									<div className="min-w-0">
										<p className="truncate font-sans text-sm text-foreground/70">
											{file.name}
										</p>
										<p className="font-sans text-xs text-muted-foreground">
											{formatFileSize(file.size)}
										</p>
									</div>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									onClick={() => removeFile(i)}
									className="ml-2 shrink-0"
									aria-label={t('removeFile', { name: file.name })}
								>
									<svg
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={1.5}
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M6 18 18 6M6 6l12 12"
										/>
									</svg>
								</Button>
							</div>
						))}
					</div>
				)}

				<div>
					<Label htmlFor="delivery-comment">{t('commentLabel')}</Label>
					<Textarea
						id="delivery-comment"
						name="comment"
						placeholder={t('commentPlaceholder')}
						maxLength={2000}
						className="mt-1.5"
						rows={3}
					/>
				</div>

				<Button
					type="submit"
					variant="brand"
					disabled={isPending || files.length === 0}
				>
					{isPending ? t('submitting') : t('submitDelivery')}
				</Button>
			</div>
		</form>
	)
}

function FilePreview({ file }: { file: File }) {
	const src = useMemo(() => URL.createObjectURL(file), [file])

	useEffect(() => () => URL.revokeObjectURL(src), [src])

	// next/image rejects blob: URLs, and this is a pre-upload local preview only.
	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={src}
			alt={file.name}
			className="h-8 w-8 shrink-0 rounded object-cover"
		/>
	)
}
