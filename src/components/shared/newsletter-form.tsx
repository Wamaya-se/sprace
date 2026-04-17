'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface NewsletterFormProps {
	placeholder: string
	buttonLabel: string
}

export function NewsletterForm({
	placeholder,
	buttonLabel,
}: NewsletterFormProps) {
	const [email, setEmail] = useState('')
	const [submitted, setSubmitted] = useState(false)

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!email) return
		setSubmitted(true)
	}

	if (submitted) {
		return (
			<p className="font-sans text-sm text-brand" role="status">
				✓
			</p>
		)
	}

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<Input
				type="email"
				required
				placeholder={placeholder}
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				className="flex-1"
				aria-label={placeholder}
			/>
			<Button type="submit" size="sm">
				{buttonLabel}
			</Button>
		</form>
	)
}
