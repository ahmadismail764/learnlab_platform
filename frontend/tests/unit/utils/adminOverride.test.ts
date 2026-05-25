import { describe, it, expect, beforeEach } from 'vitest'
import {
  addAdminOverrideEmail,
  removeAdminOverrideEmail,
  isAdminOverrideEmail,
  getAdminOverrideEmails
} from '@/utils/adminOverride'

const ADMIN_OVERRIDE_KEY = 'learnlab_admin_override_emails'

describe('adminOverride utility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty array of overrides', () => {
    expect(getAdminOverrideEmails()).toEqual([])
  })

  it('adds emails while trimming whitespace and converting to lowercase', () => {
    addAdminOverrideEmail('  Admin@LearnLab.Com  ')
    
    expect(getAdminOverrideEmails()).toEqual(['admin@learnlab.com'])
    expect(isAdminOverrideEmail('admin@learnlab.com')).toBe(true)
    expect(isAdminOverrideEmail('  ADMIN@learnlab.com ')).toBe(true)
  })

  it('ignores empty, blank or whitespace-only emails', () => {
    addAdminOverrideEmail('   ')
    expect(getAdminOverrideEmails()).toEqual([])
  })

  it('does not add duplicate emails', () => {
    addAdminOverrideEmail('admin@learnlab.com')
    addAdminOverrideEmail('ADMIN@learnlab.com')
    addAdminOverrideEmail('  admin@learnlab.com  ')

    expect(getAdminOverrideEmails()).toEqual(['admin@learnlab.com'])
  })

  it('removes emails correctly and ignores missing ones', () => {
    addAdminOverrideEmail('admin1@learnlab.com')
    addAdminOverrideEmail('admin2@learnlab.com')

    removeAdminOverrideEmail('  ADMIN1@learnlab.com ')
    expect(getAdminOverrideEmails()).toEqual(['admin2@learnlab.com'])

    // Remove non-existent
    removeAdminOverrideEmail('unknown@learnlab.com')
    expect(getAdminOverrideEmails()).toEqual(['admin2@learnlab.com'])
  })

  it('handles corrupted localStorage values gracefully', () => {
    localStorage.setItem(ADMIN_OVERRIDE_KEY, '{invalid-json')
    
    // Reading should not crash, it should fallback to empty list
    expect(getAdminOverrideEmails()).toEqual([])
    
    // Writing should overwrite the corrupt item correctly
    addAdminOverrideEmail('safe@learnlab.com')
    expect(getAdminOverrideEmails()).toEqual(['safe@learnlab.com'])
  })

  it('handles non-array objects stored in localStorage', () => {
    localStorage.setItem(ADMIN_OVERRIDE_KEY, JSON.stringify({ email: 'test@learnlab.com' }))
    
    expect(getAdminOverrideEmails()).toEqual([])
    
    addAdminOverrideEmail('test@learnlab.com')
    expect(getAdminOverrideEmails()).toEqual(['test@learnlab.com'])
  })
})
