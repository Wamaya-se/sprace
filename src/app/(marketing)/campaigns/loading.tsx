export default function PublicCampaignsLoading() {
	return (
		<>
			<section className="relative overflow-hidden pt-16">
				<div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
					<div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
					<div className="mt-8 h-12 w-80 max-w-full animate-pulse rounded bg-surface-container" />
					<div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded bg-surface-container" />
				</div>
			</section>
			<section className="mx-auto max-w-7xl px-6 pb-32 pt-8">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className="h-56 animate-pulse rounded-xl bg-surface-container"
						/>
					))}
				</div>
			</section>
		</>
	)
}
