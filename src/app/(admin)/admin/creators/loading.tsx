import { Skeleton } from '@/components/ui/skeleton'

export default function AdminCreatorsLoading() {
	return (
		<div className="mx-auto max-w-4xl">
			<Skeleton className="h-5 w-48" />
			<Skeleton className="mt-2 h-6 w-20 rounded-full" />

			<div className="mt-6 space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl bg-surface-container p-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<Skeleton className="h-5 w-36 bg-surface-container-high" />
									<Skeleton className="h-5 w-14 rounded-full bg-surface-container-high" />
								</div>
								<Skeleton className="mt-1.5 h-3 w-48 bg-surface-container-high" />
								<Skeleton className="mt-2 h-4 w-full bg-surface-container-high" />
							</div>
							<div className="flex shrink-0 gap-2">
								<Skeleton className="h-9 w-24 rounded-xl bg-surface-container-high" />
								<Skeleton className="h-9 w-24 rounded-xl bg-surface-container-high" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
