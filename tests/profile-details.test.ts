import { describe, expect, it } from 'vitest'
import { applyProfileDetails } from '@/features/auth/utils/profile-details'

const current = {
  id: 'local-user',
  email: 'you@ajx.tax',
  displayName: 'you',
}

describe('applyProfileDetails', () => {
  it('saves trimmed name and email in local mode', () => {
    const result = applyProfileDetails(
      current,
      { displayName: '  Adam Woolley  ', email: ' adam@example.com ' },
      { allowEmailEdit: true },
    )
    expect(result).toEqual({
      ok: true,
      user: {
        id: 'local-user',
        displayName: 'Adam Woolley',
        email: 'adam@example.com',
      },
    })
  })

  it('rejects empty name', () => {
    const result = applyProfileDetails(
      current,
      { displayName: '   ', email: 'adam@example.com' },
      { allowEmailEdit: true },
    )
    expect(result).toEqual({ ok: false, error: 'Enter your name.' })
  })

  it('rejects invalid email when email is editable', () => {
    const result = applyProfileDetails(
      current,
      { displayName: 'Adam', email: 'not-an-email' },
      { allowEmailEdit: true },
    )
    expect(result).toEqual({ ok: false, error: 'Enter a valid email address.' })
  })

  it('keeps existing email when email edit is disabled', () => {
    const result = applyProfileDetails(
      current,
      { displayName: 'Adam Woolley', email: 'ignored@example.com' },
      { allowEmailEdit: false },
    )
    expect(result).toEqual({
      ok: true,
      user: {
        id: 'local-user',
        displayName: 'Adam Woolley',
        email: 'you@ajx.tax',
      },
    })
  })
})
