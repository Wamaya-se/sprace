export default function CreatorCategoriesLoading() {
	return (
		<>
			<section className="pt-16">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />
				<div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
					<div className="mb-10 flex items-center gap-2">
						<div className="h-4 w-10 animate-pulse rounded bg-surface-container" />
						<span className="text-foreground/20">/</span>
						<div className="h-4 w-16 animate-pulse rounded bg-surface-container" />
					</div>
					<div className="h-12 w-72 animate-pulse rounded bg-surface-container" />
					<div className="mt-4 h-5 w-96 animate-pulse rounded bg-surface-container" />
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-6 pb-32 pt-8">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="rounded-xl bg-surface-container p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-2">
									<div className="h-5 w-32 animate-pulse rounded bg-surface-container-high" />
									<div className="h-4 w-20 animate-pulse rounded bg-surface-container-high" />
								</div>
								<div className="size-8 animate-pulse rounded-full bg-surface-container-high" />
							</div>
						</div>
					))}
				</div>
			</section>
		</>
	)
}
