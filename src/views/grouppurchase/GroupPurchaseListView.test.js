import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  isAdmin: false,
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  RouterLink: mocks.RouterLink,
}))

vi.mock('@/api/groupPurchase', () => ({
  groupPurchaseApi: {
    getList: mocks.getList,
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ isAdmin: mocks.isAdmin }),
}))

import GroupPurchaseListView from './GroupPurchaseListView.vue'

const item = (overrides = {}) => ({
  id: 1,
  productName: '프리미엄 사료 15kg',
  category: '사료',
  status: 'OPEN',
  currentQuantity: 2,
  targetQuantity: 10,
  dDay: 'D-3',
  unitPrice: 40000,
  groupPrice: 28000,
  badgeText: '30% 할인',
  isParticipating: false,
  ...overrides,
})

let app
let host

const flush = async () => {
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(GroupPurchaseListView)
  app.component('RouterLink', mocks.RouterLink)
  app.component('router-link', mocks.RouterLink)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

const cardLink = (label) =>
  [...host.querySelectorAll('a')].find((element) => element.textContent.trim() === label)

describe('GroupPurchaseListView 참여 여부', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.isAdmin = false
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
    vi.unstubAllGlobals()
  })

  it('참여한 진행중 글은 참여중으로 표시하고 상태 화면으로 보낸다', async () => {
    mocks.getList.mockResolvedValue({
      data: { result: { items: [item({ id: 11, isParticipating: true })], hasNext: false } },
    })

    await mountView()

    expect(mocks.getList).toHaveBeenCalled()
    const link = cardLink('참여중')
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('/group-purchase/11/status')
    expect(cardLink('참여하기')).toBeUndefined()
  })

  it('미참여 진행중 글은 참여하기로 표시하고 상세로 보낸다', async () => {
    mocks.getList.mockResolvedValue({
      data: { result: { items: [item({ id: 12, isParticipating: false })], hasNext: false } },
    })

    await mountView()

    expect(mocks.getList).toHaveBeenCalled()
    const link = cardLink('참여하기')
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('/group-purchase/12')
    expect(cardLink('참여중')).toBeUndefined()
  })
})
