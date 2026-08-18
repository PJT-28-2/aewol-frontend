import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  query: {},
  replace: vi.fn(),
  getPets: vi.fn(),
  createDiary: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mocks.query }),
  useRouter: () => ({ replace: mocks.replace }),
}))

vi.mock('@/api/share', () => ({
  shareApi: {
    getPets: mocks.getPets,
    getMembers: vi.fn(),
    getContributions: vi.fn(),
    getLogs: vi.fn(),
    createDiary: mocks.createDiary,
    getDiaries: vi.fn(),
    getDiary: vi.fn(),
    updateDiary: vi.fn(),
    deleteDiary: vi.fn(),
  },
}))

import ShareDiaryWriteView from './ShareDiaryWriteView.vue'

let app
let host

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(ShareDiaryWriteView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

const todayText = () => {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

describe('ShareDiaryWriteView 일기 형식 화면', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.query = { petId: '9001' }
    mocks.getPets.mockResolvedValue({ data: { result: [{ id: '9001', name: '보리' }] } })
    await mountView()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  // 날짜가 yyyy-MM-dd로 노출되면 입력 폼처럼 읽힌다. 일기장 머리글로 보여야 한다.
  it('날짜를 일기장 머리글 형식으로 보여준다', () => {
    const expected = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(new Date(`${todayText()}T00:00:00`))

    expect(host.querySelector('h1').textContent.trim()).toBe(expected)
  })

  it('반려동물 이름을 머리글에 함께 보여준다', () => {
    expect(host.textContent).toContain('보리와 보낸 하루')
  })

  // 날짜는 대부분 오늘이라 입력칸을 앞세우지 않는다. 상태만 알려주고 필요할 때 연다.
  it('오늘이면 날짜 칸 대신 오늘 표시를 보여준다', async () => {
    const dateInput = host.querySelector('input[type="date"]')

    expect(dateInput.value).toBe(todayText())
    expect(dateInput.className).toContain('sr-only')
    expect(host.textContent).toContain('오늘')

    dateInput.value = '2026-08-01'
    dateInput.dispatchEvent(new Event('input'))
    await flush()

    expect(host.textContent).toContain('날짜 변경')
  })

  // 본문 줄선은 배경으로 그린다. 줄 간격과 line-height가 같은 토큰이어야 글이 선 위에 앉는다.
  it('본문에 줄선 배경과 같은 줄 간격을 쓴다', () => {
    const textarea = host.querySelector('#diary-content')

    expect(textarea.className).toContain('repeating-linear-gradient')
    expect(textarea.className).toContain('[line-height:var(--diary-line-height)]')
    expect(textarea.className).toContain('var(--diary-line-height)')
  })

  it('내용이나 사진이 없으면 저장할 수 없다', () => {
    const submit = [...host.querySelectorAll('button')]
      .find((button) => button.textContent.trim() === '일기 남기기')

    expect(submit.disabled).toBe(true)
  })
})
