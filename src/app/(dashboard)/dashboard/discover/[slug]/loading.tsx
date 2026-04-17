export default function DiscoverCreatorLoading() {
	return (
		<div className="-m-6 lg:-m-8">
			<div className="relative overflow-hidden">
				<div className="grain absolute inset-0 bg-gradient-to-br from-gradient-start via-surface to-gradient-end" />
				<div className="relative mx-auto max-w-7xl px-6 py-20">
					<div className="mb-10 h-4 w-32 animate-pulse rounded bg-foreground/10" />
					<div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
						<div className="size-28 shrink-0 animate-pulse rounded-full bg-surface-container-highest md:size-36" />
						<div className="flex-1 space-y-4">
							<div className="h-10 w-64 animate-pulse rounded-lg bg-foreground/10" />
							<div className="flex gap-2">
								<div className="h-7 w-20 animate-pulse rounded-full bg-foreground/5" />
								<div className="h-7 w-24 animate-pulse rounded-full bg-foreground/5" />
							</div>
							<div className="flex gap-6">
								<div className="h-4 w-24 animate-pulse rounded bg-foreground/5" />
								<div className="h-4 w-20 animate-pulse rounded bg-foreground/5" />
							</div>
							<div className="flex gap-3 pt-4">
								<div className="h-11 w-40 animate-pulse rounded-full bg-brand/20" />
								<div className="h-11 w-36 animate-pulse rounded-full bg-surface-container-highest" />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-6">
				<div className="grid gap-12 pt-16 lg:grid-cols-[1fr_340px]">
					<div className="space-y-16">
						<div className="space-y-4">
							<div className="h-7 w-32 animate-pulse rounded bg-foreground/10" />
							<div className="h-4 w-full animate-pulse rounded bg-foreground/5" />
							<div className="h-4 w-5/6 animate-pulse rounded bg-foreground/5" />
							<div className="h-4 w-4/6 animate-pulse rounded bg-foreground/5" />
						</div>
					</div>
					<div>
						<div className="h-72 animate-pulse rounded-xl bg-surface-container" />
					</div>
				</div>
			</div>
		</div>
	)
}
