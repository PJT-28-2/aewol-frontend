import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({ store: null }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/explore', () => ({
  useExploreStore: () => mocks.store,
}))

import ExploreView from './ExploreView.vue'

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
  app = createApp(ExploreView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

describe('ExploreView 커서 sentinel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.store = reactive({
      posts: [],
      nextCursor: null,
      isLoading: false,
      isLoadingMore: false,
      error: '',
      hasMore: false,
      fetchFeed: vi.fn().mockResolvedValue(),
      fetchMore: vi.fn(),
    })
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

  it('빈 목록이어도 nextCursor가 있으면 sentinel을 유지한다', async () => {
    mocks.store.posts = []
    mocks.store.nextCursor = '2026-08-21 11:00:00|d-2'
    mocks.store.hasMore = true

    await mountView()

    expect(host.textContent).not.toContain('아직 공개된 일기가 없어요')
    expect(host.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('다음 장이 없는 빈 목록은 안내만 보여 준다', async () => {
    mocks.store.posts = []
    mocks.store.nextCursor = null
    mocks.store.hasMore = false

    await mountView()

    expect(host.textContent).toContain('아직 공개된 일기가 없어요')
  })
})
