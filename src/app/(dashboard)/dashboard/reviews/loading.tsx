import { Skeleton } from '@/components/ui/skeleton'

export default function ReviewsLoading() {
	return (
		<div className="mx-auto max-w-2xl">
			<Skeleton className="h-5 w-64" />

			<div className="mt-8 space-y-8">
				<section>
					<Skeleton className="h-6 w-40" />
					<div className="mt-4 space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="rounded-xl bg-surface-container p-4">
								<div className="flex items-start gap-3">
									<Skeleton className="h-10 w-10 shrink-0 rounded-full bg-surface-container-high" />
									<div className="flex-1 space-y-2">
										<div className="flex items-center gap-2">
											<Skeleton className="h-4 w-28 bg-surface-container-high" />
											<Skeleton className="h-3 w-20 bg-surface-container-high" />
										</div>
										<Skeleton className="h-3 w-48 bg-surface-container-high" />
										<Skeleton className="h-4 w-full bg-surface-container-high" />
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	)
}
