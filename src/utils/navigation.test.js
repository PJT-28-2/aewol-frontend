import { afterEach, describe, expect, it, vi } from 'vitest'
import { goBackOr } from './navigation'

function mockHistoryState(state) {
  vi.spyOn(window.history, 'state', 'get').mockReturnValue(state)
}

describe('goBackOr', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('되돌아갈 히스토리 항목이 있으면(history.state.back) router.back()으로 그 항목을 재사용한다', () => {
    mockHistoryState({ back: '/list' })
    const router = { back: vi.fn(), replace: vi.fn() }

    goBackOr(router, '/list')

    expect(router.back).toHaveBeenCalledOnce()
    expect(router.replace).not.toHaveBeenCalled()
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
})
