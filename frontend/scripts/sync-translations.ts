#!/usr/bin/env node
/**
 * Translation Sync Script
 *
 * Ensures Arabic translation files have the same structure as English files.
 * - Adds missing keys with a configurable placeholder value
 * - Removes keys that don't exist in English
 * - Sorts all keys alphabetically (nested objects sorted recursively)
 * - Reports all changes with a summary
 *
 * Usage:
 *   bun run scripts/sync-translations.ts          # Apply changes
 *   bun run scripts/sync-translations.ts --check   # Dry-run — exit 1 if unsync'd
 *
 * Missing-key placeholder strategy:
 *   By default, missing keys are filled with "[NEEDS_AR] <english_value>".
 *   This makes it trivial to grep for untranslated strings and prevents blank
 *   UI labels from reaching users. The marker is intentionally visible so
 *   reviewers/translators can search for "[NEEDS_AR]" across all JSON files.
 *
 *   To use empty strings instead, pass --empty-placeholder.
 */

import * as fs from 'fs'
import * as path from 'path'

const LOCALES_DIR = path.join(__dirname, '../src/locales')
const SOURCE_LANG = 'en'
const TARGET_LANG = 'ar'

const MISSING_PREFIX = '[NEEDS_AR]'

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const isDryRun = args.includes('--check')
const useEmptyPlaceholder = args.includes('--empty-placeholder')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TranslationObject {
  [key: string]: string | TranslationObject
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Recursively sort object keys alphabetically.
 */
function sortObjectKeys(obj: TranslationObject): TranslationObject {
  const sorted: TranslationObject = {}
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b))

  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'object' && value !== null) {
      sorted[key] = sortObjectKeys(value as TranslationObject)
    } else {
      sorted[key] = value
    }
  }

  return sorted
}

/**
 * Build the placeholder value for a missing translation key.
 */
function placeholder(sourceValue: string): string {
  if (useEmptyPlaceholder) return ''
  return `${MISSING_PREFIX} ${sourceValue}`
}

/**
 * Create target structure matching source, preserving existing translations.
 */
function syncStructure(
  source: TranslationObject,
  target: TranslationObject,
): TranslationObject {
  const result: TranslationObject = {}

  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]

    if (typeof sourceValue === 'object' && sourceValue !== null) {
      // Nested object — recurse
      result[key] = syncStructure(
        sourceValue as TranslationObject,
        (typeof targetValue === 'object' ? targetValue : {}) as TranslationObject,
      )
    } else {
      // String value — use existing translation or placeholder
      result[key] =
        typeof targetValue === 'string' ? targetValue : placeholder(sourceValue as string)
    }
  }

  return result
}

/**
 * Collect flat key paths that differ between source and target.
 */
function findDiffs(
  src: TranslationObject,
  tgt: TranslationObject,
  added: string[],
  removed: string[],
  prefix = '',
) {
  for (const key of Object.keys(src)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (!(key in tgt)) {
      added.push(fullKey)
    } else if (typeof src[key] === 'object' && typeof tgt[key] === 'object') {
      findDiffs(src[key] as TranslationObject, tgt[key] as TranslationObject, added, removed, fullKey)
    }
  }
  for (const key of Object.keys(tgt)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (!(key in src)) {
      removed.push(fullKey)
    }
  }
}

/**
 * Process a single namespace file.
 */
function processNamespace(namespace: string): { added: string[]; removed: string[] } {
  const sourcePath = path.join(LOCALES_DIR, SOURCE_LANG, `${namespace}.json`)
  const targetPath = path.join(LOCALES_DIR, TARGET_LANG, `${namespace}.json`)

  const added: string[] = []
  const removed: string[] = []

  // Read source file
  if (!fs.existsSync(sourcePath)) {
    console.warn(`  ⚠️  Source file not found: ${sourcePath}`)
    return { added, removed }
  }

  const sourceContent: TranslationObject = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'))

  // Read target file or create empty object
  let targetContent: TranslationObject = {}
  if (fs.existsSync(targetPath)) {
    targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf-8'))
  }

  // Find differences
  findDiffs(sourceContent, targetContent, added, removed)

  if (!isDryRun) {
    // Sync structure and sort
    const syncedContent = syncStructure(sourceContent, targetContent)
    const sortedSource = sortObjectKeys(sourceContent)
    const sortedTarget = sortObjectKeys(syncedContent)

    // Write sorted files
    fs.writeFileSync(sourcePath, JSON.stringify(sortedSource, null, 2) + '\n', 'utf-8')
    fs.writeFileSync(targetPath, JSON.stringify(sortedTarget, null, 2) + '\n', 'utf-8')
  }

  return { added, removed }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  if (isDryRun) {
    console.log('🔍 Checking translation sync (dry-run)...\n')
  } else {
    console.log('🔄 Syncing translation files...\n')
  }

  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG)

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`)
    process.exit(1)
  }

  // Ensure target directory exists
  const targetDir = path.join(LOCALES_DIR, TARGET_LANG)
  if (!fs.existsSync(targetDir)) {
    if (isDryRun) {
      console.error(`❌ Target directory not found: ${targetDir}`)
      process.exit(1)
    }
    fs.mkdirSync(targetDir, { recursive: true })
  }

  // Get all namespace files
  const namespaces = fs
    .readdirSync(sourceDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))

  let totalAdded = 0
  let totalRemoved = 0

  for (const namespace of namespaces) {
    const { added, removed } = processNamespace(namespace)

    console.log(`📄 ${namespace}.json`)
    if (added.length > 0) {
      console.log(
        `   ➕ Added ${added.length} key(s): ${added.slice(0, 5).join(', ')}${added.length > 5 ? '...' : ''}`,
      )
      totalAdded += added.length
    }
    if (removed.length > 0) {
      console.log(
        `   ➖ Removed ${removed.length} key(s): ${removed.slice(0, 5).join(', ')}${removed.length > 5 ? '...' : ''}`,
      )
      totalRemoved += removed.length
    }
    if (added.length === 0 && removed.length === 0) {
      console.log(`   ✅ Already in sync`)
    }
  }

  console.log('\n' + '─'.repeat(40))

  if (isDryRun) {
    if (totalAdded > 0 || totalRemoved > 0) {
      console.log(`❌ Out of sync! Missing: ${totalAdded}, Orphaned: ${totalRemoved}`)
      process.exit(1)
    }
    console.log('✅ All translation files are in sync.')
  } else {
    console.log(`✨ Done! Added: ${totalAdded}, Removed: ${totalRemoved}`)
    console.log('   All files sorted alphabetically.')
    if (!useEmptyPlaceholder && totalAdded > 0) {
      console.log(`   Missing translations marked with "${MISSING_PREFIX}" — grep to find them.`)
    }
  }
}

main()
