import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  requestCode: vi.fn(),
  verifyCode: vi.fn(),
}))

vi.mock('@/api/auth', () => ({
  authApi: {
    requestFindAccountCode: mocks.requestCode,
    verifyFindAccountCode: mocks.verifyCode,
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

import FindIdView from './FindIdView.vue'

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

const click = async (selector) => {
  host.querySelector(selector).click()
  await nextTick()
}

describe('FindIdView request session stability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(FindIdView)
    app.component('RouterLink', { template: '<a><slot /></a>' })
    app.mount(host)
  })

  afterEach(() => {
    app.unmount()
    host.remove()
  })

  const fillIdentity = async (phone = '01012345678') => {
    await input('#find-account-name', 'Test User')
    await input('#find-account-phone', phone)
  }

  it('ignores a late send response after the phone changes', async () => {
    const pending = deferred()
    mocks.requestCode.mockReturnValue(pending.promise)
    await fillIdentity('01011112222')
    await click('button[type="button"]:not([aria-label])')

    await input('#find-account-phone', '01033334444')
    pending.resolve({ data: { result: { requestId: 'request-a', expiresInSeconds: 180 } } })
    await nextTick()
    await nextTick()

    expect(host.querySelector('#find-account-code').disabled).toBe(true)
    expect(host.textContent).not.toContain('03:00')
  })

  it('clears an established request session when the phone changes', async () => {
    mocks.requestCode.mockResolvedValue({
      data: { result: { requestId: 'request-a', expiresInSeconds: 180 } },
    })
    await fillIdentity()
    await click('button[type="button"]:not([aria-label])')
    await nextTick()
    expect(host.querySelector('#find-account-code').disabled).toBe(false)

    await input('#find-account-phone', '01099998888')

    expect(host.querySelector('#find-account-code').disabled).toBe(true)
    expect(host.querySelector('#find-account-code').value).toBe('')
  })

  it('ignores a late verify response after identity input changes', async () => {
    mocks.requestCode.mockResolvedValue({
      data: { result: { requestId: 'request-a', expiresInSeconds: 180 } },
    })
    const pending = deferred()
    mocks.verifyCode.mockReturnValue(pending.promise)
    await fillIdentity()
    await click('button[type="button"]:not([aria-label])')
    await input('#find-account-code', '123456')
    await click('button[type="submit"]')

    await input('#find-account-phone', '01099998888')
    pending.resolve({ data: { result: { provider: 'LOCAL', maskedEmail: 't***@aewol.com' } } })
    await nextTick()
    await nextTick()

    expect(host.textContent).not.toContain('t***@aewol.com')
  })

  it.each([
    { provider: 'LOCAL', maskedEmail: 't***@aewol.com', expected: 't***@aewol.com' },
    { provider: 'KAKAO', maskedEmail: null, expected: '카카오 계정' },
  ])('keeps the normal $provider account result flow', async ({ provider, maskedEmail, expected }) => {
    mocks.requestCode.mockResolvedValue({
      data: { result: { requestId: 'request-a', expiresInSeconds: 180 } },
    })
    mocks.verifyCode.mockResolvedValue({ data: { result: { provider, maskedEmail } } })
    await fillIdentity()
    await click('button[type="button"]:not([aria-label])')
    await input('#find-account-code', '123456')
    await click('button[type="submit"]')
    await nextTick()

    expect(host.textContent).toContain(expected)
  })

  it('supports resend after an existing send', async () => {
    mocks.requestCode
      .mockResolvedValueOnce({ data: { result: { requestId: 'first', expiresInSeconds: 1 } } })
      .mockResolvedValueOnce({ data: { result: { requestId: 'second', expiresInSeconds: 180 } } })
    await fillIdentity()
    await click('button[type="button"]:not([aria-label])')
    await click('button[type="button"]:not([aria-label])')

    expect(mocks.requestCode).toHaveBeenCalledTimes(2)
    expect(host.querySelector('#find-account-code').disabled).toBe(false)
  })
})
