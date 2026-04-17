import { Skeleton } from '@/components/ui/skeleton'

export default function ServicesLoading() {
	return (
		<div className="mx-auto max-w-4xl">
			<div className="flex items-center justify-between">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-9 w-28 rounded-xl" />
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl bg-surface-container">
						<Skeleton className="aspect-video w-full rounded-t-xl bg-surface-container-high" />
						<div className="p-4">
							<div className="flex items-center justify-between">
								<Skeleton className="h-5 w-36 bg-surface-container-high" />
								<Skeleton className="h-5 w-14 rounded-full bg-surface-container-high" />
							</div>
							<Skeleton className="mt-2 h-4 w-full bg-surface-container-high" />
							<Skeleton className="mt-1 h-4 w-2/3 bg-surface-container-high" />
							<Skeleton className="mt-3 h-4 w-28 bg-surface-container-high" />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
