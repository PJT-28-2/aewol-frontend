import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  getTransactions: vi.fn(),
  getPets: vi.fn(),
  routeQuery: {},
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.routeQuery }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/api/transaction', () => ({
  transactionApi: {
    getTransactions: mocks.getTransactions,
  },
}))

vi.mock('@/api/pet', () => ({
  petApi: {
    getPets: mocks.getPets,
  },
}))

import TransactionHistoryView from './TransactionHistoryView.vue'

let app
let host

async function flush() {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
  await nextTick()
}

async function mountView() {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(TransactionHistoryView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

describe('TransactionHistoryView 진입 조건별 거래 조회 type', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.routeQuery = {}
    mocks.getPets.mockResolvedValue({ data: { result: [] } })
    mocks.getTransactions.mockResolvedValue({
      data: { result: { transactions: [], nextCursor: null } },
    })
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  // 지출리포트(DashboardView)에서 카테고리 카드를 눌러 들어오면 category 쿼리가 붙는다.
  // REFUND는 category가 항상 'ETC'로 떨어지므로, 이 진입에서 type=ALL로 조회하면
  // '기타' 카테고리 상세에 환불 내역이 지출과 섞여 보이는 문제가 있었다(#376)
  it('category 쿼리로 진입하면 type=PAYMENT로 조회해 REFUND가 섞이지 않는다', async () => {
    mocks.routeQuery = { category: 'ETC' }

    await mountView()

    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PAYMENT' }),
    )
  })

  // 지갑 메인 > 전체 거래내역처럼 필터 없이 들어온 일반 조회는 REFUND도 함께 보여주는 게
  // 기존 의도된 동작이라 type=ALL을 그대로 유지해야 한다
  it('필터 없이 들어오면 기존처럼 type=ALL로 조회한다', async () => {
    await mountView()

    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ALL' }),
    )
  })
})
