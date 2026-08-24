import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  route: { params: {} },
  push: vi.fn(),
  getMatchedPrograms: vi.fn(),
  markApplyPageOpened: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.push }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('@/api/supportPrograms', () => ({
  supportProgramsApi: {
    getMatchedPrograms: mocks.getMatchedPrograms,
    markApplyPageOpened: mocks.markApplyPageOpened,
  },
}))

import SupportProgramsView from './SupportProgramsView.vue'

const APPLY_URL = 'https://www.gov.kr/portal/rcvfvrSvc/dtlEx/305000000132'

const program = (overrides = {}) => ({
  id: '9041',
  title: '동대문구 유기동물 입양비 지원',
  summary: '입양비 지원',
  agency: '서울특별시 동대문구',
  benefit: '서비스(의료)||현금',
  period: '상시신청',
  applyUrl: APPLY_URL,
  eligible: true,
  applied: false,
  conditions: [],
  ...overrides,
})

const respond = (result) => mocks.getMatchedPrograms.mockResolvedValue({ data: { result } })

let app
let host
let openedWindow

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const mountView = async () => {
  host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp(SupportProgramsView)
  app.use(createPinia())
  app.mount(host)
  await flush()
}

const button = (label) =>
  [...host.querySelectorAll('button')].find((element) => element.textContent.trim() === label)

describe('SupportProgramsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.route = reactive({ params: {} })
    mocks.markApplyPageOpened.mockResolvedValue({ data: { result: null } })
    openedWindow = { opener: {}, location: { replace: vi.fn() }, close: vi.fn() }
    vi.stubGlobal('open', vi.fn(() => openedWindow))
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
    vi.unstubAllGlobals()
  })

  // 팝업이 막히거나 사용자가 새 탭을 닫으면 신청 페이지를 못 본 채로 기록만 남는다.
  // 그때 버튼이 잠겨 있으면 다시 들어갈 방법이 사라진다.
  it('이미 신청 기록이 남은 건도 신청 페이지를 다시 열 수 있다', async () => {
    mocks.route.params = { programId: '9041' }
    respond({ petId: '9001', petName: '보리', programs: [program({ applied: true })] })
    await mountView()

    const reopen = button('신청 페이지 다시 열기')
    expect(reopen).toBeTruthy()
    expect(reopen.disabled).toBe(false)

    reopen.click()
    await flush()

    expect(openedWindow.location.replace).toHaveBeenCalledWith(APPLY_URL)
    expect(openedWindow.close).not.toHaveBeenCalled()
    // 이미 기록된 건이라 서버에 다시 쓰지는 않는다.
    expect(mocks.markApplyPageOpened).not.toHaveBeenCalled()
  })

  it('처음 신청하면 관심 기록을 남기고 신청 페이지를 연다', async () => {
    mocks.route.params = { programId: '9041' }
    respond({ petId: '9001', petName: '보리', programs: [program()] })
    await mountView()

    button('신청하기').click()
    await flush()

    expect(mocks.markApplyPageOpened).toHaveBeenCalledWith('9041', '9001')
    expect(openedWindow.location.replace).toHaveBeenCalledWith(APPLY_URL)
  })

  it('신청 링크가 없는 정책은 관심 저장 뒤 버튼을 잠근다', async () => {
    mocks.route.params = { programId: '9041' }
    respond({
      petId: '9001',
      petName: '보리',
      programs: [program({ applyUrl: null, applied: true })],
    })
    await mountView()

    expect(button('관심 정책으로 저장됨').disabled).toBe(true)
  })

  it('정부24 구분자를 화면에 그대로 내보내지 않는다', async () => {
    mocks.route.params = { programId: '9041' }
    respond({ petId: '9001', petName: '보리', programs: [program()] })
    await mountView()

    expect(host.textContent).not.toContain('||')
    expect(host.textContent).toContain('서비스(의료) · 현금')
  })

  // 반려동물이 없으면 매칭 기준 자체가 없다. 목록을 새로고침해봐야 계속 비어 있다.
  it('반려동물이 없으면 등록을 안내한다', async () => {
    respond({ petId: null, petName: null, programs: [] })
    await mountView()

    expect(host.textContent).toContain('반려동물을 등록하면')
    expect(button('반려동물 등록하기')).toBeTruthy()
  })

  it('반려동물은 있는데 결과가 없으면 다시 불러오기를 제안한다', async () => {
    respond({ petId: '9001', petName: '보리', programs: [] })
    await mountView()

    expect(button('다시 불러오기')).toBeTruthy()

    button('다시 불러오기').click()
    await flush()

    expect(mocks.getMatchedPrograms).toHaveBeenCalledTimes(2)
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('정부 도메인이 아닌 신청 주소는 열지 않는다', async () => {
    mocks.route.params = { programId: '9041' }
    respond({
      petId: '9001',
      petName: '보리',
      programs: [program({ applyUrl: 'javascript:alert(1)' })],
    })
    await mountView()

    button('신청하기').click()
    await flush()

    expect(window.open).not.toHaveBeenCalled()
    expect(openedWindow.location.replace).not.toHaveBeenCalled()
    expect(mocks.markApplyPageOpened).toHaveBeenCalledWith('9041', '9001')
  })
})
