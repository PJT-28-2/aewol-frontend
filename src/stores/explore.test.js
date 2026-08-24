import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  getFeed: vi.fn(),
  getPetProfile: vi.fn(),
  getPetPosts: vi.fn(),
}))

vi.mock('@/api/explore', () => ({
  exploreApi: {
    getFeed: mocks.getFeed,
    getPetProfile: mocks.getPetProfile,
    getPetPosts: mocks.getPetPosts,
  },
}))

import { useExploreStore } from './explore'

const feed = (posts, nextCursor = null) => ({
  data: { result: { posts, nextCursor } },
})

describe('useExploreStore 요청 세대', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('느린 이전 피드 응답은 최신 목록을 덮지 않는다', async () => {
    let resolveFirst
    mocks.getFeed
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveFirst = resolve
      }))
      .mockResolvedValueOnce(feed([{ diaryId: 'new' }]))

    const store = useExploreStore()
    const first = store.fetchFeed()
    const second = store.fetchFeed()
    await second
    resolveFirst(feed([{ diaryId: 'stale' }]))
    await first

    expect(store.posts).toEqual([{ diaryId: 'new' }])
  })

  it('피드가 바뀐 뒤에는 이전 커서의 fetchMore를 붙이지 않는다', async () => {
    let resolveMore
    mocks.getFeed
      .mockResolvedValueOnce(feed([{ diaryId: 'a' }], 'cursor-1'))
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveMore = resolve
      }))
      .mockResolvedValueOnce(feed([{ diaryId: 'b' }]))

    const store = useExploreStore()
    await store.fetchFeed()
    const more = store.fetchMore()
    await store.fetchFeed()
    resolveMore(feed([{ diaryId: 'stale-more' }]))
    await more

    expect(store.posts).toEqual([{ diaryId: 'b' }])
    expect(store.posts.some((post) => post.diaryId === 'stale-more')).toBe(false)
    expect(store.isLoadingMore).toBe(false)
  })
})
