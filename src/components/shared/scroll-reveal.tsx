'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ScrollRevealProps {
	children: ReactNode
	className?: string
	/** Stagger delay in ms (for grid items) */
	delay?: number
	/** Animation variant */
	variant?: 'fade-up' | 'fade-in'
}

export function ScrollReveal({
	children,
	className,
	delay = 0,
	variant = 'fade-up',
}: ScrollRevealProps) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = ref.current
		if (!el) return

		const prefersReduced = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		).matches
		if (prefersReduced) {
			el.style.opacity = '1'
			el.style.transform = 'none'
			return
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.style.transitionDelay = `${delay}ms`
					el.classList.add('scroll-revealed')
					observer.unobserve(el)
				}
			},
			{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
		)

		observer.observe(el)
		return () => observer.disconnect()
	}, [delay])

	return (
		<div
			ref={ref}
			className={cn(
				variant === 'fade-up' && 'scroll-reveal-up',
				variant === 'fade-in' && 'scroll-reveal-fade',
				className,
			)}
		>
			{children}
		</div>
	)
}
