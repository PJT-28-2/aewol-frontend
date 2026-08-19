import { afterEach, describe, expect, it, vi } from 'vitest'
import { goBackOr } from './navigation'

function mockHistoryState(state) {
  vi.spyOn(window.history, 'state', 'get').mockReturnValue(state)
}

describe('goBackOr', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('history.state.back의 경로가 target과 일치하면 router.back()으로 그 항목을 재사용한다', () => {
    mockHistoryState({ back: '/list' })
    const router = { back: vi.fn(), replace: vi.fn() }

    goBackOr(router, '/list')

    expect(router.back).toHaveBeenCalledOnce()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('back의 경로가 쿼리스트링만 다르고 동일하면 router.back()을 쓴다(필터/검색 상태 보존)', () => {
    mockHistoryState({ back: '/list?category=food&status=OPEN' })
    const router = { back: vi.fn(), replace: vi.fn() }

    goBackOr(router, '/list')

    expect(router.back).toHaveBeenCalledOnce()
    expect(router.replace).not.toHaveBeenCalled()
  })

  // 이 화면에 항상 target에서 push로 들어온다는 보장이 없다 — 예를 들어 다른 화면이
  // 자기 자신을 이 화면으로 replace한 경우, back은 존재해도 그 화면을 가리킨다.
  // 그럴 때 무조건 back()을 쓰면 엉뚱한 화면(심지어 다시 이 화면으로 튕겨내는 화면)으로
  // 돌아갈 수 있으므로, 경로가 다르면 target으로 replace해야 한다
  it('history.state.back이 있어도 target과 다른 경로면 target으로 replace한다', () => {
    mockHistoryState({ back: '/detail/123' })
    const router = { back: vi.fn(), replace: vi.fn() }

    goBackOr(router, '/list')

    expect(router.replace).toHaveBeenCalledWith('/list')
    expect(router.back).not.toHaveBeenCalled()
  })

  it('되돌아갈 히스토리 항목이 없으면(직접 URL 접속 등) target으로 replace한다', () => {
    mockHistoryState({ back: null })
    const router = { back: vi.fn(), replace: vi.fn() }

    goBackOr(router, '/list')

    expect(router.replace).toHaveBeenCalledWith('/list')
    expect(router.back).not.toHaveBeenCalled()
  })

  it('history.state 자체가 없어도(초기 진입 등) target으로 replace한다', () => {
    mockHistoryState(null)
    const router = { back: vi.fn(), replace: vi.fn() }

    goBackOr(router, '/list')

    expect(router.replace).toHaveBeenCalledWith('/list')
    expect(router.back).not.toHaveBeenCalled()
  })

  it('target이 라우트 객체여도 router.resolve로 경로를 구해 비교한다', () => {
    mockHistoryState({ back: '/list' })
    const router = {
      back: vi.fn(),
      replace: vi.fn(),
      resolve: vi.fn().mockReturnValue({ fullPath: '/list' }),
    }

    goBackOr(router, { name: 'List' })

    expect(router.resolve).toHaveBeenCalledWith({ name: 'List' })
    expect(router.back).toHaveBeenCalledOnce()
    expect(router.replace).not.toHaveBeenCalled()
  })
})
