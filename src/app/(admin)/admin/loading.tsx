import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardLoading() {
	return (
		<div className="mx-auto max-w-5xl">
			<Skeleton className="h-5 w-56" />

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl bg-surface-container p-5">
						<Skeleton className="h-3 w-20 bg-surface-container-high" />
						<Skeleton className="mt-2 h-8 w-14 bg-surface-container-high" />
						<Skeleton className="mt-1 h-3 w-24 bg-surface-container-high" />
					</div>
				))}
			</div>

			<div className="mt-10">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="mt-1 h-4 w-56" />

				<div className="mt-4 space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between rounded-xl bg-surface-container px-4 py-3"
						>
							<div className="flex-1">
								<Skeleton className="h-4 w-36 bg-surface-container-high" />
								<Skeleton className="mt-1 h-3 w-48 bg-surface-container-high" />
							</div>
							<Skeleton className="h-8 w-20 rounded-xl bg-surface-container-high" />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
