'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { TourStep } from '@/lib/onboarding/tour-steps'
import { clampStepIndex } from '@/lib/onboarding/tour-steps'
import { completeOnboardingTour } from '@/lib/actions/onboarding'

interface OnboardingTourProps {
	steps: TourStep[]
}

interface TargetRect {
	top: number
	left: number
	width: number
	height: number
}

const CARD_WIDTH = 360
const CARD_MARGIN = 16
const MOBILE_BREAKPOINT = 768

/**
 * Interactive product tour for new users. Renders a full-viewport
 * dimmer with a cut-out spotlight around the current step's target
 * and a floating card with title/description and nav controls.
 *
 * The component is purely presentational around the pure step
 * definitions in `src/lib/onboarding/tour-steps.ts`; persistence
 * is delegated to `completeOnboardingTour` so every exit path
 * (Finish / Skip / Escape) leaves the user marked as done.
 */
export function OnboardingTour({ steps }: OnboardingTourProps) {
	const t = useTranslations('tour')
	const [index, setIndex] = useState(0)
	const [rect, setRect] = useState<TargetRect | null>(null)
	const [isDismissed, setIsDismissed] = useState(false)
	const cardRef = useRef<HTMLDivElement>(null)
	const previousFocus = useRef<HTMLElement | null>(null)
	const isDismissing = useRef(false)

	const step = steps[clampStepIndex(index, steps.length)] ?? null

	useEffect(() => {
		previousFocus.current = document.activeElement as HTMLElement | null
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = ''
			previousFocus.current?.focus?.()
		}
	}, [])

	const recomputeRect = useCallback(() => {
		if (!step || step.placement === 'center' || !step.target) {
			setRect(null)
			return
		}
		const el = document.querySelector<HTMLElement>(
			`[data-tour="${step.target}"]`,
		)
		if (!el) {
			setRect(null)
			return
		}
		// Scroll target into view so spotlight + card are never offscreen.
		el.scrollIntoView({ block: 'center', inline: 'nearest' })
		const r = el.getBoundingClientRect()
		setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
	}, [step])

	useEffect(() => {
		// Defer one frame so scrollIntoView settles before measuring.
		const raf = requestAnimationFrame(recomputeRect)
		return () => cancelAnimationFrame(raf)
	}, [recomputeRect])

	useEffect(() => {
		function onResize() {
			recomputeRect()
		}
		window.addEventListener('resize', onResize)
		window.addEventListener('scroll', onResize, true)
		return () => {
			window.removeEventListener('resize', onResize)
			window.removeEventListener('scroll', onResize, true)
		}
	}, [recomputeRect])

	useEffect(() => {
		cardRef.current?.focus()
	}, [index])

	const dismiss = useCallback(async () => {
		if (isDismissing.current) return
		isDismissing.current = true
		setIsDismissed(true)
		await completeOnboardingTour()
	}, [])

	const goNext = useCallback(() => {
		setIndex((i) => {
			if (i >= steps.length - 1) {
				void dismiss()
				return i
			}
			return i + 1
		})
	}, [dismiss, steps.length])

	const goBack = useCallback(() => {
		setIndex((i) => (i <= 0 ? 0 : i - 1))
	}, [])

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				e.preventDefault()
				void dismiss()
				return
			}
			if (e.key === 'ArrowRight') {
				e.preventDefault()
				goNext()
				return
			}
			if (e.key === 'ArrowLeft') {
				e.preventDefault()
				goBack()
				return
			}
			if (e.key !== 'Tab') return
			const card = cardRef.current
			if (!card) return
			const focusables = card.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
			)
			if (focusables.length === 0) return
			const first = focusables[0]
			const last = focusables[focusables.length - 1]
			const active = document.activeElement as HTMLElement | null
			// Trap tab/shift-tab inside the dialog.
			if (e.shiftKey && (active === first || active === card)) {
				e.preventDefault()
				last?.focus()
			} else if (!e.shiftKey && active === last) {
				e.preventDefault()
				first?.focus()
			}
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [dismiss, goNext, goBack])

	if (!step || isDismissed) return null

	const isCenter = step.placement === 'center' || !rect
	const isFirst = index === 0
	const isLast = index === steps.length - 1
	const cardPosition = computeCardPosition(step, rect)

	return (
		<div
			className="fixed inset-0 z-[60]"
			role="dialog"
			aria-modal="true"
			aria-labelledby="tour-title"
			aria-describedby="tour-description"
		>
			{/* Dimmer + spotlight */}
			{isCenter ? (
				<div
					className="absolute inset-0 bg-foreground/70 backdrop-blur-[2px]"
					aria-hidden="true"
				/>
			) : (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute rounded-xl ring-2 ring-brand/80"
					style={{
						top: rect.top - 4,
						left: rect.left - 4,
						width: rect.width + 8,
						height: rect.height + 8,
						boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
						transition: 'top 150ms ease, left 150ms ease',
					}}
				/>
			)}

			{/* Card */}
			<div
				ref={cardRef}
				tabIndex={-1}
				className="absolute w-[min(calc(100vw-2rem),22.5rem)] rounded-xl bg-surface-container-high p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] outline-none ring-1 ring-outline-variant/10 focus-visible:ring-2 focus-visible:ring-tertiary"
				style={cardPosition}
			>
				<div className="flex items-center justify-between gap-3">
					<span className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{t('stepOf', { current: index + 1, total: steps.length })}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => void dismiss()}
						className="-mr-2 h-7 px-2 text-xs"
					>
						{t('skip')}
					</Button>
				</div>

				<Progress
					value={((index + 1) / steps.length) * 100}
					className="mt-3 h-1"
				/>

				<h3
					id="tour-title"
					className="mt-4 font-heading text-lg font-bold tracking-[-0.03em] text-foreground"
				>
					{t(step.titleKey)}
				</h3>
				<p
					id="tour-description"
					className="mt-2 font-sans text-sm leading-[1.7] text-muted-foreground"
				>
					{t(step.descriptionKey)}
				</p>

				<div className="mt-5 flex items-center justify-between gap-3">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={goBack}
						disabled={isFirst}
					>
						{t('back')}
					</Button>
					<Button type="button" variant="brand" size="sm" onClick={goNext}>
						{isLast ? t('finish') : t('next')}
					</Button>
				</div>
			</div>
		</div>
	)
}

