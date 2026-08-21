import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  requestPayment: vi.fn(),
  loadTossPayments: vi.fn(),
  prepareTossCharge: vi.fn(),
  clearPendingTossCharge: vi.fn(),
  fetchAccounts: vi.fn(),
}))

vi.mock('@tosspayments/tosspayments-sdk', () => ({
  loadTossPayments: mocks.loadTossPayments,
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { amount: '30000' } }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    resolve: ({ name }) => ({ href: `/${name}` }),
  }),
}))

vi.mock('@/stores/wallet', () => ({
  useWalletStore: () => ({
    prepareTossCharge: mocks.prepareTossCharge,
    clearPendingTossCharge: mocks.clearPendingTossCharge,
  }),
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    accounts: [{ id: 'account-1' }],
    fetchAccounts: mocks.fetchAccounts,
  }),
}))

vi.mock('@/utils/tossPayments', () => ({
  getTossCustomerKey: () => 'customer-key',
}))

import ChargeView from './ChargeView.vue'

let app
let host

async function flush() {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
  await nextTick()
}

describe('ChargeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_TOSS_CLIENT_KEY', 'test_ck_client')
    mocks.fetchAccounts.mockResolvedValue()
    mocks.prepareTossCharge.mockResolvedValue({ orderId: 'order-1', amount: 30000 })
    mocks.requestPayment.mockResolvedValue()
    mocks.loadTossPayments.mockResolvedValue({
      payment: () => ({ requestPayment: mocks.requestPayment }),
    })
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
    vi.unstubAllEnvs()
  })

  it('충전 결제창을 계좌이체 전용으로 요청한다', async () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(ChargeView)
    app.mount(host)
    await flush()

    const chargeButton = [...host.querySelectorAll('button')]
      .find((button) => button.textContent.includes('30,000원 충전하기'))
    chargeButton.click()
    await flush()

    expect(mocks.requestPayment).toHaveBeenCalledWith(expect.objectContaining({
      method: 'TRANSFER',
      amount: { currency: 'KRW', value: 30000 },
      orderId: 'order-1',
    }))
  })
})
