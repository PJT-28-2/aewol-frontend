import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  withdraw: vi.fn(),
  fetchProfile: vi.fn(),
  clearSession: vi.fn(),
  routerPush: vi.fn(),
  memberStore: {
    profile: { provider: 'KAKAO' },
    withdraw: vi.fn(),
    fetchProfile: vi.fn(),
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ clearSession: mocks.clearSession }),
}))

vi.mock('@/stores/member', () => ({
  useMemberStore: () => mocks.memberStore,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}))

import WithdrawView from './WithdrawView.vue'

let app
let host

describe('WithdrawView recovery policy', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    sessionStorage.clear()
    mocks.memberStore.profile = { provider: 'KAKAO' }
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(WithdrawView)
    app.mount(host)
    await nextTick()
  })

  afterEach(() => {
    app.unmount()
    host.remove()
  })

  it('LOCAL과 KAKAO 공통 30일 복구 가능 정책을 안내한다', () => {
    expect(host.textContent).toContain('탈퇴 후 30일 동안 계정 정보가 보관되며')
    expect(host.textContent).toContain('기간 내에는 계정을 복구할 수 있어요')
    expect(host.textContent).not.toContain('복구할 수 없어요')
    expect(host.textContent).not.toContain('모두 삭제')
  })

  it('KAKAO 탈퇴의 기존 store 및 완료 경로 동작을 유지한다', async () => {
    mocks.memberStore.withdraw.mockResolvedValue()
    const form = host.querySelector('form')

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await Promise.resolve()
    await nextTick()

    expect(mocks.memberStore.withdraw).toHaveBeenCalledWith(undefined)
    expect(mocks.clearSession).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('withdrawalCompleted')).toBe('true')
    expect(mocks.routerPush).toHaveBeenCalledWith('/withdraw/complete')
  })

  it('LOCAL 탈퇴의 비밀번호 전달 동작을 유지한다', async () => {
    app.unmount()
    mocks.memberStore.profile = { provider: 'LOCAL' }
    app = createApp(WithdrawView)
    app.mount(host)
    await nextTick()
    mocks.memberStore.withdraw.mockResolvedValue()
    const passwordInput = host.querySelector('#withdraw-password')
    passwordInput.value = 'current-password'
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    host.querySelector('form').dispatchEvent(new Event('submit', {
      bubbles: true,
      cancelable: true,
    }))
    await Promise.resolve()
    await nextTick()

    expect(mocks.memberStore.withdraw).toHaveBeenCalledWith('current-password')
    expect(mocks.clearSession).toHaveBeenCalledOnce()
    expect(mocks.routerPush).toHaveBeenCalledWith('/withdraw/complete')
  })
})
