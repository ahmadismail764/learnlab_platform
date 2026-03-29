const ADMIN_OVERRIDE_KEY = 'learnlab_admin_override_emails'

function readOverrides(): string[] {
  try {
    const raw = localStorage.getItem(ADMIN_OVERRIDE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((v) => String(v).toLowerCase()) : []
  } catch {
    return []
  }
}

function writeOverrides(emails: string[]) {
  localStorage.setItem(ADMIN_OVERRIDE_KEY, JSON.stringify(Array.from(new Set(emails))))
}

export function addAdminOverrideEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return
  const current = readOverrides()
  writeOverrides([...current, normalized])
}

export function removeAdminOverrideEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return
  const current = readOverrides().filter((e) => e !== normalized)
  writeOverrides(current)
}

export function isAdminOverrideEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false
  return readOverrides().includes(normalized)
}

export function getAdminOverrideEmails(): string[] {
  return readOverrides()
}
