'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { logOut } from '@/lib/actions/auth'

interface LogoutButtonProps {
	label: string
}

export function LogoutButton({ label }: LogoutButtonProps) {
	const [isPending, startTransition] = useTransition()

	function handleClick() {
		startTransition(async () => {
			await logOut()
		})
	}

	return (
		<Button variant="ghost" onClick={handleClick} disabled={isPending}>
			{label}
		</Button>
	)
}
