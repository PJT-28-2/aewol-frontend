import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  query: {},
  params: {},
  push: vi.fn(),
  replace: vi.fn(),
  fetchPets: vi.fn(),
  fetchWallet: vi.fn(),
  fetchRecurringPayments: vi.fn(),
  createRecurringPayment: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.query, params: mocks.params }),
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}))

vi.mock('@/stores/payment', () => ({
  usePaymentStore: () => ({
    fetchRecurringPayments: mocks.fetchRecurringPayments,
    createRecurringPayment: mocks.createRecurringPayment,
    findRecurringPayment: () => null,
  }),
}))

vi.mock('@/stores/pet', () => ({
  usePetStore: () => ({
    pets: [{ id: '9001', name: '보리', species: 'DOG' }],
    fetchPets: mocks.fetchPets,
  }),
}))

vi.mock('@/stores/wallet', () => ({
  useWalletStore: () => ({
    wallet: { totalBalance: 100000 },
    fetchWallet: mocks.fetchWallet,
  }),
}))

import RecurringRegisterView from './RecurringRegisterView.vue'

let app
let host

const flush = async () => {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
  await nextTick()
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(RecurringRegisterView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

describe('RecurringRegisterView 마켓 진입', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocks.query = {}
    mocks.params = {}
    mocks.fetchPets.mockResolvedValue(undefined)
    mocks.fetchWallet.mockResolvedValue(undefined)
    vi.clearAllMocks()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('마켓 쿼리가 있으면 상품명과 금액을 채우고 수정하지 못하게 한다', async () => {
    mocks.query = { merchant: '멍냥마켓', amount: '12900', category: 'FOOD', day: '15' }

    await mountView()

    expect(host.querySelector('h1').textContent.trim()).toBe('정기결제')
    const merchantInput = host.querySelector('input[placeholder="예: 강아지 사료 정기배송"]')
    const amountInput = host.querySelector('input[inputmode="numeric"]')
    expect(merchantInput.value).toBe('멍냥마켓')
    expect(merchantInput.readOnly).toBe(true)
    expect(amountInput.value).toBe('12900')
    expect(amountInput.readOnly).toBe(true)
    expect(host.textContent).toContain('매월 15일')
    expect(host.textContent).toContain('등록하면 오늘 바로 결제되고')
  })

  it('쿼리가 없으면 빈 등록 폼을 보여준다', async () => {
    await mountView()

    expect(host.querySelector('h1').textContent.trim()).toBe('정기결제 등록')
    const merchantInput = host.querySelector('input[placeholder="예: 강아지 사료 정기배송"]')
    expect(merchantInput.value).toBe('')
    expect(merchantInput.readOnly).toBe(false)
  })

  it('등록 금액이 지갑 잔액보다 크면 제출하지 않는다', async () => {
    mocks.query = { merchant: '멍냥마켓', amount: '100001', category: 'FOOD' }

    await mountView()

    expect(host.textContent).toContain('잔액이 부족합니다.')
    const submit = [...host.querySelectorAll('button')].find(
      (button) => button.textContent.trim() === '정기결제 등록하기',
    )
    expect(submit.disabled).toBe(true)
  })
})
