import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { usePetStore } from '@/stores/pet'

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

// 내부 await 체인 깊이에 맞춰 임의의 횟수만큼 Promise.resolve()를 반복하는 대신,
// 실제로 기다리는 조건(getTransactions 호출 횟수)으로 대기한다. onMounted 로직에
// await이 추가/제거돼도 이 조건 자체는 매직 넘버로 남지 않는다
async function waitForFetchCall(callIndex) {
  await vi.waitFor(() => {
    if (mocks.getTransactions.mock.calls.length <= callIndex) {
      throw new Error('getTransactions not called yet')
    }
  })
}

// 로딩 스피너가 걷히고 실제 버튼이 렌더링될 때까지 기다린다 — fetch 호출 여부가 아니라
// 화면에 그 요소가 나타났는지 자체를 기다리는 조건이라 렌더링 체인이 길어져도 안전하다
async function waitForText(root, selector, text) {
  return vi.waitFor(() => {
    const target = [...root.querySelectorAll(selector)].find(
      (el) => el.textContent.trim() === text,
    )
    if (!target) throw new Error(`"${text}" not rendered yet`)
    return target
  })
}

// 지갑 메인 등에서 이미 반려동물 목록을 불러온 뒤 진입하는 실제 사용 흐름을 재현하기 위해,
// petStore.fetchPets()의 비동기 왕복 없이 pinia 상태를 미리 채워둔다. 그래야 petId 쿼리가
// setup 시점에 바로 해석되어, 마운트 직후 첫 조회부터 petFilter가 반영된다
function seedPets(pinia, pets) {
  usePetStore(pinia).pets = pets
}

async function mountView({ pets } = {}) {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(TransactionHistoryView)
  const pinia = createPinia()
  app.use(pinia)
  if (pets) seedPets(pinia, pets)
  app.mount(host)
  await waitForFetchCall(0)
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

  // 지출리포트 "반려동물별" 탭에서 반려동물 카드를 눌러 petId 쿼리로 들어온 경우도
  // category와 동일하게 REFUND 없이 지출만 보여야 한다
  it('petId 쿼리로 진입하면 type=PAYMENT로 조회한다', async () => {
    mocks.routeQuery = { petId: '5' }

    await mountView({ pets: [{ id: '5', petId: '5', name: '초코', species: 'DOG' }] })

    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PAYMENT' }),
    )
  })

  // 필터 없이 들어오면 기존처럼 type=ALL로 요청한다
  it('필터 없이 들어오면 기존처럼 type=ALL로 조회한다', async () => {
    await mountView()

    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ALL' }),
    )
  })

  // category 쿼리로 들어온 상태에서 사용자가 "유형" 시트에서 '출금'을 직접 고르면,
  // PAYMENT로 덮어쓰지 않고 사용자가 고른 값을 그대로 백엔드에 보내야 한다
  it('category 쿼리로 진입해도 유형을 직접 고르면 그 값을 그대로 요청한다', async () => {
    mocks.routeQuery = { category: 'ETC' }

    await mountView()
    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PAYMENT' }),
    )

    const typeButton = await waitForText(host, 'button', '유형')
    typeButton.click()
    const withdrawOption = await waitForText(document.body, 'button', '출금')
    withdrawOption.click()
    await waitForFetchCall(1)

    expect(mocks.getTransactions).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'WITHDRAW' }),
    )
  })

  // 새로고침 등으로 petStore.pets가 비어있는 상태에서 petId 쿼리로 진입하면, pets가 로드되기
  // 전까지는 route.query.petId를 유효한 값으로 확인할 방법이 없다. pets 로드를 기다리지 않고
  // 거래내역 조회를 먼저 보내면 petFilter가 null인 채로 나가 type=ALL이 되어버린다(#376 후속) —
  // 반려동물을 먼저 불러온 뒤에 조회가 나가야 한다
  it('petStore가 비어있는 상태로 petId 진입하면 반려동물을 먼저 불러온 뒤 거래내역을 조회한다', async () => {
    mocks.routeQuery = { petId: '5' }
    let resolveGetPets
    mocks.getPets.mockImplementation(
      () => new Promise((resolve) => { resolveGetPets = resolve }),
    )

    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(TransactionHistoryView)
    app.use(createPinia())
    app.mount(host)

    // 반려동물 목록이 아직 로드되지 않은 시점에는 거래내역 조회가 시작되면 안 된다
    expect(mocks.getPets).toHaveBeenCalled()
    expect(mocks.getTransactions).not.toHaveBeenCalled()

    resolveGetPets({ data: { result: [{ id: 5, name: '초코', species: 'DOG' }] } })
    await waitForFetchCall(0)

    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PAYMENT' }),
    )
  })

  // fetchPets 실패를 .catch(() => {})로 삼키지 않으면 예외가 onMounted를 타고 전파돼
  // fetchTransactions()가 아예 호출되지 않는다 — 반려동물 목록 조회가 실패해도 거래내역
  // 조회는 계속 진행돼야 한다(petId를 못 구했으니 type은 PAYMENT로 좁혀지지 않고 ALL로 나간다)
  it('반려동물 목록 조회가 실패해도 거래내역 조회는 계속 진행된다', async () => {
    mocks.routeQuery = { petId: '5' }
    mocks.getPets.mockRejectedValue(new Error('network error'))

    await mountView()

    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ALL' }),
    )
  })
})
