import { Skeleton } from '@/components/ui/skeleton'

export default function AdminReportsLoading() {
	return (
		<div className="mx-auto max-w-5xl">
			<Skeleton className="h-5 w-80" />

			<div className="mt-4 flex gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-8 w-20 rounded-xl" />
				))}
			</div>

			<div className="mt-6 flex flex-col gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl bg-surface-container p-5">
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-48 bg-surface-container-high" />
							<Skeleton className="h-5 w-16 rounded-full bg-surface-container-high" />
							<Skeleton className="h-5 w-20 rounded-full bg-surface-container-high" />
						</div>
						<div className="mt-2 flex gap-4">
							<Skeleton className="h-3 w-28 bg-surface-container-high" />
							<Skeleton className="h-3 w-24 bg-surface-container-high" />
						</div>
						<Skeleton className="mt-3 h-12 w-full bg-surface-container-high" />
					</div>
				))}
			</div>
		</div>
	)
}
