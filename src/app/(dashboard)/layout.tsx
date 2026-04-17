import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { getUnreadCount } from '@/lib/queries/messages'
import { getUnreadNotificationCount } from '@/lib/notifications'

export default async function DashboardLayout({
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

	if (role === 'admin') {
		redirect('/admin')
	}

	const [{ data: profile }, unreadCount, unreadNotifications] =
		await Promise.all([
			supabase
				.from('profiles')
				.select('full_name, is_suspended')
				.eq('id', user.id)
				.single(),
			getUnreadCount(),
			getUnreadNotificationCount(),
		])

	if (profile?.is_suspended) {
		redirect('/suspended')
	}

	return (
		<div className="flex min-h-screen bg-surface">
			<Sidebar
				userName={profile?.full_name || ''}
				userEmail={user.email || ''}
				userId={user.id}
				userRole={role as 'creator' | 'business'}
				unreadMessageCount={unreadCount}
			/>
			<div className="flex flex-1 flex-col lg:ml-0">
				<DashboardHeader
					userRole={role as 'creator' | 'business'}
					userId={user.id}
					unreadNotifications={unreadNotifications}
				/>
				<main id="main-content" className="flex-1 p-6 lg:p-8">
					{children}
				</main>
			</div>
		</div>
	)
}
