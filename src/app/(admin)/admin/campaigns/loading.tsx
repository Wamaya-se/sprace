export default function AdminCampaignsLoading() {
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
					<div
						key={i}
						className="h-24 animate-pulse rounded-xl bg-surface-container"
					/>
				))}
			</div>
		</div>
	)
}
