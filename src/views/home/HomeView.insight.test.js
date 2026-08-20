import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  fetchPets: vi.fn(),
  fetchSummary: vi.fn(),
  fetchCategory: vi.fn(),
  fetchUnreadCount: vi.fn(),
  getList: vi.fn(),
  getMatchedPrograms: vi.fn(),
  unreadCount: 0,
  summary: { walletBalance: 46700, monthlySpend: { totalAmount: 92700, changeRate: 100 } },
  category: {
    totalAmount: 92700,
    items: [
      { category: 'FOOD', amount: 74000, petBreakdown: [] },
      { category: 'SNACK', amount: 15700, petBreakdown: [] },
      { category: 'HOSPITAL', amount: 3000, petBreakdown: [] },
    ],
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
}))

vi.mock('@/components/dashboard/ExpenseDonutChart.vue', () => ({
  default: { props: ['items', 'size'], template: '<div data-testid="donut" />' },
}))

vi.mock('@/api/groupPurchase', () => ({
  groupPurchaseApi: { getList: mocks.getList },
}))

vi.mock('@/api/supportPrograms', () => ({
  supportProgramsApi: { getMatchedPrograms: mocks.getMatchedPrograms },
}))

vi.mock('@/stores/member', () => ({
  useMemberStore: () => ({ profile: { name: '장지연' }, fetchProfile: mocks.fetchProfile }),
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
    get summary() {
      return mocks.summary
    },
    get category() {
      return mocks.category
    },
    fetchSummary: mocks.fetchSummary,
    fetchCategory: mocks.fetchCategory,
  }),
}))

vi.mock('@/stores/notification', () => ({
  useNotificationStore: () => ({
    unreadCount: mocks.unreadCount,
    fetchUnreadCount: mocks.fetchUnreadCount,
  }),
}))

vi.mock('@/utils/homeMonthlyInsight', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    projectMonthEnd: () => 143685,
    remainingDays: () => 11,
  }
})

import HomeView from './HomeView.vue'

let app
let host

const flush = async () => {
  for (let i = 0; i < 12; i += 1) await Promise.resolve()
  await nextTick()
  for (let i = 0; i < 6; i += 1) await Promise.resolve()
  await nextTick()
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(HomeView)
  app.use(createPinia())
  app.component('RouterLink', {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  })
  app.mount(host)
  await flush()
}

const section = () => host.querySelector('[aria-labelledby="home-insight-title"]')

describe('HomeView 이번 달 인사이트', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.fetchProfile.mockResolvedValue({})
    mocks.fetchPets.mockResolvedValue([])
    mocks.fetchSummary.mockResolvedValue({})
    mocks.fetchCategory.mockResolvedValue({})
    mocks.fetchUnreadCount.mockResolvedValue()
    mocks.getMatchedPrograms.mockResolvedValue({ data: { result: { programs: [] } } })
    mocks.getList.mockResolvedValue({
      data: {
        result: {
          items: [{
            id: 11,
            productName: '오리지널 사료 5kg',
            currentQuantity: 8,
            targetQuantity: 20,
            dDay: 'D-7',
            groupPrice: 32000,
            unitPrice: 45000,
            badgeText: '29% 할인',
          }],
        },
      },
    })
    mocks.unreadCount = 0
    mocks.summary = { walletBalance: 46700, monthlySpend: { totalAmount: 92700, changeRate: 100 } }
    mocks.category = {
      totalAmount: 92700,
      items: [
        { category: 'FOOD', amount: 74000, petBreakdown: [] },
        { category: 'SNACK', amount: 15700, petBreakdown: [] },
        { category: 'HOSPITAL', amount: 3000, petBreakdown: [] },
      ],
    }
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('읽지 않은 알림 수를 홈 알림 배지에 보여준다', async () => {
    mocks.unreadCount = 12
    await mountView()

    expect(host.querySelector('[aria-label="읽지 않은 알림 수"]')?.textContent).toBe('12')
  })

  it('총지출과 도넛 범례를 이번 달 인사이트로 보여준다', async () => {
    await mountView()

    expect(section()?.textContent).toContain('이번 달 인사이트')
    expect(section()?.textContent).toContain('92,700원을 사용했어요')
    expect(section()?.textContent).toContain('사료')
    expect(section()?.textContent).toContain('80%')
    expect(section()?.textContent).toContain('내역 보기')
  })

  it('전월 대비와 월말 전망을 따로 보여준다', async () => {
    await mountView()

    expect(section()?.textContent).toContain('+100%')
    expect(section()?.textContent).toContain('전망')
    expect(section()?.textContent).toContain('143,685원')
    expect(section()?.textContent).toContain('남은 11일')
  })

  it('보험 비중이 커도 소비 분석은 내역으로 보내고, 보험은 다음 카드로 잇는다', async () => {
    mocks.summary = { walletBalance: 46700, monthlySpend: { totalAmount: 177700, changeRate: 100 } }
    mocks.category = {
      totalAmount: 177700,
      items: [
        { category: 'INSURANCE', amount: 85000, petBreakdown: [] },
        { category: 'FOOD', amount: 74000, petBreakdown: [] },
      ],
    }
    await mountView()

    expect(section()?.textContent).toContain('내역 보기')
    expect(section()?.querySelector('a[href="/wallet/history"]')).toBeTruthy()
    expect(host.textContent).toContain('보험료 시뮬레이션 하러 가기')
    expect(host.querySelector('a[href="/insurance/simulator"]')).toBeTruthy()
    expect(mocks.getList).toHaveBeenCalledWith({
      page: 0,
      size: 5,
      category: '사료',
      status: 'OPEN',
    })
  })

  it('사료 비중이 있으면 해당 카테고리 공동구매를 추천한다', async () => {
    await mountView()

    expect(mocks.getList).toHaveBeenCalledWith({
      page: 0,
      size: 5,
      category: '사료',
      status: 'OPEN',
    })
    expect(host.textContent).toContain('사료 공동구매 추천')
    expect(host.textContent).toContain('오리지널 사료 5kg')
    expect(host.textContent).toContain('29% 할인')
  })

  it('의료 지출이 있으면 신청 가능한 정책 지원을 잇는다', async () => {
    mocks.category = {
      totalAmount: 92700,
      items: [
        { category: 'FOOD', amount: 74000, petBreakdown: [] },
        { category: 'HOSPITAL', amount: 18700, petBreakdown: [] },
      ],
    }
    mocks.getMatchedPrograms.mockResolvedValue({
      data: {
        result: {
          programs: [
            { id: 'p1', title: '반려동물 진료비 지원', eligible: true, applied: false },
          ],
        },
      },
    })
    await mountView()

    expect(mocks.getMatchedPrograms).toHaveBeenCalled()
    expect(host.textContent).toContain('받을 수 있는 정책 지원')
    expect(host.textContent).toContain('진료비 지원')
    expect(host.querySelector('a[href="/support-programs"]')).toBeTruthy()
    expect(host.textContent).toContain('보험 확인하기')
  })

  it('지출이 없으면 인사이트 묶음을 감춘다', async () => {
    mocks.summary = { walletBalance: 0, monthlySpend: { totalAmount: 0, changeRate: 0 } }
    mocks.category = { totalAmount: 0, items: [] }
    await mountView()

    expect(section()).toBeNull()
  })

  it('카테고리를 못 불러오면 묶음 자체를 감춘다', async () => {
    mocks.fetchCategory.mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountView()

    expect(section()).toBeNull()
  })
})
