export default function SavedCreatorsLoading() {
	return (
		<div className="mx-auto max-w-6xl">
			<div className="h-5 w-64 animate-pulse rounded bg-surface-container" />

			<div className="mt-6 mb-4 h-4 w-20 animate-pulse rounded bg-surface-container" />

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl bg-surface-container p-5">
						<div className="flex items-start gap-4">
							<div className="size-14 animate-pulse rounded-full bg-surface-container-high" />
							<div className="flex-1 space-y-2">
								<div className="h-5 w-32 animate-pulse rounded bg-surface-container-high" />
								<div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
							</div>
						</div>
						<div className="mt-4 space-y-2">
							<div className="h-4 w-full animate-pulse rounded bg-surface-container-high" />
							<div className="h-4 w-3/4 animate-pulse rounded bg-surface-container-high" />
						</div>
						<div className="mt-4 flex gap-2">
							<div className="h-6 w-16 animate-pulse rounded-full bg-surface-container-high" />
							<div className="h-6 w-20 animate-pulse rounded-full bg-surface-container-high" />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
