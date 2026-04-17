import { Skeleton } from '@/components/ui/skeleton'

export default function NotificationsLoading() {
	return (
		<div className="mx-auto max-w-2xl">
			<Skeleton className="h-5 w-64" />
			<div className="mt-6 flex flex-col gap-1">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="flex gap-3 rounded-xl px-4 py-3">
						<Skeleton className="mt-1 h-2 w-2 shrink-0 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-4 w-72" />
							<Skeleton className="h-3 w-16" />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
