import { Skeleton } from '@/components/ui/skeleton'

export default function PaymentsLoading() {
	return (
		<div className="mx-auto max-w-5xl">
			<Skeleton className="h-5 w-48" />
			<div className="mt-6 space-y-3">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-12 w-full rounded-xl" />
				))}
			</div>
		</div>
	)
}
