import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		redirect('/login')
	}

	const role = (user.app_metadata?.role as string) ?? 'creator'

	if (role !== 'admin') {
		redirect('/dashboard')
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('full_name')
		.eq('id', user.id)
		.single()

	return (
		<div className="flex min-h-screen bg-surface">
			<AdminSidebar
				userName={profile?.full_name || ''}
				userEmail={user.email || ''}
			/>
			<div className="flex flex-1 flex-col lg:ml-0">
				<AdminHeader />
				<main id="main-content" className="flex-1 p-6 lg:p-8">
					{children}
				</main>
			</div>
		</div>
	)
}
