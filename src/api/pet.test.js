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

describe('petApi.generateCharacter', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  // 회귀 테스트: 이 화면은 원래 API를 부르지 않고 정적 마스코트 PNG를 보여줬다(#212).
  it('POST /pets/{id}/character 로 photo를 multipart로 보낸다', async () => {
    api.post.mockResolvedValue({ data: { result: {} } })
    const file = new File(['fake'], 'poodle.png', { type: 'image/png' })

    await petApi.generateCharacter('9001', file)

    expect(api.post).toHaveBeenCalledTimes(1)
    const [path, body] = api.post.mock.calls[0]
    expect(path).toBe('/pets/9001/character')
    expect(body).toBeInstanceOf(FormData)
    // 서버는 파트 이름을 'photo'로 받는다. 다른 이름이면 400이 난다.
    expect(body.get('photo')).toBe(file)
  })

  // 외부 LLM을 두 단계로 호출해 20초 이상 걸린다. 공용 axios 인스턴스에는
  // 타임아웃이 없어 무한 대기하므로 이 호출만 상한을 명시한다.
  it('생성이 오래 걸리므로 넉넉한 타임아웃을 명시한다', async () => {
    api.post.mockResolvedValue({ data: { result: {} } })

    await petApi.generateCharacter('9001', new File([''], 'a.png', { type: 'image/png' }))

    const [, , config] = api.post.mock.calls[0]
    expect(config?.timeout).toBeGreaterThanOrEqual(60000)
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
