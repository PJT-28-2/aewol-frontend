import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  createLinkInvite: vi.fn(),
}))

vi.mock('@/api/share', () => ({
  shareApi: {
    createLinkInvite: mocks.createLinkInvite,
    getPets: vi.fn(),
    getMembers: vi.fn(),
    getContributions: vi.fn(),
    getLogs: vi.fn(),
    getInvite: vi.fn(),
    acceptInvite: vi.fn(),
  },
}))

import ShareInviteView from './ShareInviteView.vue'

let app
let host

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const mountView = () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(ShareInviteView, { petId: 'p1' })
  app.use(createPinia())
  app.mount(host)
}

const button = (label) =>
  [...host.querySelectorAll('button')].find((el) => el.textContent.trim() === label)

const respondWith = (minutes) =>
  mocks.createLinkInvite.mockResolvedValue({
    data: {
      result: {
        inviteCode: 'code-1',
        expiresAt: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
      },
    },
  })

const submit = async () => {
  host.querySelector('form').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  )
  await flush()
}

describe('ShareInviteView 유효시간 링크 초대', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    respondWith(10)
    mountView()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
    vi.useRealTimers()
  })

  // 받는 사람 지정 방식은 앱이 메일·문자를 보내지도 않으면서 입력만 받아 이질적이었다.
  it('받는 사람 입력칸을 두지 않는다', () => {
    expect(host.querySelector('#recipient')).toBeNull()
    expect(host.textContent).not.toContain('이메일 또는 휴대전화 번호')
  })

  it('기본 유효시간은 10분이다', async () => {
    await submit()

    expect(mocks.createLinkInvite).toHaveBeenCalledWith(
      expect.objectContaining({ petId: 'p1', expiresInMinutes: 10 }),
    )
  })

  it('고른 유효시간을 그대로 보낸다', async () => {
    button('5분').click()
    await flush()
    await submit()

    expect(mocks.createLinkInvite).toHaveBeenCalledWith(
      expect.objectContaining({ expiresInMinutes: 5 }),
    )
  })

  // 시간이 유일한 방어선이라, 고르는 자리에서 위험을 알려야 짧게 잡는다.
  it('링크를 본 누구나 참여할 수 있다는 것을 미리 알린다', () => {
    expect(host.textContent).toContain('누구나 참여할 수 있어요')
    expect(host.textContent).toContain('한 명이 참여하면 링크는 바로 만료돼요')
  })

  it('링크를 만들면 남은 시간을 보여준다', async () => {
    await submit()

    expect(host.textContent).toContain('남음')
    expect(host.querySelector('[aria-label="만들어진 초대 링크"]')).toBeTruthy()
    expect(host.textContent).toContain('/share/join?invite=code-1')
  })

  // 유효시간만 바꾸고 새 링크를 안 만들면, 화면에 남은 옛 링크가 새 설정으로 보인다.
  it('유효시간을 다시 고르면 이전 링크를 지운다', async () => {
    await submit()
    expect(host.textContent).toContain('/share/join?invite=code-1')

    button('30분').click()
    await flush()

    expect(host.textContent).not.toContain('/share/join?invite=code-1')
  })

  it('시간이 지나면 만료로 바꾸고 복사를 막는다', async () => {
    vi.useFakeTimers()
    respondWith(0.05) // 3초
    await submit()

    vi.advanceTimersByTime(4000)
    await flush()

    expect(host.textContent).toContain('만료됨')
    expect(button('링크 복사').disabled).toBe(true)
  })
})
