import { describe, it, expect } from 'vitest'
import { isAdmin, getUserRole } from '@/lib/auth/roles'

describe('isAdmin', () => {
	it('returns true when app_metadata.role === "admin"', () => {
		expect(isAdmin({ app_metadata: { role: 'admin' } })).toBe(true)
	})

	it('returns false for non-admin roles', () => {
		expect(isAdmin({ app_metadata: { role: 'creator' } })).toBe(false)
		expect(isAdmin({ app_metadata: { role: 'business' } })).toBe(false)
	})

	it('returns false when app_metadata is missing', () => {
		expect(isAdmin({ app_metadata: {} })).toBe(false)
	})

	it('returns false when role key is missing', () => {
		expect(isAdmin({ app_metadata: { other: 'value' } })).toBe(false)
	})
})

describe('getUserRole', () => {
	it('returns admin|creator|business for known roles', () => {
		expect(getUserRole({ app_metadata: { role: 'admin' } })).toBe('admin')
		expect(getUserRole({ app_metadata: { role: 'creator' } })).toBe('creator')
		expect(getUserRole({ app_metadata: { role: 'business' } })).toBe('business')
	})

	it('returns undefined for unknown role', () => {
		expect(getUserRole({ app_metadata: { role: 'guest' } })).toBeUndefined()
	})

	it('returns undefined when missing', () => {
		expect(getUserRole({ app_metadata: {} })).toBeUndefined()
	})
})
