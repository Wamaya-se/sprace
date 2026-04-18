'use client'

import { useEffect, useState } from 'react'
import { getTourSteps, type TourRole } from '@/lib/onboarding/tour-steps'
import { OnboardingTour } from '@/components/onboarding/onboarding-tour'

interface Props {
	role: TourRole
}

/**
 * Defer mounting until after hydration + one animation frame so the
 * target DOM nodes (sidebar items) are on screen and measurable.
 * Without this delay the first spotlight frame can render at the
 * wrong coordinates on slow devices, which reads as a flash.
 */
export function OnboardingTourLauncher({ role }: Props) {
	const [ready, setReady] = useState(false)

	useEffect(() => {
		const raf = requestAnimationFrame(() => setReady(true))
		return () => cancelAnimationFrame(raf)
	}, [])

	if (!ready) return null
	const steps = getTourSteps(role)
	return <OnboardingTour steps={steps} />
}