/**
 * Compute a screen-positioned style object for the tour card.
 * On viewports narrower than MOBILE_BREAKPOINT we always anchor
 * the card at the bottom of the screen, mirroring the action-sheet
 * pattern — the "right"/"bottom" placement hint only applies on
 * roomier viewports.
 */
function computeCardPosition(
	step: TourStep,
	rect: TargetRect | null,
): React.CSSProperties {
	if (typeof window === 'undefined') {
		return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
	}
	const isMobile = window.innerWidth < MOBILE_BREAKPOINT
	if (step.placement === 'center' || !rect) {
		return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
	}
	if (isMobile) {
		return {
			left: '50%',
			bottom: `${CARD_MARGIN}px`,
			transform: 'translateX(-50%)',
		}
	}
	const vw = window.innerWidth
	const vh = window.innerHeight
	let top = rect.top
	let left = rect.left + rect.width + CARD_MARGIN
	switch (step.placement) {
		case 'right':
			top = Math.max(CARD_MARGIN, rect.top)
			left = rect.left + rect.width + CARD_MARGIN
			break
		case 'left':
			top = Math.max(CARD_MARGIN, rect.top)
			left = rect.left - CARD_WIDTH - CARD_MARGIN
			break
		case 'bottom':
			top = rect.top + rect.height + CARD_MARGIN
			left = rect.left
			break
		case 'top':
			top = rect.top - CARD_MARGIN - 160
			left = rect.left
			break
	}
	// Keep card on-screen even when the target is near an edge.
	const maxLeft = vw - CARD_WIDTH - CARD_MARGIN
	if (left > maxLeft) left = maxLeft
	if (left < CARD_MARGIN) left = CARD_MARGIN
	const maxTop = vh - CARD_MARGIN - 220
	if (top > maxTop) top = maxTop
	if (top < CARD_MARGIN) top = CARD_MARGIN
	return { top: `${top}px`, left: `${left}px` }
}
