export default function PublicCampaignDetailLoading() {
	return (
		<>
			<section className="relative overflow-hidden pt-16">
				<div className="relative mx-auto max-w-5xl px-6 py-16 md:py-24">
					<div className="h-4 w-40 animate-pulse rounded bg-surface-container" />
					<div className="mt-8 h-10 w-full max-w-xl animate-pulse rounded bg-surface-container" />
					<div className="mt-4 h-5 w-60 animate-pulse rounded bg-surface-container" />
				</div>
			</section>
			<section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-[2fr_1fr]">
				<div className="h-80 animate-pulse rounded-xl bg-surface-container" />
				<div className="h-64 animate-pulse rounded-xl bg-surface-container" />
			</section>
		</>
	)
}
