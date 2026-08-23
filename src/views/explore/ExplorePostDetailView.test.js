import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'
import { createPinia } from 'pinia'

// vi.hoisted는 import보다 먼저 돌아 여기서 reactive를 쓸 수 없다. 모의 팩토리 안에서 만든다.
const mocks = vi.hoisted(() => ({ fetchPost: vi.fn(), params: null, store: null }))

vi.mock('vue-router', async () => {
  const { reactive: makeReactive } = await import('vue')
  mocks.params = makeReactive({ diaryId: 'diary-1' })
  return {
    useRoute: () => ({ params: mocks.params }),
    RouterLink: { template: '<a><slot /></a>' },
  }
})

vi.mock('@/stores/explore', () => ({
  useExploreStore: () => mocks.store,
}))

import ExplorePostDetailView from './ExplorePostDetailView.vue'

let app
let host

const flush = async () => {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
  await nextTick()
}

const post = (diaryId, petName) => ({
  diaryId,
  petId: 'pet-1',
  petName,
  content: '오늘의 산책',
  diaryDate: '2026-08-10',
  imageUrl: `https://cdn/${diaryId}.png`,
})

const mount = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(ExplorePostDetailView)
  // 신고 다이얼로그가 스토어를 쓴다.
  app.use(createPinia())
  app.mount(host)
  await flush()
}

describe('ExplorePostDetailView', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mocks.params.diaryId = 'diary-1'
    mocks.store = reactive({
      post: post('diary-1', '보리'),
      isPostLoading: false,
      postError: '',
      fetchPost: mocks.fetchPost,
    })
    mocks.fetchPost.mockImplementation(async (id) => {
      mocks.store.post = post(id, id === 'diary-1' ? '보리' : '초코')
    })
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  it('처음 열 때 게시물을 불러온다', async () => {
    await mount()

    expect(mocks.fetchPost).toHaveBeenCalledWith('diary-1')
  })

  /*
   * 같은 라우트 안에서 id만 바뀌면 Vue Router가 컴포넌트를 재사용한다. onMounted로만
   * 불러오면 이전 글이 그대로 남는다. 지금은 그리드에서 들어오는 길뿐이지만
   * "다음 게시물" 같은 걸 붙이는 순간 드러난다.
   */
  it('게시물 id가 바뀌면 다시 불러온다', async () => {
    await mount()
    mocks.params.diaryId = 'diary-2'
    await flush()

    expect(mocks.fetchPost).toHaveBeenCalledWith('diary-2')
    expect(host.textContent).toContain('초코')
  })

  // A를 신고한 뒤 B로 옮겼는데 신고 화면이 남아 있으면 안 된다.
  it('게시물이 바뀌면 신고 상태를 되돌린다', async () => {
    await mount()

    const reportButton = [...host.querySelectorAll('button')]
      .find((button) => button.textContent.includes('신고하기'))
    reportButton.click()
    await flush()
    // 정말 열렸는지 먼저 확인한다. 안 열렸으면 뒤 검증이 무의미해진다.
    expect(host.textContent).toContain('이 게시물을 신고할까요?')

    mocks.params.diaryId = 'diary-2'
    await flush()

    expect(host.textContent).not.toContain('이 게시물을 신고할까요?')
    expect(host.textContent).not.toContain('신고한 게시물이에요')
    expect([...host.querySelectorAll('button')]
      .some((button) => button.textContent.includes('신고하기'))).toBe(true)
  })
})
