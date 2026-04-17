import { ServiceCard } from './service-card'

interface ServiceMedia {
	id: string
	media_url: string
}

interface Service {
	id: string
	name: string
	description: string | null
	price: number
	delivery_days: number
	is_active: boolean
	media: ServiceMedia[]
}

interface ServiceListProps {
	services: Service[]
}

export function ServiceList({ services }: ServiceListProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{services.map((service) => (
				<ServiceCard key={service.id} service={service} />
			))}
		</div>
	)
}
