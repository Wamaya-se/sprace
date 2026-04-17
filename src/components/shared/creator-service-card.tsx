import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

interface ServiceMedia {
	id: string
	media_url: string
	media_type: string
	sort_order: number
}

export interface CreatorServiceCardService {
	id: string
	name: string
	description: string | null
	price: number
	delivery_days: number
	is_active: boolean
	sort_order: number
	media: ServiceMedia[]
}

interface CreatorServiceCardProps {
	service: CreatorServiceCardService
}

export function CreatorServiceCard({ service }: CreatorServiceCardProps) {
	const coverImage = service.media[0]

	return (
		<Card className="group overflow-hidden bg-surface-container transition-transform duration-200 hover:-translate-y-0.5">
			{coverImage && (
				<div className="relative aspect-[16/10] overflow-hidden">
					<Image
						src={coverImage.media_url}
						alt={service.name}
						fill
						sizes="(max-width: 640px) 100vw, 50vw"
						className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
				</div>
			)}
			<CardContent className="p-5">
				<h3 className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
					{service.name}
				</h3>
				{service.description && (
					<p className="mt-2 line-clamp-2 font-sans text-sm leading-[1.7] text-muted-foreground">
						{service.description}
					</p>
				)}
				<div className="mt-4 flex items-center justify-between">
					<span className="font-heading text-lg font-bold tracking-[-0.03em] text-brand">
						{service.price.toLocaleString('sv-SE')} SEK
					</span>
					<span className="font-sans text-xs text-muted-foreground">
						{service.delivery_days}d
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
