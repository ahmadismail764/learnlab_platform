#!/usr/bin/env node
/**
 * Translation Prune Script
 *
 * Removes translation keys that are no longer referenced by frontend code.
 * - Scans frontend TypeScript/JavaScript files, excluding locale files and i18n resource imports
 * - Detects direct t('namespace:key') calls and config-driven key strings
 * - Keeps backend-driven namespaces whose keys cannot be inferred statically
 * - Applies the same pruning across every language folder
 *
 * Usage:
 *   bun run scripts/prune-translations.ts          # Apply changes
 *   bun run scripts/prune-translations.ts --check  # Dry-run, exit 1 if unused keys exist
 *   bun run scripts/prune-translations.ts --verbose
 */

import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.join(__dirname, '../src')
const LOCALES_DIR = path.join(SRC_DIR, 'locales')
const SOURCE_LANG = 'en'
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const args = process.argv.slice(2)
const isDryRun = args.includes('--check')
const isVerbose = args.includes('--verbose')

type TranslationValue = string | TranslationObject
interface TranslationObject {
  [key: string]: TranslationValue
}

interface PruneSummary {
  language: string
  namespace: string
  removed: string[]
}

/**
 * Topic labels are selected from backend-provided names, so their translation
 * keys cannot always be inferred from static frontend source.
 */
const BACKEND_DRIVEN_NAMESPACES = new Set(['topics'])

function readJson(filePath: string): TranslationObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TranslationObject
}

function writeJson(filePath: string, value: TranslationObject) {
  fs.writeFileSync(filePath, `${JSON.stringify(sortObjectKeys(value), null, 2)}\n`, 'utf-8')
}

function sortObjectKeys(obj: TranslationObject): TranslationObject {
  const sorted: TranslationObject = {}

  for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    const value = obj[key]
    sorted[key] =
      typeof value === 'object' && value !== null
        ? sortObjectKeys(value as TranslationObject)
        : value
  }

  return sorted
}

function flattenKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null) {
      keys.push(...flattenKeys(value as TranslationObject, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

function markUsed(used: Map<string, Set<string>>, namespace: string, key: string) {
  if (!namespace || !key) return

  const namespaceKeys = used.get(namespace) ?? new Set<string>()
  namespaceKeys.add(key)
  used.set(namespace, namespaceKeys)
}

function readSourceTranslations() {
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG)

  if (!fs.existsSync(sourceDir)) {
    console.error(`Source locale directory not found: ${sourceDir}`)
    process.exit(1)
  }

  const namespaces = fs
    .readdirSync(sourceDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))

  const keysByNamespace = new Map<string, Set<string>>()

  for (const namespace of namespaces) {
    const sourcePath = path.join(sourceDir, `${namespace}.json`)
    keysByNamespace.set(namespace, new Set(flattenKeys(readJson(sourcePath))))
  }

  return keysByNamespace
}

function getSourceFiles(dir: string): string[] {
  const files: string[] = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entryPath === LOCALES_DIR) continue
      files.push(...getSourceFiles(entryPath))
      continue
    }

    if (!entry.isFile()) continue
    if (entryPath.endsWith(`${path.sep}i18n.ts`)) continue
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }

  return files
}

function markKeyText(
  text: string,
  used: Map<string, Set<string>>,
  keysByNamespace: Map<string, Set<string>>,
  defaultNamespaces: Set<string>,
) {
  const namespaceSeparator = text.indexOf(':')

  if (namespaceSeparator > 0) {
    const namespace = text.slice(0, namespaceSeparator)
    const key = text.slice(namespaceSeparator + 1)
    const namespaceKeys = keysByNamespace.get(namespace)

    if (namespaceKeys?.has(key)) {
      markUsed(used, namespace, key)
      return
    }

    const dynamicStart = key.indexOf('${')
    const staticPrefix = dynamicStart >= 0 ? key.slice(0, dynamicStart) : ''

    if (namespaceKeys && staticPrefix) {
      for (const candidate of namespaceKeys) {
        if (candidate.startsWith(staticPrefix)) {
          markUsed(used, namespace, candidate)
        }
      }
    }
    return
  }

  for (const namespace of defaultNamespaces) {
    if (keysByNamespace.get(namespace)?.has(text)) {
      markUsed(used, namespace, text)
    }
  }

  for (const [namespace, namespaceKeys] of keysByNamespace) {
    if (namespaceKeys.has(text)) {
      markUsed(used, namespace, text)
    }
  }
}

