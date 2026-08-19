import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  invite: vi.fn(),
  createLinkInvite: vi.fn(),
}))

vi.mock('@/api/share', () => ({
  shareApi: {
    invite: mocks.invite,
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

const submit = async () => {
  host.querySelector('form').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  )
  await flush()
}

describe('ShareInviteView 초대 방식 안내', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.invite.mockResolvedValue({ data: { result: { inviteCode: 'code-1' } } })
    mountView()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  // 회의 질문: "이메일·전화번호 인증? why?" — 인증이 아니라 받는 사람 지정이라는
  // 사실이 화면에 없으면 불필요한 절차로 보인다.
  it('이메일/전화번호 초대는 그 계정만 수락할 수 있다고 알린다', () => {
    expect(host.textContent).toContain('여기에 적은 계정만 초대를 수락할 수 있어요')
  })

  // 링크 초대는 recipientType이 LINK라 서버가 수락자를 확인하지 않는다.
  it('링크 초대는 누구나 참여할 수 있다는 주의를 준다', () => {
    expect(host.textContent).toContain('링크를 가진 누구나 참여할 수 있으니')
  })

  it('초대를 만든 뒤 앱이 대신 보내지 않는다는 것을 알린다', async () => {
    const input = host.querySelector('#recipient')
    input.value = 'family@example.test'
    input.dispatchEvent(new Event('input'))
    await flush()

    await submit()

    expect(mocks.invite).toHaveBeenCalled()
    expect(host.textContent).toContain('family@example.test만 수락할 수 있는 링크를 만들었어요')
    expect(host.textContent).toContain('직접 전달해 주세요')
  })
})
