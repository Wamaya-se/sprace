'use client'

import { useTranslations } from 'next-intl'

const ERROR_PREFIX = 'errors.'

export function useActionError() {
	const t = useTranslations('errors')

	return function translateError(errorKey: string): string {
		if (errorKey.startsWith(ERROR_PREFIX)) {
			const key = errorKey.slice(ERROR_PREFIX.length)
			return t.has(key) ? t(key as Parameters<typeof t>[0]) : errorKey
		}
		return errorKey
	}
}
