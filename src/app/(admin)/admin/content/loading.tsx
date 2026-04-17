import { Skeleton } from '@/components/ui/skeleton'

export default function AdminContentLoading() {
	return (
		<div className="mx-auto max-w-4xl">
			<Skeleton className="h-5 w-48" />

			<div className="mt-6 flex rounded-xl bg-surface-container p-1">
				<Skeleton className="h-9 flex-1 rounded-lg bg-surface-container-high" />
				<Skeleton className="h-9 flex-1 rounded-lg bg-surface-container-high" />
			</div>

			<div className="mt-6 space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3"
					>
						<div className="flex items-center gap-3">
							<Skeleton className="h-4 w-32 bg-surface-container-high" />
							<Skeleton className="h-5 w-8 rounded-full bg-surface-container-high" />
						</div>
						<Skeleton className="h-8 w-8 rounded bg-surface-container-high" />
					</div>
				))}
			</div>
		</div>
	)
}
