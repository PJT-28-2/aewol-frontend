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

const section = () => host.querySelector('[aria-labelledby="home-insight-title"]')

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
    expect(section().textContent).toContain('오늘의 읽을거리')
  })

  // 요약과 예측은 신뢰도가 달라 한 문단에 섞으면 안 된다.
  it('예측을 전망 줄로 따로 보여준다', async () => {
    mocks.getHomeInsights.mockResolvedValue({ data: { result: [card()] } })
    await mountView()

    expect(section().textContent).toContain('전망')
    expect(section().textContent).toContain('이 속도면 이달 말 약 125,033원 (남은 13일)')
  })

  // 근거가 부족한 카드는 서버가 projection을 안 준다. 그때 빈 줄이 남으면 안 된다.
  it('예측이 없는 카드에는 전망 줄을 만들지 않는다', async () => {
    mocks.getHomeInsights.mockResolvedValue({
      data: { result: [card({ type: 'SUPPORT', projection: null })] },
    })
    await mountView()

    expect(section().textContent).not.toContain('전망')
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
})
