import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  getHomeInsights: vi.fn(),
  fetchProfile: vi.fn(),
  fetchPets: vi.fn(),
  fetchSummary: vi.fn(),
  fetchUnreadCount: vi.fn(),
  unreadCount: 0,
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

vi.mock('@/api/insight', () => ({ getHomeInsights: mocks.getHomeInsights }))

vi.mock('@/stores/member', () => ({
  useMemberStore: () => ({ profile: { name: '김애월' }, fetchProfile: mocks.fetchProfile }),
}))

vi.mock('@/stores/pet', () => ({
  usePetStore: () => ({
    pets: [{ id: '9001', name: '보리', species: 'DOG' }],
    representativePetId: '9001',
    fetchPets: mocks.fetchPets,
  }),
}))

vi.mock('@/stores/dashboard', () => ({
  useDashboardStore: () => ({
    summary: { walletBalance: 0, monthlySpend: { totalAmount: 0, changeRate: 0 } },
    fetchSummary: mocks.fetchSummary,
  }),
}))

vi.mock('@/stores/notification', () => ({
  useNotificationStore: () => ({
    unreadCount: mocks.unreadCount,
    fetchUnreadCount: mocks.fetchUnreadCount,
  }),
}))

import HomeView from './HomeView.vue'

const card = (overrides = {}) => ({
  type: 'SPENDING',
  headline: '이번 달 지출 72,600원',
  body: '이번 달 총 지출은 72,600원입니다.',
  projection: '이 속도면 이달 말 약 125,033원 (남은 13일)',
  ctaLabel: '내역 보기',
  ctaPath: '/wallet',
  fallback: false,
  ...overrides,
})

let app
let host

