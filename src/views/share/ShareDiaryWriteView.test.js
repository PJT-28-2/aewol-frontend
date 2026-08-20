import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  query: {},
  replace: vi.fn(),
  getPets: vi.fn(),
  createDiary: vi.fn(),
  getDiary: vi.fn(),
  updateDiary: vi.fn(),
  getDiaries: vi.fn(),
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
    getDiaries: mocks.getDiaries,
    getDiary: mocks.getDiary,
    updateDiary: mocks.updateDiary,
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


describe('ShareDiaryWriteView 수정 모드', () => {
  const diary = {
    id: 'd-1',
    petId: '9001',
    diaryDate: '2026-08-10',
    content: '산책 다녀왔다',
    images: [],
    version: 3,
  }

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.query = { petId: '9001', diaryId: 'd-1' }
    mocks.getPets.mockResolvedValue({ data: { result: [{ id: '9001', name: '보리' }] } })
    mocks.getDiary.mockResolvedValue({ data: { result: diary } })
    mocks.getDiaries.mockResolvedValue({ data: { result: [] } })
    mocks.updateDiary.mockResolvedValue({ data: { result: { ...diary, version: 4 } } })
    await mountView()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
  })

  // 저장은 스토어의 try/finally와 재throw를 거쳐 화면에 반영되므로 한 번의 flush로는
  // 렌더가 끝나지 않는다.
  const submitForm = async () => {
    host.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    await flush()
    await flush()
  }

  it('기존 내용을 채워 넣는다', () => {
    expect(host.querySelector('textarea').value).toBe('산책 다녀왔다')
    expect(host.querySelector('input[type="date"]').value).toBe('2026-08-10')
  })

  it('작성이 아니라 수정임을 버튼과 머리글에 드러낸다', () => {
    expect(host.textContent).toContain('일기 수정하기')
    expect(host.textContent).toContain('남긴 일기를 고쳐요')
  })

  // 이 값이 빠지면 서버가 충돌을 판정할 수 없어 낙관락이 무력해진다.
  it('불러올 때 받은 version을 저장 요청에 실어 보낸다', async () => {
    await submitForm()

    expect(mocks.updateDiary).toHaveBeenCalledWith('d-1', {
      diaryDate: '2026-08-10',
      content: '산책 다녀왔다',
      version: 3,
    })
  })

  // 서버 PUT이 사진을 받지 않는다. 바꿀 수 있는 것처럼 보이면 안 된다.
  it('사진 첨부 칸을 보여주지 않는다', () => {
    expect(host.querySelector('input[type="file"]')).toBeNull()
  })

  it('409를 받으면 저장 대신 다시 불러오기를 내민다', async () => {
    mocks.updateDiary.mockRejectedValueOnce({
      response: { status: 409, data: { message: '다른 곳에서 이 일기를 먼저 수정했어요.' } },
    })

    await submitForm()

    expect(host.textContent).toContain('다른 곳에서 이 일기를 먼저 수정했어요.')
    expect(host.textContent).toContain('최신 내용 다시 불러오기')
    expect(host.textContent).not.toContain('일기 수정하기')
  })

  // 그냥 다시 누르게 두면 남이 먼저 저장한 내용을 덮어쓴다.
  it('409 이후 다시 불러오면 최신 내용과 새 version을 받는다', async () => {
    mocks.updateDiary.mockRejectedValueOnce({ response: { status: 409, data: {} } })
    await submitForm()

    mocks.getDiary.mockResolvedValueOnce({
      data: { result: { ...diary, content: '남이 고친 내용', version: 9 } },
    })
    host.querySelectorAll('button').forEach((button) => {
      if (button.textContent.includes('최신 내용 다시 불러오기')) button.click()
    })
    await flush()
    await flush()

    expect(host.querySelector('textarea').value).toBe('남이 고친 내용')

    await submitForm()
    expect(mocks.updateDiary).toHaveBeenLastCalledWith('d-1', {
      diaryDate: '2026-08-10',
      content: '남이 고친 내용',
      version: 9,
    })
  })
})

describe('ShareDiaryWriteView 앱 톤 정합', () => {
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

  // 다른 화면은 모두 회색 배경(--color-app-bg) 위에 흰 카드를 얹는다. 일기 화면만
  // 페이지가 흰색이면 같은 앱으로 안 보인다.
  it('페이지 배경에 앱 공통 배경 토큰을 쓴다', () => {
    const page = host.firstElementChild

    expect(page.className).toContain('bg-(--color-app-bg)')
    expect(page.className).not.toContain('bg-(--color-white)')
  })

  it('일기 종이를 앱 공통 카드 반경·그림자로 그린다', () => {
    const paper = host.querySelector('article')

    expect(paper.className).toContain('bg-(--color-white)')
    expect(paper.className).toContain('rounded-[24px]')
    expect(paper.className).toContain('shadow-(--shadow-sm)')
  })
})
