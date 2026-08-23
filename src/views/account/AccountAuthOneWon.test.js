import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// 시연용 입금자명 자동 입력(#366) 동작만 확인해요. 푸시 알림 카드(DepositPushToast)를
// 쓰던 때의 테스트를 대체해요 — 이제는 백엔드가 verify-deposit 응답에 실어 보낸
// depositorNameForTest가 있으면 입력 박스에 바로 채우고, 없으면 아무것도 하지 않아요.

const mocks = vi.hoisted(() => ({
  requestDepositVerification: vi.fn(),
}))

vi.mock('@/api/account', () => ({
  getBanks: vi.fn(),
  getAccounts: vi.fn(),
  requestDepositVerification: mocks.requestDepositVerification,
  confirmDepositVerification: vi.fn(),
  registerAccount: vi.fn(),
  setPrimaryAccount: vi.fn(),
  unlinkAccount: vi.fn(),
  setSimplePassword: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

import AccountAuthOneWon from './AccountAuthOneWon.vue'
import { useAccountStore } from '@/stores/account'

const verifyDepositResponse = (overrides = {}) => ({
  data: {
    result: {
      transactionId: 'tx-1',
      depositorNameLength: 4,
      ...overrides,
    },
  },
})

let app
let host
let pinia
let store

// 마이크로태스크(요청 mock resolve → store 반영 → step 전환 → nextTick → 자동 입력)가
// 전부 끝날 때까지 기다려요.
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
  await nextTick()
}

const hiddenInput = () => host.querySelector('input[aria-label^="입금자명 인증 코드"]')
const confirmButton = () => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === '확인')

const mount = () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(AccountAuthOneWon)
  app.use(pinia)
  app.mount(host)
}

const requestDeposit = async () => {
  const accountInput = host.querySelector('input[inputmode="numeric"]')
  accountInput.value = '1234567890'
  accountInput.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
  host.querySelector('button').click()
  await flush()
}

describe('AccountAuthOneWon 시연용 입금자명 자동 입력', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pinia = createPinia()
    setActivePinia(pinia)
    store = useAccountStore()
    store.selectBankToLink('004')
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('백엔드가 입금자명을 내려주면 입력 박스에 바로 채우고 확인 버튼을 활성화한다', async () => {
    mocks.requestDepositVerification.mockResolvedValue(
      verifyDepositResponse({ depositorNameForTest: '푸른애월' }),
    )
    mount()

    await requestDeposit()

    expect(hiddenInput().value).toBe('푸른애월')
    const boxes = [...host.querySelectorAll('.pointer-events-none')].map((el) => el.textContent.trim())
    expect(boxes).toEqual(['푸', '른', '애', '월'])
    expect(confirmButton().disabled).toBe(false)
  })

  it('입금자명이 내려오지 않으면(운영 환경) 아무것도 채우지 않는다', async () => {
    mocks.requestDepositVerification.mockResolvedValue(verifyDepositResponse())
    mount()

    await requestDeposit()

    expect(hiddenInput().value).toBe('')
    expect(confirmButton().disabled).toBe(true)
  })

  it('다시 보내기로 새 입금자명이 오면 새 값으로 바꿔 채운다', async () => {
    mocks.requestDepositVerification.mockResolvedValueOnce(
      verifyDepositResponse({ depositorNameForTest: '푸른애월' }),
    )
    mount()
    await requestDeposit()
    expect(hiddenInput().value).toBe('푸른애월')

    // 잠금 상태로 만들면 타이머 대신 "다시 보내기" 버튼이 보여요.
    store.linking.isConfirmLocked = true
    await nextTick()
    mocks.requestDepositVerification.mockResolvedValueOnce(
      verifyDepositResponse({ transactionId: 'tx-2', depositorNameForTest: '노란바다' }),
    )
    const resendButton = [...host.querySelectorAll('button')].find((b) => b.textContent.includes('다시 보내기'))
    resendButton.click()
    await flush()

    expect(hiddenInput().value).toBe('노란바다')
    expect(confirmButton().disabled).toBe(false)
  })

  it('인증 진행 중 화면을 나갔다 들어오면(재마운트) 글자 수에 맞춰 다시 채운다', async () => {
    // 재마운트 시점엔 store에 이미 응답이 반영돼 있어요 — 5글자 입금자명도 그대로 따라가요.
    store.linking.verificationId = 'tx-1'
    store.linking.depositAuthExpiresAt = Date.now() + 120_000
    store.linking.depositorNameLength = 5
    store.linking.depositorNameForTest = '푸른애월섬'
    mount()
    await flush()

    expect(hiddenInput().value).toBe('푸른애월섬')
    const boxes = [...host.querySelectorAll('.pointer-events-none')].map((el) => el.textContent.trim())
    expect(boxes).toEqual(['푸', '른', '애', '월', '섬'])
    expect(confirmButton().disabled).toBe(false)
  })
})
