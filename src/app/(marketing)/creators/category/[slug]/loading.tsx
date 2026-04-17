export default function CategoryLoading() {
	return (
		<>
			<section className="pt-16">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />
				<div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
					<div className="mb-10 flex items-center gap-2">
						<div className="h-4 w-10 animate-pulse rounded bg-surface-container" />
						<span className="text-foreground/20">/</span>
						<div className="h-4 w-16 animate-pulse rounded bg-surface-container" />
						<span className="text-foreground/20">/</span>
						<div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
					</div>
					<div className="h-12 w-80 animate-pulse rounded bg-surface-container" />
					<div className="mt-4 h-5 w-96 animate-pulse rounded bg-surface-container" />
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-6 pb-32 pt-8">
				<div className="mb-6 h-4 w-20 animate-pulse rounded bg-surface-container" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
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
			</section>
		</>
	)
}
