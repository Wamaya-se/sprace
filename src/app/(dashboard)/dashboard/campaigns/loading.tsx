export default function CampaignsLoading() {
	return (
		<div className="mx-auto max-w-6xl">
			<div className="h-5 w-64 animate-pulse rounded bg-surface-container" />

			<div className="mt-6 flex flex-wrap gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="h-7 w-20 animate-pulse rounded-full bg-surface-container"
					/>
				))}
			</div>

			<div className="mt-6 flex flex-col gap-3">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-xl bg-surface-container p-4">
						<div className="flex items-center gap-3">
							<div className="h-5 w-48 animate-pulse rounded bg-surface-container-high" />
							<div className="h-5 w-16 animate-pulse rounded-full bg-surface-container-high" />
						</div>
						<div className="mt-2 h-4 w-56 animate-pulse rounded bg-surface-container-high" />
					</div>
				))}
			</div>
		</div>
	)
}
