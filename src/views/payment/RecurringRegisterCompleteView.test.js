import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  query: {},
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.query }),
  useRouter: () => ({ replace: mocks.replace }),
}))

import RecurringRegisterCompleteView from './RecurringRegisterCompleteView.vue'

let app
let host

describe('RecurringRegisterCompleteView 첫 회 결제', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocks.query = { dayOfMonth: '15', amount: '12900' }
    mocks.replace.mockReset()
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(RecurringRegisterCompleteView)
    app.use(createPinia())
    app.mount(host)
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('오늘 첫 회가 결제됐고 다음부터 매월 결제된다고 안내한다', () => {
    expect(host.querySelector('h1').textContent.trim()).toBe('정기결제 등록 완료')
    expect(host.textContent).toContain('오늘 12,900원이 결제됐어요')
    expect(host.textContent).toContain('다음부터 매월 15일에 자동으로 결제돼요')
  })
})
