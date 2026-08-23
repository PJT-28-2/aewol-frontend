import { afterEach, describe, expect, it, vi } from 'vitest'
import { petApi } from './pet'
import api from './index'

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('petApi 캐릭터 생성', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  // 회귀 테스트: 이 화면은 원래 API를 부르지 않고 정적 마스코트 PNG를 보여줬다(#212).
  it('POST /pets/{id}/character/jobs 로 photo를 multipart로 보낸다', async () => {
    api.post.mockResolvedValue({ data: { result: { jobId: 'job-1' } } })
    const file = new File(['fake'], 'poodle.png', { type: 'image/png' })

    await petApi.submitCharacterJob('9001', file)

    expect(api.post).toHaveBeenCalledTimes(1)
    const [path, body] = api.post.mock.calls[0]
    expect(path).toBe('/pets/9001/character/jobs')
    expect(body).toBeInstanceOf(FormData)
    // 서버는 파트 이름을 'photo'로 받는다. 다른 이름이면 400이 난다.
    expect(body.get('photo')).toBe(file)
  })

  /*
   * 접수는 검증과 할당량 차감만 하고 곧바로 끊긴다. 예전처럼 완성을 기다리지 않으므로
   * 이 호출에 긴 타임아웃을 주면 안 된다 — 오래 걸린다는 것은 서버가 접수조차 못 하고
   * 있다는 뜻이고, 그때는 빨리 실패하는 편이 낫다.
   */
  it('접수 요청에는 긴 타임아웃을 걸지 않는다', async () => {
    api.post.mockResolvedValue({ data: { result: { jobId: 'job-1' } } })

    await petApi.submitCharacterJob('9001', new File([''], 'a.png', { type: 'image/png' }))

    const [, , config] = api.post.mock.calls[0]
    expect(config?.timeout).toBeUndefined()
  })

  it('진행 상태는 작업 id로 조회한다', async () => {
    api.get.mockResolvedValue({ data: { result: { status: 'RUNNING' } } })

    await petApi.fetchCharacterJob('9001', 'job-1')

    expect(api.get).toHaveBeenCalledWith('/pets/9001/character/jobs/job-1', { timeout: 10000 })
  })

  it('전체 폴링 상한에 맞춰 조회 타임아웃을 줄일 수 있다', async () => {
    api.get.mockResolvedValue({ data: { result: { status: 'RUNNING' } } })

    await petApi.fetchCharacterJob('9001', 'job-1', 750)

    expect(api.get).toHaveBeenCalledWith('/pets/9001/character/jobs/job-1', { timeout: 750 })
  })
})

describe('petApi.disconnectRegistration', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('동물등록번호 연동 해제 전용 API를 호출한다', async () => {
    api.delete.mockResolvedValue({ data: { result: null } })

    await petApi.disconnectRegistration('9001')

    expect(api.delete).toHaveBeenCalledWith('/pets/9001/registration')
  })
})