const flush = async () => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve()
  await nextTick()
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(HomeView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

// 제목(h2)은 카드 묶음과 형제 요소로 분리되어 있다. 텍스트 검증은 둘을 합쳐서 본다.
const section = () => {
  const el = host.querySelector('[aria-labelledby="home-insight-title"]')
  if (!el) return null
  const heading = host.querySelector('#home-insight-title')
  const headerText = heading?.parentElement?.textContent ?? ''
  return { textContent: headerText + el.textContent }
}

const countOccurrences = (text, needle) => text.split(needle).length - 1

describe('HomeView AI 인사이트 카드', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.fetchProfile.mockResolvedValue({})
    mocks.fetchPets.mockResolvedValue([])
    mocks.fetchSummary.mockResolvedValue({})
    mocks.fetchUnreadCount.mockResolvedValue()
    mocks.unreadCount = 0
  })

  it('읽지 않은 알림 수를 홈 알림 배지에 보여준다', async () => {
    mocks.unreadCount = 12
    mocks.getHomeInsights.mockResolvedValue({ data: { result: [] } })

    await mountView()

    expect(host.querySelector('[aria-label="읽지 않은 알림 수"]')?.textContent).toBe('12')
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('인사이트를 별도 묶음으로 보여준다', async () => {
    mocks.getHomeInsights.mockResolvedValue({ data: { result: [card()] } })
    await mountView()

    expect(section()).toBeTruthy()
    expect(section().textContent).toContain('이번 달 인사이트')
  })

  // 요약과 예측은 신뢰도가 달라 한 문단에 섞으면 안 된다.
  it('예측을 예상 줄로 따로 보여준다', async () => {
    mocks.getHomeInsights.mockResolvedValue({ data: { result: [card()] } })
    await mountView()

    expect(section().textContent).toContain('예상')
    expect(section().textContent).toContain('이 속도면 이달 말 약 125,033원 (남은 13일)')
  })

  // 근거가 부족한 카드는 서버가 projection을 안 준다. 그때 빈 줄이 남으면 안 된다.
  it('예측이 없는 카드에는 예상 줄을 만들지 않는다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: { result: [card({ type: 'SUPPORT', projection: null })] },
    })
    await mountView()

    expect(section().textContent).not.toContain('예상')
  })

  // fallback은 서버가 데이터로 조립한 문구다. AI가 썼다고 표시하면 사실과 다르다.
  it('모든 카드가 fallback이면 AI 배지를 달지 않는다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: { result: [card({ fallback: true })] },
    })
    await mountView()

    expect(section().textContent).not.toContain('AI 요약')
  })

  it('한 장이라도 모델이 쓴 카드가 있으면 AI 배지를 단다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: { result: [card({ fallback: true }), card({ type: 'CARE', fallback: false })] },
    })
    await mountView()

    expect(section().textContent).toContain('AI 요약')
  })

  it('카드를 못 불러오면 묶음 자체를 감춘다', async () => {
    mocks.getHomeInsights.mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountView()

    expect(section()).toBeNull()
  })

  // 이번 달 최다 지출 카테고리와 맞는 공동구매가 있으면 추천 목록을 함께 보여준다.
  it('추천 상품이 있으면 카드 아래에 목록으로 보여준다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: {
        result: [
          card({
            recommendedProducts: [
              { id: 1, productName: '사료 5kg', groupPrice: 32000 },
              { id: 2, productName: '고구마 간식', groupPrice: 8900 },
            ],
          }),
        ],
      },
    })
    await mountView()

    expect(section().textContent).toContain('이 카테고리 공동구매 추천')
    expect(section().textContent).toContain('사료 5kg')
    expect(section().textContent).toContain('32,000원')
  })

  // 맞는 카테고리가 없을 때(예: 의료비가 1위) 서버가 빈 배열을 주므로, 빈 추천 영역이 남으면 안 된다.
  it('추천 상품이 없으면 추천 영역을 만들지 않는다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: { result: [card({ recommendedProducts: [] })] },
    })
    await mountView()

    expect(section().textContent).not.toContain('공동구매 추천')
  })

  // SPENDING 카드가 총지출 금액을 이미 보여주므로, 위쪽 '이번 달 총지출' 타일과
  // 중복 노출되면 안 된다(같은 이야기를 두 번 하지 않는다).
  it('SPENDING 카드가 있으면 총지출 문구가 카드 안에서만 한 번 나온다', async () => {
    mocks.getHomeInsights.mockResolvedValue({ data: { result: [card()] } })
    await mountView()

    expect(countOccurrences(host.textContent, '이번 달 총지출')).toBe(1)
    const amount = host.querySelector('[data-testid="monthly-spending-amount"]')
    expect(amount?.getAttribute('aria-label')).toBe('0원을 사용했어요')
    expect([...amount.querySelectorAll('span')].map((span) => span.textContent))
      .toEqual(['0원', '사용했어요'])
  })

  // SPENDING 카드가 없으면(신규 유저 등) 총지출을 보여줄 자리가 사라지면 안 된다.
  it('SPENDING 카드가 없으면 위쪽 총지출 타일을 그대로 보여준다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: { result: [card({ type: 'CARE', projection: null })] },
    })
    await mountView()

    expect(countOccurrences(host.textContent, '이번 달 총지출')).toBe(1)
    const amount = host.querySelector('[data-testid="monthly-spending-amount"]')
    expect(amount?.getAttribute('aria-label')).toBe('0원을 사용했어요')
    expect([...amount.querySelectorAll('span')].map((span) => span.textContent))
      .toEqual(['0원', '사용했어요'])
  })

  // 본문 중 'N%' 부분만 강조 색으로 감싼다. 조각내는 과정에서 공백이 끼어들거나
  // 원문 글자가 사라지면 안 된다(텍스트가 그대로 보존돼야 한다).
  it('본문의 퍼센트 부분만 강조 색으로 감싼다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: {
        result: [
          card({ body: '사료가 41%(109,000원)로 가장 크고, 전월 대비 +12%예요.' }),
        ],
      },
    })
    await mountView()

    const bodyEl = [...host.querySelectorAll('p')].find((p) =>
      p.textContent.includes('사료가'),
    )
    expect(bodyEl).toBeTruthy()
    // 조각내기 전후로 원문이 공백 없이 그대로 보존돼야 한다.
    expect(bodyEl.textContent).toBe('사료가 41%(109,000원)로 가장 크고, 전월 대비 +12%예요.')

    const highlighted = [...bodyEl.querySelectorAll('span')].map((el) => el.textContent)
    expect(highlighted).toEqual(['41%', '+12%'])
  })

  // 카테고리 비중이 있으면 도넛 차트 + 범례를 함께 보여준다.
  it('categoryBreakdown이 있으면 도넛 차트와 범례를 보여준다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: {
        result: [
          card({
            categoryBreakdown: [
              { label: '사료', amount: 74000, percentage: 80 },
              { label: '간식', amount: 15400, percentage: 17 },
              { label: '의료', amount: 3300, percentage: 3 },
            ],
          }),
        ],
      },
    })
    await mountView()

    expect(host.querySelector('[aria-labelledby="home-insight-title"] svg[role="img"]')).toBeTruthy()
    const legendLabels = [...host.querySelectorAll('[aria-labelledby="home-insight-title"] li')].map((el) => el.textContent)
    expect(legendLabels.some((text) => text.includes('사료') && text.includes('80%'))).toBe(true)
    expect(legendLabels.some((text) => text.includes('간식') && text.includes('17%'))).toBe(true)
  })

  // categoryBreakdown이 없으면(집계 실패 등) 빈 도넛을 억지로 그리지 않는다.
  it('categoryBreakdown이 없으면 도넛 영역을 만들지 않는다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: { result: [card({ categoryBreakdown: [] })] },
    })
    await mountView()

    expect(host.querySelector('[aria-labelledby="home-insight-title"] svg[role="img"]')).toBeNull()
  })
})