function getCapturedValue(match: RegExpExecArray) {
  const value = match.slice(1).find((group) => group !== undefined) ?? ''
  return value.replace(/\\(['"`\\])/g, '$1')
}

function extractSimpleQuotedStrings(sourceText: string) {
  const strings: string[] = []
  const stringPattern = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`/g
  let match: RegExpExecArray | null

  while ((match = stringPattern.exec(sourceText)) !== null) {
    strings.push(getCapturedValue(match))
  }

  return strings
}

function extractCandidateKeyTexts(sourceText: string) {
  const candidates = new Set<string>()
  const patterns = [
    /\bt\s*\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`)/g,
    /\b(?:labelKey|titleKey|messageKey|timeKey|descKey|subKey|nameKey|descriptionKey)\s*:\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`)/g,
    /"([A-Za-z][\w-]+:[A-Za-z0-9_.${}-]+)"|'([A-Za-z][\w-]+:[A-Za-z0-9_.${}-]+)'|`([A-Za-z][\w-]+:[A-Za-z0-9_.${}-]+)`/g,
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null

    while ((match = pattern.exec(sourceText)) !== null) {
      candidates.add(getCapturedValue(match))
    }
  }

  return candidates
}

function collectDefaultNamespaces(sourceText: string) {
  const namespaces = new Set<string>()
  const useTranslationPattern = /useTranslation\s*\(([^)]*)\)/g
  let match: RegExpExecArray | null

  while ((match = useTranslationPattern.exec(sourceText)) !== null) {
    const argumentText = match[1].trim()

    if (!argumentText) {
      namespaces.add('common')
      continue
    }

    for (const namespace of extractSimpleQuotedStrings(argumentText)) {
      if (!namespace.includes(':')) {
        namespaces.add(namespace)
      }
    }
  }

  if (namespaces.size === 0) {
    namespaces.add('common')
  }

  return namespaces
}

function collectUsedKeys(keysByNamespace: Map<string, Set<string>>) {
  const used = new Map<string, Set<string>>()

  for (const namespace of BACKEND_DRIVEN_NAMESPACES) {
    const namespaceKeys = keysByNamespace.get(namespace)
    if (!namespaceKeys) continue

    for (const key of namespaceKeys) {
      markUsed(used, namespace, key)
    }
  }

  for (const sourcePath of getSourceFiles(SRC_DIR)) {
    const sourceText = fs.readFileSync(sourcePath, 'utf-8')
    const defaultNamespaces = collectDefaultNamespaces(sourceText)

    for (const text of extractCandidateKeyTexts(sourceText)) {
      markKeyText(text, used, keysByNamespace, defaultNamespaces)
    }
  }

  return used
}

function pruneObject(
  obj: TranslationObject,
  usedKeys: Set<string>,
  prefix = '',
): { value: TranslationObject; removed: string[] } {
  const next: TranslationObject = {}
  const removed: string[] = []

  for (const [key, child] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof child === 'object' && child !== null) {
      const pruned = pruneObject(child as TranslationObject, usedKeys, fullKey)

      if (Object.keys(pruned.value).length > 0) {
        next[key] = pruned.value
      }

      removed.push(...pruned.removed)
      continue
    }

    if (usedKeys.has(fullKey)) {
      next[key] = child
    } else {
      removed.push(fullKey)
    }
  }

  return { value: sortObjectKeys(next), removed }
}

function getLocaleLanguages() {
  return fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function formatKeyList(keys: string[]) {
  if (isVerbose || keys.length <= 8) {
    return keys.join(', ')
  }

  return `${keys.slice(0, 8).join(', ')}...`
}

function main() {
  const keysByNamespace = readSourceTranslations()
  const used = collectUsedKeys(keysByNamespace)
  const summaries: PruneSummary[] = []

  for (const language of getLocaleLanguages()) {
    for (const namespace of keysByNamespace.keys()) {
      const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`)

      if (!fs.existsSync(filePath)) continue

      const content = readJson(filePath)
      const namespaceUsedKeys = used.get(namespace) ?? new Set<string>()
      const { value, removed } = pruneObject(content, namespaceUsedKeys)

      if (removed.length > 0) {
        summaries.push({ language, namespace, removed })

        if (!isDryRun) {
          writeJson(filePath, value)
        }
      }
    }
  }

  if (isDryRun) {
    console.log('Checking for unused translation keys...\n')
  } else {
    console.log('Pruning unused translation keys...\n')
  }

  if (summaries.length === 0) {
    console.log('All translation keys are referenced.')
    return
  }

  let totalRemoved = 0

  for (const summary of summaries) {
    totalRemoved += summary.removed.length
    console.log(`${summary.language}/${summary.namespace}.json`)
    console.log(`  Removed ${summary.removed.length}: ${formatKeyList(summary.removed)}`)
  }

  console.log(`\nTotal unused keys: ${totalRemoved}`)

  if (isDryRun) {
    process.exit(1)
  }
}

main()
