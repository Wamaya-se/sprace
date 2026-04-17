import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
	return (
		<div className="mx-auto max-w-lg space-y-4">
			<div className="flex items-center gap-4">
				<Skeleton className="h-16 w-16 rounded-full" />
				<div className="flex-1">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="mt-1.5 h-4 w-24" />
				</div>
			</div>

			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="rounded-xl bg-surface-container p-5">
					<div className="flex items-center justify-between">
						<Skeleton className="h-5 w-32 bg-surface-container-high" />
						<Skeleton className="h-8 w-16 rounded-xl bg-surface-container-high" />
					</div>
					<Skeleton className="mt-3 h-4 w-full bg-surface-container-high" />
					<Skeleton className="mt-2 h-4 w-3/4 bg-surface-container-high" />
				</div>
			))}
		</div>
	)
}
