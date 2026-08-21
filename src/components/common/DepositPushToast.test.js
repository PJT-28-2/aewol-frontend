import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

import DepositPushToast from './DepositPushToast.vue'

let app
let host

const mountToast = (props = {}) => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(DepositPushToast, { bankCode: '004', ...props })
  app.mount(host)
}

// Transition 진입 애니메이션까지 끝난 시점의 DOM을 보기 위해 마이크로태스크를 비운다.
const flush = async () => {
  await Promise.resolve()
  await nextTick()
}

// jsdom에는 실제 CSS 전환이 없어서 Transition의 leave가 다음 프레임까지 기다린 뒤에야
// DOM에서 빠진다. 사라짐을 검증하는 테스트는 이 헬퍼로 그 프레임까지 흘려준다.
const flushLeave = async () => {
  await flush()
  vi.advanceTimersByTime(300)
  await flush()
  await flush()
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  if (app) app.unmount()
  if (host) host.remove()
  app = null
  host = null
  vi.useRealTimers()
})

describe('DepositPushToast', () => {
  it('입금자명이 없으면 알림 카드를 띄우지 않는다', async () => {
    mountToast({ depositorName: null })

    vi.advanceTimersByTime(5000)
    await flush()

    expect(document.body.textContent).not.toContain('시연용 모의 알림')
  })

  it('입금자명이 들어와도 지연 시간 전에는 뜨지 않는다 - 즉시 뜨면 응답 값을 그대로 찍은 것처럼 보인다', async () => {
    mountToast({ depositorName: '좁은바다', delayMs: 1200 })

    vi.advanceTimersByTime(1000)
    await flush()

    expect(document.body.textContent).not.toContain('좁은바다')
  })

  it('지연 시간이 지나면 은행명, 입금 금액, 입금자명을 담은 알림 카드가 뜬다', async () => {
    mountToast({ depositorName: '좁은바다', delayMs: 1200 })

    vi.advanceTimersByTime(1200)
    await flush()

    const text = document.body.textContent
    expect(text).toContain('KB국민은행')
    expect(text).toContain('1원')
    expect(text).toContain('좁은바다')
  })

  it('실제 은행 알림으로 오해하지 않도록 시연용 라벨을 항상 함께 보여준다', async () => {
    mountToast({ depositorName: '좁은바다', delayMs: 0 })

    vi.advanceTimersByTime(0)
    await flush()

    expect(document.body.textContent).toContain('시연용 모의 알림')
  })

  it('닫기 버튼을 누르면 알림 카드가 사라진다', async () => {
    mountToast({ depositorName: '좁은바다', delayMs: 0 })
    vi.advanceTimersByTime(0)
    await flush()

    host.querySelector('button[aria-label="알림 닫기"]').click()
    await flushLeave()

    expect(document.body.textContent).not.toContain('좁은바다')
  })

  it('재전송으로 입금자명이 바뀌면 이전 카드를 내리고 새 입금자명으로 다시 띄운다', async () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    // 재전송 시나리오는 props 갱신이 필요해서 부모 컴포넌트로 감싼다.
    const parent = {
      components: { DepositPushToast },
      data: () => ({ name: '좁은바다' }),
      template: '<DepositPushToast bank-code="004" :depositor-name="name" :delay-ms="1200" />',
    }
    app = createApp(parent)
    const vm = app.mount(host)

    vi.advanceTimersByTime(1200)
    await flush()
    expect(document.body.textContent).toContain('좁은바다')

    vm.name = '파란하늘'
    await flushLeave()
    // 새 카드는 아직 지연 중이라 이전 입금자명이 남아있으면 안 된다.
    expect(document.body.textContent).not.toContain('좁은바다')

    vi.advanceTimersByTime(1200)
    await flush()
    expect(document.body.textContent).toContain('파란하늘')
  })
})
