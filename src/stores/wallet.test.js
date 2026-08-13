import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/wallet', () => ({
  walletApi: {
    getWallet: vi.fn(),
    charge: vi.fn(),
    verifySimplePassword: vi.fn(),
    withdraw: vi.fn(),
  },
}))

import { walletApi } from '@/api/wallet'
import { useWalletStore } from './wallet'

describe('useWalletStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('fetchWallet()은 백엔드 walletBalance를 화면용 totalBalance로 변환한다', async () => {
    walletApi.getWallet.mockResolvedValue({
      data: {
        result: {
          walletId: 'wallet-1',
          walletBalance: 120000,
        },
      },
    })

    const store = useWalletStore()

    await expect(store.fetchWallet()).resolves.toMatchObject({
      walletId: 'wallet-1',
      totalBalance: 120000,
    })
    expect(store.wallet.totalBalance).toBe(120000)
  })

  it('fetchWallet()은 0원 잔액을 정상적으로 유지한다', async () => {
    walletApi.getWallet.mockResolvedValue({
      data: { result: { walletId: 'wallet-1', walletBalance: 0 } },
    })

    const store = useWalletStore()

    await store.fetchWallet()

    expect(store.wallet.totalBalance).toBe(0)
  })

  it('fetchWallet() 실패 시 이전 지갑 정보를 제거하고 오류를 전달한다', async () => {
    const requestError = new Error('network error')
    walletApi.getWallet.mockRejectedValue(requestError)

    const store = useWalletStore()
    store.wallet = { walletId: 'stale-wallet', totalBalance: 99999 }

    await expect(store.fetchWallet()).rejects.toBe(requestError)
    expect(store.wallet).toBeNull()
  })

  it('간편 비밀번호 검증 결과를 boolean으로 반환한다', async () => {
    walletApi.verifySimplePassword.mockResolvedValue({
      data: { result: { verified: true } },
    })

    const store = useWalletStore()

    await expect(store.verifySimplePassword('482913')).resolves.toBe(true)
    expect(walletApi.verifySimplePassword).toHaveBeenCalledWith('482913')
  })

  it('같은 출금을 재시도하면 멱등키를 재사용한다', async () => {
    const networkError = new Error('network error')
    walletApi.withdraw
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        data: {
          result: {
            transactionId: '9013',
            walletBalance: 99000,
            accountId: '12',
          },
        },
      })
    const store = useWalletStore()
    const request = {
      accountId: '12',
      amount: 1000,
      memo: '내 계좌로 출금',
      password: '482913',
    }

    await expect(store.withdraw(request)).rejects.toBe(networkError)
    await expect(store.withdraw(request)).resolves.toMatchObject({ transactionId: '9013' })

    const [firstRequest, retriedRequest] = walletApi.withdraw.mock.calls.map(([payload]) => payload)
    expect(retriedRequest.idempotencyKey).toBe(firstRequest.idempotencyKey)
    expect(store.wallet.totalBalance).toBe(99000)
    expect(sessionStorage.getItem('pendingWalletWithdrawal')).toBeNull()
  })

  it('출금 내용이 바뀌면 새 멱등키를 사용한다', async () => {
    walletApi.withdraw.mockRejectedValue(new Error('network error'))
    const store = useWalletStore()

    await expect(store.withdraw({
      accountId: '12', amount: 1000, memo: '', password: '482913',
    })).rejects.toThrow()
    await expect(store.withdraw({
      accountId: '12', amount: 2000, memo: '', password: '482913',
    })).rejects.toThrow()

    const [firstRequest, changedRequest] = walletApi.withdraw.mock.calls.map(([payload]) => payload)
    expect(changedRequest.idempotencyKey).not.toBe(firstRequest.idempotencyKey)
  })
})
