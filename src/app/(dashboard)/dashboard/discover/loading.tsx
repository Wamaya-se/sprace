export default function DiscoverLoading() {
	return (
		<div className="mx-auto max-w-6xl">
			<div className="h-4 w-64 animate-pulse rounded bg-foreground/10" />

			<div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
				{/* Filter sidebar skeleton */}
				<aside className="space-y-5">
					<div className="h-11 animate-pulse rounded-lg bg-surface-container" />
					<div className="space-y-2">
						<div className="h-3 w-20 animate-pulse rounded bg-foreground/5" />
						<div className="flex flex-wrap gap-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className="h-7 w-20 animate-pulse rounded-full bg-surface-container"
								/>
							))}
						</div>
					</div>
					<div className="space-y-2">
						<div className="h-3 w-16 animate-pulse rounded bg-foreground/5" />
						<div className="flex flex-wrap gap-2">
							{Array.from({ length: 3 }).map((_, i) => (
								<div
									key={i}
									className="h-7 w-24 animate-pulse rounded-full bg-surface-container"
								/>
							))}
						</div>
					</div>
					<div className="space-y-2">
						<div className="h-3 w-28 animate-pulse rounded bg-foreground/5" />
						<div className="flex gap-3">
							<div className="h-9 w-28 animate-pulse rounded-lg bg-surface-container" />
							<div className="h-9 w-28 animate-pulse rounded-lg bg-surface-container" />
						</div>
					</div>
				</aside>

				{/* Results skeleton */}
				<div>
					<div className="mb-4 h-3 w-20 animate-pulse rounded bg-foreground/5" />
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="rounded-xl bg-surface-container p-5">
								<div className="flex items-start gap-4">
									<div className="size-14 shrink-0 animate-pulse rounded-full bg-surface-container-highest" />
									<div className="flex-1 space-y-2">
										<div className="h-4 w-32 animate-pulse rounded bg-foreground/10" />
										<div className="h-3 w-24 animate-pulse rounded bg-foreground/5" />
									</div>
								</div>
								<div className="mt-4 space-y-1.5">
									<div className="h-3 w-full animate-pulse rounded bg-foreground/5" />
									<div className="h-3 w-4/5 animate-pulse rounded bg-foreground/5" />
								</div>
								<div className="mt-4 flex gap-1.5">
									<div className="h-6 w-16 animate-pulse rounded-full bg-foreground/5" />
									<div className="h-6 w-20 animate-pulse rounded-full bg-foreground/5" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
