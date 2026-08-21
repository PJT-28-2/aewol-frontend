import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  requestCode: vi.fn(),
  verifyCode: vi.fn(),
  resetPassword: vi.fn(),
}))

vi.mock('@/api/auth', () => ({
  authApi: {
    resetPasswordRequest: mocks.requestCode,
    resetPasswordVerify: mocks.verifyCode,
    resetPassword: mocks.resetPassword,
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

import PasswordResetView from './PasswordResetView.vue'

const deferred = () => {
  let resolve
  const promise = new Promise((next) => { resolve = next })
  return { promise, resolve }
}

let app
let host

const input = async (selector, value) => {
  const element = host.querySelector(selector)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

const buttonAfter = (selector) => {
  const element = host.querySelector(selector)
  let container = element.parentElement
  while (container && !container.querySelector(':scope > button')) {
    container = container.parentElement
  }
  return container?.querySelector(':scope > button') ?? null
}

const flushUpdates = async () => {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
}

describe('PasswordResetView request session stability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(PasswordResetView)
    app.component('RouterLink', { template: '<a><slot /></a>' })
    app.mount(host)
  })

  afterEach(() => {
    app.unmount()
    host.remove()
  })

  const sendCode = async (address = 'a@example.com') => {
    await input('#reset-email', address)
    buttonAfter('#reset-email').click()
    await flushUpdates()
  }

  it('ignores email A send response after changing to email B', async () => {
    const pending = deferred()
    mocks.requestCode.mockReturnValue(pending.promise)
    await sendCode('a@example.com')
    await input('#reset-email', 'b@example.com')

    pending.resolve({ data: { result: { expiresInSeconds: 180 } } })
    await nextTick()
    await nextTick()

    expect(host.textContent).not.toContain('03:00')
  })

  it('ignores email A reset token after changing to email B during verify', async () => {
    mocks.requestCode.mockResolvedValue({ data: { result: { expiresInSeconds: 180 } } })
    const pending = deferred()
    mocks.verifyCode.mockReturnValue(pending.promise)
    await sendCode()
    await input('#verification-code', '123456')
    buttonAfter('#verification-code').click()
    await flushUpdates()
    await input('#reset-email', 'b@example.com')

    pending.resolve({ data: { result: { resetToken: 'token-a' } } })
    await nextTick()
    await nextTick()

    expect(host.querySelector('#new-password')).toBeNull()
  })

  it('clears sent, OTP, timer, verification, and reset-token state on email change', async () => {
    mocks.requestCode.mockResolvedValue({ data: { result: { expiresInSeconds: 180 } } })
    mocks.verifyCode.mockResolvedValue({ data: { result: { resetToken: 'token-a' } } })
    await sendCode()
    await input('#verification-code', '123456')
    buttonAfter('#verification-code').click()
    await flushUpdates()
    expect(host.querySelector('#new-password')).not.toBeNull()

    await input('#reset-email', 'b@example.com')

    expect(host.querySelector('#verification-code').value).toBe('')
    expect(host.querySelector('#new-password')).toBeNull()
    expect(host.textContent).not.toContain('03:00')
  })

  it('keeps the normal send, verify, and reset flow', async () => {
    mocks.requestCode.mockResolvedValue({ data: { result: { expiresInSeconds: 180 } } })
    mocks.verifyCode.mockResolvedValue({ data: { result: { resetToken: 'reset-token' } } })
    mocks.resetPassword.mockResolvedValue({ data: {} })
    await sendCode()
    await input('#verification-code', '123456')
    buttonAfter('#verification-code').click()
    await flushUpdates()
    await input('#new-password', 'Password1!')
    await input('#new-password-confirm', 'Password1!')
    host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()

    expect(mocks.resetPassword).toHaveBeenCalledWith('reset-token', 'Password1!')
  })

  it('supports resend after an existing or expired code', async () => {
    mocks.requestCode
      .mockResolvedValueOnce({ data: { result: { expiresInSeconds: 1 } } })
      .mockResolvedValueOnce({ data: { result: { expiresInSeconds: 180 } } })
    await sendCode()
    buttonAfter('#reset-email').click()
    await flushUpdates()

    expect(mocks.requestCode).toHaveBeenCalledTimes(2)
    expect(host.textContent).toContain('03:00')
  })
})
