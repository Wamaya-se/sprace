import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'

type LimiterKind = 'auth' | 'action' | 'webhook'

const LIMITS: Record<LimiterKind, { tokens: number; windowSeconds: number }> = {
	// Auth-sensitive routes (login, register, forgot-password) — strict.
	auth: { tokens: 10, windowSeconds: 60 },
	// Server Actions — moderate budget per user.
	action: { tokens: 60, windowSeconds: 60 },
	// Webhook endpoints — per sender, very generous (guard against abuse, not volume).
	webhook: { tokens: 300, windowSeconds: 60 },
}

let redis: Redis | null = null
const limiters = new Map<LimiterKind, Ratelimit>()

function getRedis(): Redis | null {
	if (redis) return redis
	const url = env.upstashRedisUrl
	const token = env.upstashRedisToken
	if (!url || !token) return null
	redis = new Redis({ url, token })
	return redis
}

function getLimiter(kind: LimiterKind): Ratelimit | null {
	const client = getRedis()
	if (!client) return null
	const existing = limiters.get(kind)
	if (existing) return existing
	const { tokens, windowSeconds } = LIMITS[kind]
	const limiter = new Ratelimit({
		redis: client,
		limiter: Ratelimit.slidingWindow(tokens, `${windowSeconds} s`),
		analytics: true,
		prefix: `sprace:rl:${kind}`,
	})
	limiters.set(kind, limiter)
	return limiter
}

export interface RateLimitResult {
	success: boolean
	limit: number
	remaining: number
	reset: number
}

export async function checkRateLimit(
	kind: LimiterKind,
	identifier: string,
): Promise<RateLimitResult> {
	const limiter = getLimiter(kind)
	if (!limiter) {
		// No Upstash configured — fail-open so local dev / unconfigured envs work.
		return { success: true, limit: 0, remaining: 0, reset: 0 }
	}
	const result = await limiter.limit(identifier)
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset,
	}
}

export function getClientIp(headers: Headers): string {
	const forwarded = headers.get('x-forwarded-for')
	if (forwarded) return forwarded.split(',')[0]!.trim()
	const real = headers.get('x-real-ip')
	if (real) return real.trim()
	return 'unknown'
}
