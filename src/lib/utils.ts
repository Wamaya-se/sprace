import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		})
	} catch {
		return iso
	}
}

/**
 * Format a minor-unit (öre/cents) integer amount as a localized currency
 * string, e.g. `formatMoney(15000, 'sek')` → `"150,00 SEK"`. Locale is
 * fixed to `sv-SE` to match the rest of the app's number presentation.
 */
export function formatMoney(minor: number, currency: string = 'sek'): string {
	const value = (minor / 100).toLocaleString('sv-SE', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
	return `${value} ${currency.toUpperCase()}`
}

/**
 * Format a minor-unit amount with thousands grouping but without
 * decimals — useful for charts and KPI cards where decimals add noise.
 */
export function formatMoneyShort(
	minor: number,
	currency: string = 'sek',
): string {
	const value = Math.round(minor / 100).toLocaleString('sv-SE')
	return `${value} ${currency.toUpperCase()}`
}
