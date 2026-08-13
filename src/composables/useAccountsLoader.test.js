import { describe, expect, it, vi } from 'vitest'
import { useAccountsLoader } from './useAccountsLoader'

describe('useAccountsLoader', () => {
  it('성공하면 loadError를 비우고 fetchFn을 호출한다', async () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined)
    const { loadError, loadAccounts } = useAccountsLoader(fetchFn)

    await loadAccounts()

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(loadError.value).toBe('')
  })

  it('fetchFn이 실패하면 loadError에 안내 메시지를 채운다', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network error'))
    const { loadError, loadAccounts } = useAccountsLoader(fetchFn)

    await loadAccounts()

    expect(loadError.value).toBe('계좌 목록을 불러오지 못했어요. 다시 시도해주세요')
  })

  // 회귀 방지: 재시도 버튼을 빠르게 연타해도 fetchFn이 동시에 여러 번
  // 호출되지 않아야 한다(PR #215 리뷰 지적, 2026-08-13).
  it('로딩 중에 loadAccounts를 다시 호출하면 fetchFn이 중복 호출되지 않는다', async () => {
    let resolveFetch
    const fetchFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    const { isLoadingAccounts, loadAccounts } = useAccountsLoader(fetchFn)

    const firstCall = loadAccounts()
    expect(isLoadingAccounts.value).toBe(true)

    await loadAccounts() // 로딩 중 재클릭 — 즉시 반환되고 fetchFn은 다시 호출되지 않아야 함
    expect(fetchFn).toHaveBeenCalledTimes(1)

    resolveFetch()
    await firstCall
    expect(isLoadingAccounts.value).toBe(false)
  })
})
