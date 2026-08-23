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

  it('실패한 이미지가 새 서명 URL로 갱신되면 다시 표시한다', async () => {
    mocks.getList
      .mockResolvedValueOnce({
        data: { result: { items: [item({ image: '/old-signed-url' })], hasNext: false } },
      })
      .mockResolvedValueOnce({
        data: { result: { items: [item({ image: '/new-signed-url' })], hasNext: false } },
      })
    await mountView()

    const oldImage = host.querySelector('img[src="/old-signed-url"]')
    expect(oldImage).toBeTruthy()
    oldImage.dispatchEvent(new Event('error'))
    await nextTick()
    expect(host.querySelector('img[src="/old-signed-url"]')).toBeNull()

    const foodFilter = [...host.querySelectorAll('button')]
      .find((button) => button.textContent.trim() === '사료')
    foodFilter.click()
    await flush()

    expect(host.querySelector('img[src="/new-signed-url"]')).toBeTruthy()
  })
})

describe('GroupPurchaseListView 커서 페이지네이션', () => {
  let observerCallback

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.isAdmin = false
    observerCallback = undefined
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback) {
          observerCallback = callback
        }
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
    vi.useRealTimers()
  })

  it('2자 미만 검색어는 조회를 보류하고 안내 문구를 보여주며, 2자 이상이면 keyword로 조회한다', async () => {
    vi.useFakeTimers()
    mocks.getList
      .mockResolvedValueOnce({
        data: { result: { items: [item({ id: 41 })], hasNext: false, nextCursor: null } },
      })
      .mockResolvedValueOnce({
        data: { result: { items: [item({ id: 42 })], hasNext: false, nextCursor: null } },
      })

    await mountView()
    expect(mocks.getList).toHaveBeenCalledTimes(1)

    const input = host.querySelector('input[type="text"]')

    input.value = '사'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    vi.advanceTimersByTime(300)
    await flush()

    // 조회 자체를 보류하므로 요청이 추가로 나가지 않는다
    expect(mocks.getList).toHaveBeenCalledTimes(1)
    expect(host.textContent).toContain('검색어는 2자 이상 입력해주세요')

    input.value = '사료'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    vi.advanceTimersByTime(300)
    await flush()

    expect(mocks.getList).toHaveBeenCalledTimes(2)
    expect(mocks.getList.mock.calls[1][0]).toMatchObject({ keyword: '사료' })
    expect(host.textContent).not.toContain('검색어는 2자 이상 입력해주세요')
  })

  it('hasNext=true인데 nextCursor가 없으면(계약 위반) 다음 페이지가 없는 것으로 처리한다', async () => {
    mocks.getList.mockResolvedValueOnce({
      data: { result: { items: [item({ id: 51 })], hasNext: true, nextCursor: null } },
    })

    await mountView()

    expect(mocks.getList).toHaveBeenCalledTimes(1)
    // hasNext가 false로 방어됐다면 sentinel(v-if="hasNext")이 렌더링되지 않아 observer가 연결되지 않는다
    expect(observerCallback).toBeUndefined()

    observerCallback?.([{ isIntersecting: true }])
    await flush()

    // sentinel이 렌더링되지 않아 observer가 아예 연결되지 않았어야 하고,
    // 연결됐더라도 추가 요청은 발생하지 않아야 한다(첫 페이지 재조회로 인한 중복 방지)
    expect(mocks.getList).toHaveBeenCalledTimes(1)
  })

  it('정렬 키가 실시간으로 바뀌어 이미 본 항목이 다음 페이지에 다시 오면 중복 없이 걸러낸다', async () => {
    mocks.getList
      .mockResolvedValueOnce({
        data: { result: { items: [item({ id: 61 })], hasNext: true, nextCursor: 'CURSOR_1' } },
      })
      .mockResolvedValueOnce({
        data: {
          result: {
            items: [item({ id: 61 }), item({ id: 62 })],
            hasNext: false,
            nextCursor: null,
          },
        },
      })

    await mountView()
    observerCallback([{ isIntersecting: true }])
    await flush()

    const ids = [...host.querySelectorAll('h3')].map((el) => el.textContent.trim())
    expect(ids).toHaveLength(2)
  })

  it('첫 로드는 cursor 없이 요청하고, 더 불러오기는 이전 응답의 nextCursor를 그대로 실어 보낸다', async () => {
    mocks.getList
      .mockResolvedValueOnce({
        data: { result: { items: [item({ id: 21 })], hasNext: true, nextCursor: 'CURSOR_1' } },
      })
      .mockResolvedValueOnce({
        data: { result: { items: [item({ id: 22 })], hasNext: false, nextCursor: null } },
      })

    await mountView()

    expect(mocks.getList).toHaveBeenNthCalledWith(1, expect.objectContaining({ cursor: null }))

    observerCallback([{ isIntersecting: true }])
    await flush()

    expect(mocks.getList).toHaveBeenNthCalledWith(2, expect.objectContaining({ cursor: 'CURSOR_1' }))
    expect(mocks.getList).not.toHaveBeenCalledWith(expect.objectContaining({ page: expect.anything() }))
    expect([...host.querySelectorAll('h3')].map((el) => el.textContent.trim())).toHaveLength(2)
  })

  it('필터가 바뀌면 cursor를 초기화하고 첫 페이지부터 다시 요청한다', async () => {
    mocks.getList
      .mockResolvedValueOnce({
        data: { result: { items: [item({ id: 31 })], hasNext: true, nextCursor: 'CURSOR_1' } },
      })
      .mockResolvedValueOnce({
        data: { result: { items: [item({ id: 32, category: '간식' })], hasNext: false, nextCursor: null } },
      })

    await mountView()
    observerCallback([{ isIntersecting: true }])
    await flush()

    const snackFilter = [...host.querySelectorAll('button')]
      .find((button) => button.textContent.trim() === '간식')
    snackFilter.click()
    await flush()

    expect(mocks.getList).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: null, category: '간식' }),
    )
  })
})
