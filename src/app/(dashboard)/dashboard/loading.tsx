import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardOverviewLoading() {
	return (
		<div className="mx-auto max-w-4xl">
			<Skeleton className="h-5 w-56" />

			<div className="mt-8 rounded-xl bg-surface-container p-6">
				<Skeleton className="h-6 w-48 bg-surface-container-high" />
				<Skeleton className="mt-2 h-4 w-72 bg-surface-container-high" />
				<Skeleton className="mt-4 h-10 w-36 rounded-xl bg-surface-container-high" />
			</div>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl bg-surface-container p-5">
						<Skeleton className="h-3 w-20 bg-surface-container-high" />
						<Skeleton className="mt-2 h-8 w-16 bg-surface-container-high" />
					</div>
				))}
			</div>
		</div>
	)
}
