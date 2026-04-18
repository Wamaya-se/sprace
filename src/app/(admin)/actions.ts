'use server'

import { logOut as logOutAction } from '@/lib/actions/auth'

export async function logOut() {
	return logOutAction()
}
