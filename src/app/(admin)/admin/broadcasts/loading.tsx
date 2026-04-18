import { Skeleton } from '@/components/ui/skeleton'

export default function AdminBroadcastsLoading() {
	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-8">
			<Skeleton className="h-5 w-96" />

			<section>
				<Skeleton className="h-5 w-40" />
				<div className="mt-4 rounded-xl bg-surface-container p-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<Skeleton className="h-10 w-full bg-surface-container-high" />
						<Skeleton className="h-10 w-full bg-surface-container-high" />
					</div>
					<Skeleton className="mt-4 h-28 w-full bg-surface-container-high" />
					<Skeleton className="mt-4 h-10 w-full bg-surface-container-high" />
					<div className="mt-4 flex gap-2">
						<Skeleton className="h-9 w-28 bg-surface-container-high" />
						<Skeleton className="h-9 w-28 bg-surface-container-high" />
					</div>
				</div>
			</section>

			<section>
				<Skeleton className="h-5 w-40" />
				<div className="mt-4 flex flex-col gap-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="rounded-xl bg-surface-container p-5">
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-48 bg-surface-container-high" />
								<Skeleton className="h-5 w-16 rounded-full bg-surface-container-high" />
								<Skeleton className="h-5 w-20 rounded-full bg-surface-container-high" />
							</div>
							<Skeleton className="mt-2 h-16 w-full bg-surface-container-high" />
						</div>
					))}
				</div>
			</section>
		</div>
	)
}
