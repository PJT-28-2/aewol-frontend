import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  fetchPetProfile: vi.fn(),
  params: null,
  store: null,
}))

vi.mock('vue-router', async () => {
  const { reactive: makeReactive } = await import('vue')
  mocks.params = makeReactive({ petId: 'pet-1' })
  return {
    useRoute: () => ({ params: mocks.params }),
    useRouter: () => ({ push: vi.fn() }),
    RouterLink: { template: '<a><slot /></a>' },
  }
})

vi.mock('@/stores/explore', () => ({
  useExploreStore: () => mocks.store,
}))

import ExplorePetProfileView from './ExplorePetProfileView.vue'

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
  app = createApp(ExplorePetProfileView)
  app.component('RouterLink', { template: '<a><slot /></a>' })
  app.component('router-link', { template: '<a><slot /></a>' })
  app.use(createPinia())
  app.mount(host)
  await flush()
}

describe('ExplorePetProfileView petId 재조회', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.params.petId = 'pet-1'
    mocks.store = reactive({
      profile: { petId: 'pet-1', name: '보리', postCount: 1, species: 'DOG' },
      profilePosts: [],
      profileNextCursor: null,
      profileHasMore: false,
      isProfileLoading: false,
      profileError: '',
      fetchPetProfile: mocks.fetchPetProfile,
      fetchMorePetPosts: vi.fn(),
    })
    mocks.fetchPetProfile.mockResolvedValue()
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

  it('처음 열 때 프로필을 불러온다', async () => {
    await mountView()

    expect(mocks.fetchPetProfile).toHaveBeenCalledWith('pet-1')
  })

  it('petId가 바뀌면 다시 불러온다', async () => {
    await mountView()
    mocks.params.petId = 'pet-2'
    await flush()

    expect(mocks.fetchPetProfile).toHaveBeenCalledWith('pet-2')
  })
})
