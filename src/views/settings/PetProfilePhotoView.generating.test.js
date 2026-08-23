import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  submitCharacterJob: vi.fn(),
  fetchCharacterJob: vi.fn(),
  fetchPets: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

vi.mock('@/api/pet', () => ({
  petApi: {
    submitCharacterJob: mocks.submitCharacterJob,
    fetchCharacterJob: mocks.fetchCharacterJob,
  },
}))

vi.mock('@/stores/pet', () => ({
  usePetStore: () => ({
    pets: [{ id: '9001', name: '황칠복', species: 'DOG', profileImg: null, characterImg: null }],
    representativePetId: '9001',
    fetchPets: mocks.fetchPets,
  }),
}))

import PetProfilePhotoView from './PetProfilePhotoView.vue'

let app
let host

const flush = async () => {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
  await nextTick()
}

const findButtonByText = (text) =>
  [...host.querySelectorAll('button')].find((button) => button.textContent.includes(text))

/**
 * 생성 대기 화면(step 3)은 사진 선택 → "이 사진으로 만들기"를 거쳐야 나온다.
 * jsdom의 file input은 files가 읽기 전용이라 직접 정의해서 넣는다.
 */
const enterGeneratingStep = async () => {
  const input = host.querySelector('input[type="file"]')
  const file = new File(['x'], 'pet.png', { type: 'image/png' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  input.dispatchEvent(new Event('change'))
  await flush()

  findButtonByText('이 사진으로 만들기').click()
  await flush()
}

const statusText = () => host.querySelector('section p')?.textContent ?? ''

describe('PetProfilePhotoView 생성 대기 화면', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    mocks.fetchPets.mockResolvedValue(undefined)
    // 응답이 오면 step 4로 넘어가 버리므로, 대기 화면을 붙잡아두기 위해 매달아 둔다.
    // 접수는 곧바로 끝나고, 그 뒤로는 계속 생성 중인 상태를 유지한다.
    mocks.submitCharacterJob.mockResolvedValue({ data: { result: { jobId: 'job-1' } } })
    mocks.fetchCharacterJob.mockResolvedValue({ data: { result: { status: 'RUNNING' } } })

    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(PetProfilePhotoView)
    app.use(createPinia())
    app.mount(host)
    await flush()
  })

  afterEach(() => {
    app?.unmount()
    host?.remove()
    vi.useRealTimers()
  })

  it('이름 뒤 조사를 받침에 맞춘다', async () => {
    await enterGeneratingStep()

    // 황칠복은 받침이 있으므로 "황칠복을"이다. "황칠복를"이 되면 안 된다.
    expect(host.textContent).toContain('황칠복을 닮은 캐릭터를')
    expect(host.textContent).not.toContain('황칠복를')
  })

  it('대기하는 동안 안내 문구가 다음 단계로 넘어간다', async () => {
    await enterGeneratingStep()
    expect(statusText()).toContain('털색과 얼굴 특징을 살펴보고')

    vi.advanceTimersByTime(6000)
    await flush()
    expect(statusText()).toContain('무늬와 귀 모양을')

    vi.advanceTimersByTime(6000)
    await flush()
    expect(statusText()).toContain('애월 스타일로')
  })

  // 되감기면 작업이 뒤로 간 것처럼 보인다. 마지막 문구에서 멈춰야 한다.
  it('마지막 문구에 도달하면 처음으로 돌아가지 않는다', async () => {
    await enterGeneratingStep()

    vi.advanceTimersByTime(6000 * 10)
    await flush()

    expect(statusText()).toContain('마지막으로 색을 다듬고')
  })

  it('화면을 닫지 말라는 안내는 문구가 바뀌어도 유지된다', async () => {
    await enterGeneratingStep()

    vi.advanceTimersByTime(6000 * 3)
    await flush()

    expect(statusText()).toContain('화면을 닫지 말아주세요')
  })

  // 언마운트 후에도 타이머가 살아 있으면 사라진 컴포넌트의 ref를 계속 건드린다.
  it('화면을 벗어나면 문구 타이머를 정리한다', async () => {
    await enterGeneratingStep()

    app.unmount()
    app = null

    expect(() => vi.advanceTimersByTime(6000 * 5)).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })
})
