'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useActionError } from '@/hooks/use-action-error'
import { exportAccountData } from '@/lib/actions/account'

export function DataExportSection() {
	const t = useTranslations('settings')
	const te = useActionError()
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)

	function handleExport() {
		setError(null)
		startTransition(async () => {
			const result = await exportAccountData()
			if (!result.success) {
				setError(te(result.error))
				return
			}

			const json = JSON.stringify(result.data, null, 2)
			const blob = new Blob([json], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `sprace-data-export-${new Date().toISOString().split('T')[0]}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		})
	}

	return (
		<div>
			{error && (
				<p role="alert" className="mb-3 font-sans text-sm text-destructive">
					{error}
				</p>
			)}
			<p className="font-sans text-sm leading-[1.7] text-muted-foreground">
				{t('dataExportDescription')}
			</p>
			<Button
				variant="ghost"
				size="sm"
				onClick={handleExport}
				disabled={isPending}
				className="mt-2"
			>
				{isPending ? t('exportingData') : t('exportData')}
			</Button>
		</div>
	)
}
