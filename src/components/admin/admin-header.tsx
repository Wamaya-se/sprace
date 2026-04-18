'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { logOut } from '@/app/(admin)/actions'

const pageTitleKeys: Record<string, string> = {
	'/admin': 'overview',
	'/admin/analytics': 'analytics',
	'/admin/users': 'users',
	'/admin/creators': 'creators',
	'/admin/payments': 'payments',
	'/admin/settings': 'platformSettings',
	'/admin/disputes': 'disputes',
	'/admin/content': 'contentManagement',
	'/admin/reports': 'moderation',
	'/admin/campaigns': 'campaigns',
}

export function AdminHeader() {
	const pathname = usePathname()
	const t = useTranslations('admin')
	const tc = useTranslations('common')
	const matchedKey =
		pageTitleKeys[pathname] ??
		(pathname.startsWith('/admin/users/') ? 'userDetail' : undefined) ??
		'overview'
	const titleKey = matchedKey
	const title = t(titleKey)

	return (
		<header className="flex h-16 items-center justify-between border-b border-outline-variant/10 pl-16 pr-6 lg:px-8">
			<h1 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground lg:text-2xl">
				{title}
			</h1>
			<div className="flex items-center gap-2">
				<ThemeToggle
					lightLabel={tc('themeLight')}
					darkLabel={tc('themeDark')}
					systemLabel={tc('themeSystem')}
				/>
				<form action={logOut}>
					<Button type="submit" variant="ghost" size="sm">
						{tc('logOut')}
					</Button>
				</form>
			</div>
		</header>
	)
}
