import { describe, it, expect } from 'vitest'
import { getSafeRedirectPath } from '@/lib/auth/redirects'

describe('getSafeRedirectPath', () => {
	it('accepts a known path exactly', () => {
		expect(getSafeRedirectPath('/dashboard')).toBe('/dashboard')
	})

	it('accepts a known path with subpath', () => {
		expect(getSafeRedirectPath('/dashboard/profile/edit')).toBe(
			'/dashboard/profile/edit',
		)
	})

	it('rejects null/empty input', () => {
		expect(getSafeRedirectPath(null)).toBeNull()
		expect(getSafeRedirectPath('')).toBeNull()
	})

	it('rejects protocol-relative URLs (open redirect vector)', () => {
		expect(getSafeRedirectPath('//evil.com')).toBeNull()
		expect(getSafeRedirectPath('//evil.com/dashboard')).toBeNull()
	})

	it('rejects absolute URLs', () => {
		expect(getSafeRedirectPath('https://evil.com/dashboard')).toBeNull()
		expect(getSafeRedirectPath('http://localhost/dashboard')).toBeNull()
	})

	it('rejects unknown paths', () => {
		expect(getSafeRedirectPath('/evil')).toBeNull()
		expect(getSafeRedirectPath('/dashboards')).toBeNull()
	})

	it('rejects paths that do not start with /', () => {
		expect(getSafeRedirectPath('dashboard')).toBeNull()
		expect(getSafeRedirectPath('./dashboard')).toBeNull()
	})
})
