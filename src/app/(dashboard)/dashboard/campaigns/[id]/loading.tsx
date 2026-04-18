export default function CampaignDetailLoading() {
	return (
		<div className="mx-auto max-w-5xl">
			<div className="h-4 w-32 animate-pulse rounded bg-surface-container" />
			<div className="mt-4 h-8 w-80 max-w-full animate-pulse rounded bg-surface-container" />
			<div className="mt-6 flex gap-2">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="h-8 w-24 animate-pulse rounded bg-surface-container"
					/>
				))}
			</div>
			<div className="mt-6 h-48 animate-pulse rounded-xl bg-surface-container" />
		</div>
	)
}
