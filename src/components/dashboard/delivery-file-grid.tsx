'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'

interface DeliveryFile {
	id: string
	file_url: string
	file_name: string
	file_size: number
	mime_type: string
	sort_order: number
}

interface DeliveryFileGridProps {
	files: DeliveryFile[]
	deliveryStatus: string
	userRole: string
	compact?: boolean
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mimeType: string): boolean {
	return mimeType.startsWith('image/')
}

function isVideo(mimeType: string): boolean {
	return mimeType.startsWith('video/')
}

export function DeliveryFileGrid({
	files,
	deliveryStatus,
	userRole,
	compact,
}: DeliveryFileGridProps) {
	const t = useTranslations('deliveries')

	const canDownload = deliveryStatus === 'approved' || userRole === 'creator'

	const imageFiles = files.filter((f) => isImage(f.mime_type))
	const videoFiles = files.filter((f) => isVideo(f.mime_type))
	const otherFiles = files.filter(
		(f) => !isImage(f.mime_type) && !isVideo(f.mime_type),
	)

	const gridSize = compact ? 'h-16 w-16' : 'h-24 w-24'

	return (
		<div className="flex flex-col gap-3">
			{imageFiles.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{imageFiles.map((file) => (
						<div key={file.id} className="group relative">
							<div
								className={`${gridSize} overflow-hidden rounded-lg bg-surface-container-low`}
							>
								<Image
									src={file.file_url}
									alt={file.file_name}
									width={compact ? 64 : 96}
									height={compact ? 64 : 96}
									className="h-full w-full object-cover"
									unoptimized
								/>
							</div>
							{canDownload && (
								<a
									href={file.file_url}
									download={file.file_name}
									target="_blank"
									rel="noopener noreferrer"
									className="absolute inset-0 flex items-center justify-center rounded-lg bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100"
									aria-label={t('downloadFileLabel', { name: file.file_name })}
								>
									<svg
										className="h-4 w-4 text-foreground"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={1.5}
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
										/>
									</svg>
								</a>
							)}
						</div>
					))}
				</div>
			)}

			{videoFiles.length > 0 && (
				<div className="flex flex-col gap-2">
					{videoFiles.map((file) => (
						<div
							key={file.id}
							className="overflow-hidden rounded-lg bg-surface-container-low"
						>
							{canDownload ? (
								<video
									src={file.file_url}
									controls
									preload="metadata"
									className={compact ? 'max-h-32 w-full' : 'max-h-48 w-full'}
									aria-label={file.file_name}
								>
									<track kind="captions" />
								</video>
							) : (
								<div
									className={`flex items-center justify-center ${compact ? 'h-16' : 'h-24'} bg-surface-container-low`}
								>
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
											d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
										/>
									</svg>
								</div>
							)}
							<div className="flex items-center justify-between px-3 py-2">
								<div className="min-w-0">
									<p
										className={`truncate font-sans ${compact ? 'text-xs' : 'text-sm'} text-foreground/70`}
									>
										{file.file_name}
									</p>
									<p className="font-sans text-xs text-muted-foreground">
										{formatFileSize(file.file_size)}
									</p>
								</div>
								{canDownload && (
									<a
										href={file.file_url}
										download={file.file_name}
										target="_blank"
										rel="noopener noreferrer"
										className="ml-2 shrink-0 rounded p-1.5 text-muted-foreground hover:text-foreground/70"
										aria-label={t('downloadFileLabel', {
											name: file.file_name,
										})}
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
												d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
											/>
										</svg>
									</a>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{otherFiles.length > 0 && (
				<div className="flex flex-col gap-1.5">
					{otherFiles.map((file) => (
						<div
							key={file.id}
							className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2"
						>
							<div className="flex items-center gap-2 overflow-hidden">
								<svg
									className="h-5 w-5 shrink-0 text-muted-foreground"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={1.5}
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
									/>
								</svg>
								<div className="min-w-0">
									<p
										className={`truncate font-sans ${compact ? 'text-xs' : 'text-sm'} text-foreground/70`}
									>
										{file.file_name}
									</p>
									<p className="font-sans text-xs text-muted-foreground">
										{formatFileSize(file.file_size)}
									</p>
								</div>
							</div>
							{canDownload && (
								<a
									href={file.file_url}
									download={file.file_name}
									target="_blank"
									rel="noopener noreferrer"
									className="ml-2 shrink-0 rounded p-1.5 text-muted-foreground hover:text-foreground/70"
									aria-label={t('downloadFileLabel', { name: file.file_name })}
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
											d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
										/>
									</svg>
								</a>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
