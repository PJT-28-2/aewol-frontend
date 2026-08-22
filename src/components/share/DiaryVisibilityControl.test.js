import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({ changeDiaryVisibility: vi.fn() }))

vi.mock('@/stores/shareDiary', async () => {
  const { defineStore } = await import('pinia')
  return {
    useShareDiaryStore: defineStore('shareDiary', {
      state: () => ({ isSubmitting: false }),
      actions: { changeDiaryVisibility: mocks.changeDiaryVisibility },
    }),
  }
})

import DiaryVisibilityControl from './DiaryVisibilityControl.vue'

let app
let host

const flush = async () => {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
  await nextTick()
}

const mount = async (props) => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(DiaryVisibilityControl, props)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

const buttonWith = (text) =>
  [...host.querySelectorAll('button')].find((button) => button.textContent.includes(text))

// 사진이 있어야 공개할 수 있다. 기본 픽스처는 사진이 있는 상태로 둔다.
const privateDiary = { id: 'd-1', visibility: 'PRIVATE', hiddenByReport: false, images: ['a.png'] }
const publicDiary = { id: 'd-1', visibility: 'PUBLIC', hiddenByReport: false, images: ['a.png'] }

describe('DiaryVisibilityControl 권한', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.changeDiaryVisibility.mockResolvedValue({ visibility: 'PUBLIC' })
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  // 공개는 쓴 사람만 한다. 대표 보호자가 남의 글을 공개하면 "내가 쓴 글인데 내 통제 밖에서
  // 공개됐다"가 된다.
  it('작성자가 아니면 공개 버튼을 보여주지 않는다', async () => {
    await mount({ diary: privateDiary, isAuthor: false, isPetOwner: true })

    expect(buttonWith('멍스타그램에 공개하기')).toBeUndefined()
    expect(host.textContent).toContain('공개는 이 일기를 쓴 사람만 할 수 있어요')
  })

  it('작성자에게는 공개 버튼을 보여준다', async () => {
    await mount({ diary: privateDiary, isAuthor: true, isPetOwner: false })

    expect(buttonWith('멍스타그램에 공개하기')).toBeTruthy()
  })

  // 되돌릴 수 있지만 그 사이 누군가 봤을 수 있다.
  it('공개는 한 번 더 확인받은 뒤에 보낸다', async () => {
    await mount({ diary: privateDiary, isAuthor: true, isPetOwner: false })

    buttonWith('멍스타그램에 공개하기').click()
    await flush()

    expect(mocks.changeDiaryVisibility).not.toHaveBeenCalled()
    expect(host.textContent).toContain('사진 속 배경이나 함께 찍힌 사람도 같이 보여요')

    buttonWith('네, 공개할게요').click()
    await flush()

    expect(mocks.changeDiaryVisibility).toHaveBeenCalledWith('d-1', 'PUBLIC')
  })

  it('대표 보호자는 남의 글을 비공개로 내릴 수 있다', async () => {
    await mount({ diary: publicDiary, isAuthor: false, isPetOwner: true })

    buttonWith('비공개로 바꾸기').click()
    await flush()

    expect(mocks.changeDiaryVisibility).toHaveBeenCalledWith('d-1', 'PRIVATE')
  })

  // 신고로 내려간 글을 작성자가 되살릴 수 있으면 신고가 무력해진다.
  it('신고로 내려간 글은 사유를 알리고 조작을 막는다', async () => {
    await mount({
      diary: { id: 'd-1', visibility: 'PRIVATE', hiddenByReport: true },
      isAuthor: true,
      isPetOwner: true,
    })

    expect(host.textContent).toContain('신고로 노출이 멈춘 글이에요')
    expect(buttonWith('멍스타그램에 공개하기')).toBeUndefined()
  })

  // 사진 없는 글은 공개해도 탐색 그리드와 프로필 어디에도 안 뜬다. 누른 뒤에 거절당하기
  // 전에 먼저 알린다.
  it('사진이 없으면 공개 버튼 대신 이유를 보여준다', async () => {
    await mount({
      diary: { id: 'd-1', visibility: 'PRIVATE', hiddenByReport: false, images: [] },
      isAuthor: true,
      isPetOwner: true,
    })

    expect(buttonWith('멍스타그램에 공개하기')).toBeUndefined()
    expect(host.textContent).toContain('사진이 있는 일기만 공개할 수 있어요')
  })

  it('서버가 거부하면 사유를 보여준다', async () => {
    mocks.changeDiaryVisibility.mockRejectedValue({
      response: { data: { message: '일기를 공개하는 것은 작성자만 할 수 있습니다.' } },
    })
    await mount({ diary: privateDiary, isAuthor: true, isPetOwner: false })

    buttonWith('멍스타그램에 공개하기').click()
    await flush()
    buttonWith('네, 공개할게요').click()
    await flush()

    expect(host.textContent).toContain('일기를 공개하는 것은 작성자만 할 수 있습니다.')
  })
})
