'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'

const EMPTY_SUBSCRIBE = () => () => {}

interface ThemeToggleProps {
	lightLabel: string
	darkLabel: string
	systemLabel: string
	className?: string
}

const THEMES = ['light', 'dark', 'system'] as const

export function ThemeToggle({
	lightLabel,
	darkLabel,
	systemLabel,
	className,
}: ThemeToggleProps) {
	const { theme, setTheme } = useTheme()
	const mounted = useSyncExternalStore(
		EMPTY_SUBSCRIBE,
		() => true,
		() => false,
	)

	if (!mounted) {
		return (
			<Button
				variant="ghost"
				size="icon"
				className={className}
				aria-label={darkLabel}
				disabled
			>
				<span className="size-4" />
			</Button>
		)
	}

	const cycleTheme = () => {
		const currentIdx = THEMES.indexOf(theme as (typeof THEMES)[number])
		const nextIdx = (currentIdx + 1) % THEMES.length
		setTheme(THEMES[nextIdx])
	}

	const label =
		theme === 'light' ? lightLabel : theme === 'dark' ? darkLabel : systemLabel

	return (
		<Button
			variant="ghost"
			size="icon"
			className={className}
			onClick={cycleTheme}
			aria-label={label}
		>
			{theme === 'light' ? (
				<svg
					className="size-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
					/>
				</svg>
			) : theme === 'dark' ? (
				<svg
					className="size-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
					/>
				</svg>
			) : (
				<svg
					className="size-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"
					/>
				</svg>
			)}
		</Button>
	)
}
