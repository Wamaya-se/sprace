'use client'

import { useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { updateEmailNotifications } from '@/lib/actions/settings'

interface EmailNotificationToggleProps {
	initialValue: boolean
}

export function EmailNotificationToggle({
	initialValue,
}: EmailNotificationToggleProps) {
	const t = useTranslations('settings')
	const [isPending, startTransition] = useTransition()
	const [enabled, setEnabled] = useState(initialValue)

	function handleToggle(checked: boolean) {
		setEnabled(checked)
		startTransition(async () => {
			const result = await updateEmailNotifications(checked)
			if (!result.success) {
				setEnabled(!checked)
			}
		})
	}

	return (
		<div className="flex items-center justify-between">
			<div>
				<Label
					htmlFor="email-notifications"
					className="font-sans text-sm font-medium text-foreground"
				>
					{t('emailNotifications')}
				</Label>
				<p className="mt-0.5 font-sans text-sm text-muted-foreground">
					{t('emailNotificationsDescription')}
				</p>
			</div>
			<Switch
				id="email-notifications"
				checked={enabled}
				onCheckedChange={handleToggle}
				disabled={isPending}
			/>
		</div>
	)
}
