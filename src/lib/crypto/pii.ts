import 'server-only'

import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	timingSafeEqual,
} from 'node:crypto'
import { env } from '@/lib/env'

/**
 * PII encryption at rest using AES-256-GCM.
 *
 * Ciphertext format (base64-encoded concatenation):
 *   [version:1][iv:12][tag:16][ciphertext:N]
 *
 * Version byte lets us rotate algorithms or keys in future migrations.
 *
 * Never log inputs, outputs, or errors that include either. Callers
 * are responsible for ensuring the clear value stays on the server —
 * do not return it to 'use client' components unless the user is
 * explicitly requesting to view their own PII.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const VERSION = 0x01

function getKey(): Buffer {
	const raw = env.piiEncryptionKey
	const key = Buffer.from(raw, 'base64')
	if (key.length !== KEY_LENGTH) {
		throw new Error(
			`PII_ENCRYPTION_KEY must be a base64-encoded ${KEY_LENGTH}-byte (256-bit) key`,
		)
	}
	return key
}

export function encryptPii(plaintext: string): string {
	if (typeof plaintext !== 'string' || plaintext.length === 0) {
		throw new Error('encryptPii: plaintext must be a non-empty string')
	}
	const key = getKey()
	const iv = randomBytes(IV_LENGTH)
	const cipher = createCipheriv(ALGORITHM, key, iv)
	const encrypted = Buffer.concat([
		cipher.update(plaintext, 'utf8'),
		cipher.final(),
	])
	const tag = cipher.getAuthTag()
	return Buffer.concat([Buffer.from([VERSION]), iv, tag, encrypted]).toString(
		'base64',
	)
}

export function decryptPii(ciphertext: string): string {
	if (typeof ciphertext !== 'string' || ciphertext.length === 0) {
		throw new Error('decryptPii: ciphertext must be a non-empty string')
	}
	const buf = Buffer.from(ciphertext, 'base64')
	if (buf.length < 1 + IV_LENGTH + TAG_LENGTH + 1) {
		throw new Error('decryptPii: ciphertext too short')
	}
	const version = buf[0]
	if (version !== VERSION) {
		throw new Error(`decryptPii: unsupported version ${version}`)
	}
	const iv = buf.subarray(1, 1 + IV_LENGTH)
	const tag = buf.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + TAG_LENGTH)
	const encrypted = buf.subarray(1 + IV_LENGTH + TAG_LENGTH)

	const key = getKey()
	const decipher = createDecipheriv(ALGORITHM, key, iv)
	decipher.setAuthTag(tag)
	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	])
	return decrypted.toString('utf8')
}

/**
 * Compares two plaintext values in constant time. Use when checking
 * if a submitted personnummer matches the stored one.
 */
export function constantTimeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a, 'utf8')
	const bufB = Buffer.from(b, 'utf8')
	if (bufA.length !== bufB.length) return false
	return timingSafeEqual(bufA, bufB)
}
