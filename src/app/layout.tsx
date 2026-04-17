import type { Metadata } from 'next'
import { Epilogue, Manrope } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { WebVitalsReporter } from '@/components/shared/web-vitals-reporter'
import './globals.css'

const epilogue = Epilogue({
	variable: '--font-epilogue',
	subsets: ['latin'],
	display: 'swap',
})

const manrope = Manrope({
	variable: '--font-manrope',
	subsets: ['latin'],
	display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('metadata')
	return {
		title: {
			default: t('homeTitle'),
			template: t('titleTemplate'),
		},
		description: t('homeDescription'),
	}
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const locale = await getLocale()
	const messages = await getMessages()
	const t = await getTranslations('common')

	return (
		<html
			lang={locale}
			className={`${epilogue.variable} ${manrope.variable} h-full antialiased`}
			suppressHydrationWarning
		>
			<body className="min-h-full flex flex-col">
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-medium focus:text-on-brand focus:outline-none"
				>
					{t('skipToContent')}
				</a>
				<ThemeProvider>
					<NextIntlClientProvider messages={messages}>
						<WebVitalsReporter />
						{children}
					</NextIntlClientProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
