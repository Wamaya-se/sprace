import { getTranslations } from 'next-intl/server'
import { NavbarClient } from './navbar-client'

export async function Navbar() {
	const t = await getTranslations('nav')
	const tc = await getTranslations('common')

	const labels = {
		creators: t('creators'),
		howItWorks: t('howItWorks'),
		openMenu: t('openMenu'),
		closeMenu: t('closeMenu'),
		login: tc('login'),
		getStarted: tc('getStarted'),
		backToHome: tc('backToHome'),
		themeLight: t('themeLight'),
		themeDark: t('themeDark'),
		themeSystem: t('themeSystem'),
		mainNavigation: tc('mainNavigation'),
	}

	return <NavbarClient labels={labels} />
}
