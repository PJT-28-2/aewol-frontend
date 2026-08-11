import { defineStore } from 'pinia'
import { walletApi } from '@/api/wallet'

// 백엔드 WalletResponse의 잔액 필드는 자바 필드명이 totalBalance지만
// @JsonProperty("walletBalance")가 붙어 있어 JSON 키는 walletBalance로 내려온다.
// 화면은 계속 totalBalance를 쓰므로 여기서 한 번만 맞춰준다.
function normalizeWallet(result) {
  if (!result) return null
  return { ...result, totalBalance: Number(result.walletBalance ?? result.totalBalance ?? 0) }
}

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    wallet: null,
  }),

  actions: {
    async fetchWallet() {
      // 백엔드 응답은 { status, message, result: WalletResponse } 래퍼라 data.result가 실제 지갑 정보
      const { data } = await walletApi.getWallet()
      this.wallet = normalizeWallet(data.result)
      return this.wallet
    },

    async charge(amount) {
      const { data } = await walletApi.charge(amount)
      this.wallet = normalizeWallet(data.result ?? data)
      return this.wallet
    },
  },
})
