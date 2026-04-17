#!/usr/bin/env node
// Checks for orphan i18n keys in messages/*.json that are not referenced in src/**.
// Heuristic: looks for `t('key')` or `tc('key')` style usages with matching namespace.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const MESSAGES_DIR = join(ROOT, 'messages')
const SRC_DIR = join(ROOT, 'src')

function walkFiles(dir, exts) {
	const out = []
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry)
		const stat = statSync(full)
		if (stat.isDirectory()) {
			if (entry === 'node_modules' || entry === '.next') continue
			out.push(...walkFiles(full, exts))
		} else if (exts.includes(extname(entry))) {
			out.push(full)
		}
	}
	return out
}

function collectKeys(obj, prefix, acc) {
	for (const [k, v] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${k}` : k
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			collectKeys(v, path, acc)
		} else {
			acc.add(path)
		}
	}
}

const en = JSON.parse(readFileSync(join(MESSAGES_DIR, 'en.json'), 'utf8'))
const allKeys = new Set()
collectKeys(en, '', allKeys)

const sourceFiles = walkFiles(SRC_DIR, ['.ts', '.tsx'])
const combined = sourceFiles.map((f) => readFileSync(f, 'utf8')).join('\n')

// Find all getTranslations('ns') or useTranslations('ns') to know which namespaces are used
const nsUsages = new Set()
const nsRegex = /(?:getTranslations|useTranslations)\(['"]([\w.]+)['"]\)/g
let nsMatch
while ((nsMatch = nsRegex.exec(combined))) nsUsages.add(nsMatch[1])

// Collect all t('key'), t(`key`), t.rich('key') usages (string-literal keys only)
const keyUsages = new Set()
const keyRegex = /\bt[a-zA-Z_]*\s*(?:\.rich|\.raw)?\(\s*['"`]([\w.]+)['"`]/g
let keyMatch
while ((keyMatch = keyRegex.exec(combined))) keyUsages.add(keyMatch[1])

const orphans = []
for (const fullKey of allKeys) {
	// A key is potentially used if its suffix (any tail segment under a used namespace)
	// matches a t('...') call. We conservatively mark as used if the final segment
	// or a known tail appears in keyUsages.
	const leaf = fullKey.split('.').pop()
	let used = false
	if (keyUsages.has(leaf)) used = true
	// Also match ns.key where ns is one of nsUsages
	for (const ns of nsUsages) {
		if (fullKey === ns) {
			used = true
			break
		}
		if (fullKey.startsWith(`${ns}.`)) {
			const suffix = fullKey.slice(ns.length + 1)
			if (keyUsages.has(suffix)) {
				used = true
				break
			}
			// handle nested like errors.couldNotX
			const segments = suffix.split('.')
			if (segments.some((s) => keyUsages.has(s))) {
				used = true
				break
			}
		}
	}
	if (!used) orphans.push(fullKey)
}

if (orphans.length === 0) {
	console.log('No orphan i18n keys detected.')
	process.exit(0)
}

console.log(`Found ${orphans.length} potentially orphan i18n key(s):`)
for (const o of orphans) console.log('  - ' + o)
process.exit(0)
