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
  for (let i = 0; i < 12; i += 1) await Promise.resolve()
  await nextTick()
}

/** 폴링 간격만큼 시간을 흘려보내고 그동안의 약속을 모두 정리한다. */
const advance = async (ms) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flush()
}

const findButtonByText = (text) =>
  [...host.querySelectorAll('button')].find((button) => button.textContent.includes(text))

const startGeneration = async () => {
  const input = host.querySelector('input[type="file"]')
  const file = new File(['x'], 'pet.png', { type: 'image/png' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  input.dispatchEvent(new Event('change'))
  await flush()

  findButtonByText('이 사진으로 만들기').click()
  await flush()
}

/**
 * 생성 결과를 폴링으로 받아오는 흐름.
 *
 * 서버가 접수만 하고 곧바로 끊으므로 결과는 따로 물어봐야 한다. 예전에는 한 번의
 * 응답을 기다리는 구조라 이 경로 자체가 없었다.
 */
describe('PetProfilePhotoView 캐릭터 생성 폴링', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    mocks.fetchPets.mockResolvedValue(undefined)
    mocks.submitCharacterJob.mockResolvedValue({ data: { result: { jobId: 'job-1' } } })

    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp(PetProfilePhotoView)
    app.use(createPinia())
    app.mount(host)
  })

  afterEach(() => {
    vi.useRealTimers()
    app?.unmount()
    host?.remove()
  })

  it('접수한 뒤 완료될 때까지 상태를 물어본다', async () => {
    mocks.fetchCharacterJob
      .mockResolvedValueOnce({ data: { result: { status: 'RUNNING' } } })
      .mockResolvedValueOnce({ data: { result: { status: 'RUNNING' } } })
      .mockResolvedValue({
        data: { result: { status: 'DONE', profileImg: 'https://cdn/face.png', remainingToday: 4 } },
      })

    await startGeneration()
    expect(mocks.submitCharacterJob).toHaveBeenCalledOnce()
    // 접수 직후에는 아직 물어보지 않는다. 생성은 20초 넘게 걸리므로 곧바로 묻는 건 낭비다.
    expect(mocks.fetchCharacterJob).not.toHaveBeenCalled()

    await advance(2000)
    expect(mocks.fetchCharacterJob).toHaveBeenCalledTimes(1)

    await advance(2000)
    await advance(2000)

    expect(mocks.fetchCharacterJob).toHaveBeenCalledTimes(3)
    expect(host.querySelector('img[src="https://cdn/face.png"]')).toBeTruthy()
  })

  // 실패 이유는 서버가 알려준 문구를 그대로 보여줘야 사용자가 무엇을 고칠지 안다.
  it('실패하면 서버가 준 이유를 보여주고 사진 확인 단계로 돌아간다', async () => {
    mocks.fetchCharacterJob.mockResolvedValue({
      data: { result: { status: 'FAILED', message: '다른 사진으로 다시 시도해 주세요.' } },
    })

    await startGeneration()
    await advance(2000)

    expect(host.textContent).toContain('다른 사진으로 다시 시도해 주세요.')
    // 같은 사진으로 재시도하거나 다른 사진을 고를 수 있어야 한다.
    expect(findButtonByText('이 사진으로 만들기')).toBeTruthy()
  })

  it('일시적인 조회 오류는 다시 시도하고 완성 결과를 보여준다', async () => {
    mocks.fetchCharacterJob
      .mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }))
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValue({
        data: { result: { status: 'DONE', profileImg: 'https://cdn/recovered.png' } },
      })

    await startGeneration()
    await advance(6000)

    expect(mocks.fetchCharacterJob).toHaveBeenCalledTimes(3)
    expect(host.querySelector('img[src="https://cdn/recovered.png"]')).toBeTruthy()
  })

  it('조회가 연속 세 번 실패하면 사용자에게 연결 오류를 보여준다', async () => {
    mocks.fetchCharacterJob.mockRejectedValue({ response: { status: 503 } })

    await startGeneration()
    await advance(6000)

    expect(mocks.fetchCharacterJob).toHaveBeenCalledTimes(3)
    expect(host.textContent).toContain('서버 연결이 원활하지 않아요')
    expect(findButtonByText('이 사진으로 만들기')).toBeTruthy()
  })

  it('재시도할 수 없는 조회 오류는 즉시 중단한다', async () => {
    mocks.fetchCharacterJob.mockRejectedValue({
      response: { status: 400, data: { message: '잘못된 작업 요청이에요.' } },
    })

    await startGeneration()
    await advance(2000)

    expect(mocks.fetchCharacterJob).toHaveBeenCalledOnce()
    expect(host.textContent).toContain('잘못된 작업 요청이에요.')
  })

  /*
   * 서버가 상태를 남기지 못하면 RUNNING이 영원히 이어진다. 상한이 없으면 화면이 계속
   * 돌아가고 사용자는 무엇이 잘못됐는지 알 수 없다.
   */
  it('너무 오래 걸리면 기다리기를 멈춘다', async () => {
    mocks.fetchCharacterJob.mockResolvedValue({ data: { result: { status: 'RUNNING' } } })

    await startGeneration()
    await advance(181000)

    expect(host.textContent).toContain('시간이 너무 오래 걸리고 있어요')
  })

  /*
   * 폴링은 setInterval이 아니라 루프라 컴포넌트가 사라져도 저절로 멈추지 않는다.
   * 그대로 두면 화면을 떠난 뒤에도 3분 동안 90번을 더 조회한다.
   */
  it('화면을 떠나면 더 이상 물어보지 않는다', async () => {
    mocks.fetchCharacterJob.mockResolvedValue({ data: { result: { status: 'RUNNING' } } })

    await startGeneration()
    await advance(2000)
    const calledWhileMounted = mocks.fetchCharacterJob.mock.calls.length
    expect(calledWhileMounted).toBeGreaterThan(0)

    app.unmount()
    await advance(20000)

    expect(mocks.fetchCharacterJob).toHaveBeenCalledTimes(calledWhileMounted)
  })

  /*
   * "이 사진으로 만들기"를 빠르게 두 번 눌러도 DOM 갱신보다 먼저 잠금 상태를
   * 바꿔야 한다. 서버 요청이 두 번 나가면 결과는 하나만 보여도 일일 할당량은 두 번
   * 소모된다.
   */
  it('두 번 눌러도 생성 요청은 한 번만 보낸다', async () => {
    mocks.fetchCharacterJob.mockResolvedValue({
      data: { result: { status: 'DONE', profileImg: 'https://cdn/job-1.png' } },
    })

    const input = host.querySelector('input[type="file"]')
    const file = new File(['x'], 'pet.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change'))
    await flush()

    const convert = findButtonByText('이 사진으로 만들기')
    convert.click()
    convert.click()
    await flush()
    await advance(2000)

    expect(mocks.submitCharacterJob).toHaveBeenCalledOnce()
    expect(host.querySelector('img[src="https://cdn/job-1.png"]')).toBeTruthy()
  })
})
