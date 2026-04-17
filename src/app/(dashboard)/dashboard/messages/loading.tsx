export default function MessagesLoading() {
	return (
		<div className="mx-auto max-w-3xl">
			<div className="h-5 w-48 animate-pulse rounded bg-surface-container" />

			<div className="mt-6 flex flex-col gap-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-4 rounded-xl bg-surface-container p-3"
					>
						<div className="h-10 w-10 animate-pulse rounded-full bg-surface-container-high" />
						<div className="flex-1">
							<div className="h-4 w-32 animate-pulse rounded bg-surface-container-high" />
							<div className="mt-1.5 h-3 w-48 animate-pulse rounded bg-surface-container-high" />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
