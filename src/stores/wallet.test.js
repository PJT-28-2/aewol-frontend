import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/wallet', () => ({
  walletApi: {
    getWallet: vi.fn(),
    charge: vi.fn(),
  },
}))

import { walletApi } from '@/api/wallet'
import { useWalletStore } from './wallet'

describe('useWalletStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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
})
