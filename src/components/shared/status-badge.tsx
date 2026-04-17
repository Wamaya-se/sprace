import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'outline'

export type BookingStatus =
	| 'pending'
	| 'awaiting_payment'
	| 'accepted'
	| 'in_progress'
	| 'delivered'
	| 'completed'
	| 'declined'
	| 'cancelled'
	| 'disputed'

const bookingStatusVariants: Record<BookingStatus, BadgeVariant> = {
	pending: 'outline',
	awaiting_payment: 'outline',
	accepted: 'secondary',
	in_progress: 'default',
	delivered: 'default',
	completed: 'secondary',
	declined: 'outline',
	cancelled: 'outline',
	disputed: 'default',
}

interface StatusBadgeProps {
	status: string
	label: string
	variantOverride?: BadgeVariant
	className?: string
}

export function StatusBadge({
	status,
	label,
	variantOverride,
	className,
}: StatusBadgeProps) {
	const variant =
		variantOverride ??
		bookingStatusVariants[status as BookingStatus] ??
		'outline'
	return (
		<Badge variant={variant} className={cn(className)}>
			{label}
		</Badge>
	)
}
