#!/usr/bin/env node
/**
 * Translation Sync Script
 * 
 * Ensures Arabic translation files have the same structure as English files.
 * - Adds missing keys with empty string values
 * - Removes keys that don't exist in English
 * - Sorts all keys alphabetically (nested objects sorted recursively)
 * 
 * Usage:
 *   bun run scripts/sync-translations.ts
 *   npx ts-node scripts/sync-translations.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const LOCALES_DIR = path.join(__dirname, '../src/locales')
const SOURCE_LANG = 'en'
const TARGET_LANG = 'ar'

interface TranslationObject {
  [key: string]: string | TranslationObject
}

/**
 * Recursively sort object keys alphabetically
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
 * Create empty structure matching source, preserving existing translations
 */
function syncStructure(
  source: TranslationObject, 
  target: TranslationObject
): TranslationObject {
  const result: TranslationObject = {}
  
  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]
    
    if (typeof sourceValue === 'object' && sourceValue !== null) {
      // Nested object - recurse
      result[key] = syncStructure(
        sourceValue as TranslationObject,
        (typeof targetValue === 'object' ? targetValue : {}) as TranslationObject
      )
    } else {
      // String value - use existing translation or empty string
      result[key] = typeof targetValue === 'string' ? targetValue : ''
    }
  }
  
  return result
}

/**
 * Process a single namespace file
 */
function processNamespace(namespace: string): { added: string[], removed: string[] } {
  const sourcePath = path.join(LOCALES_DIR, SOURCE_LANG, `${namespace}.json`)
  const targetPath = path.join(LOCALES_DIR, TARGET_LANG, `${namespace}.json`)
  
  const added: string[] = []
  const removed: string[] = []
  
  // Read source file
  if (!fs.existsSync(sourcePath)) {
    console.warn(`  ⚠️  Source file not found: ${sourcePath}`)
    return { added, removed }
  }
  
  const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'))
  
  // Read target file or create empty object
  let targetContent: TranslationObject = {}
  if (fs.existsSync(targetPath)) {
    targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf-8'))
  }
  
  // Find differences
  function findDiffs(src: TranslationObject, tgt: TranslationObject, prefix = '') {
    for (const key of Object.keys(src)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (!(key in tgt)) {
        added.push(fullKey)
      } else if (typeof src[key] === 'object' && typeof tgt[key] === 'object') {
        findDiffs(src[key] as TranslationObject, tgt[key] as TranslationObject, fullKey)
      }
    }
    for (const key of Object.keys(tgt)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (!(key in src)) {
        removed.push(fullKey)
      }
    }
  }
  
  findDiffs(sourceContent, targetContent)
  
  // Sync structure and sort
  const syncedContent = syncStructure(sourceContent, targetContent)
  const sortedSource = sortObjectKeys(sourceContent)
  const sortedTarget = sortObjectKeys(syncedContent)
  
  // Write sorted files
  fs.writeFileSync(sourcePath, JSON.stringify(sortedSource, null, 2) + '\n', 'utf-8')
  fs.writeFileSync(targetPath, JSON.stringify(sortedTarget, null, 2) + '\n', 'utf-8')
  
  return { added, removed }
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Syncing translation files...\n')
  
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG)
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`)
    process.exit(1)
  }
  
  // Ensure target directory exists
  const targetDir = path.join(LOCALES_DIR, TARGET_LANG)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  
  // Get all namespace files
  const namespaces = fs.readdirSync(sourceDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
  
  let totalAdded = 0
  let totalRemoved = 0
  
  for (const namespace of namespaces) {
    const { added, removed } = processNamespace(namespace)
    
    console.log(`📄 ${namespace}.json`)
    if (added.length > 0) {
      console.log(`   ➕ Added ${added.length} key(s): ${added.slice(0, 3).join(', ')}${added.length > 3 ? '...' : ''}`)
      totalAdded += added.length
    }
    if (removed.length > 0) {
      console.log(`   ➖ Removed ${removed.length} key(s): ${removed.slice(0, 3).join(', ')}${removed.length > 3 ? '...' : ''}`)
      totalRemoved += removed.length
    }
    if (added.length === 0 && removed.length === 0) {
      console.log(`   ✅ Already in sync`)
    }
  }
  
  console.log('\n' + '─'.repeat(40))
  console.log(`✨ Done! Added: ${totalAdded}, Removed: ${totalRemoved}`)
  console.log('   All files sorted alphabetically.')
}

main()
