import { defineStore } from 'pinia'
import { walletApi } from '@/api/wallet'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    wallet: null,
  }),

  actions: {
    async fetchWallet() {
      // 백엔드 응답은 { status, message, result: WalletResponse } 래퍼라 data.result가 실제 지갑 정보
      const { data } = await walletApi.getWallet()
      this.wallet = data.result
      return this.wallet
    },

    async charge(amount) {
      const { data } = await walletApi.charge(amount)
      // 백엔드 WalletResponse 필드명(totalBalance) 기준
      if (this.wallet) this.wallet.totalBalance = data.totalBalance
      else this.wallet = data
      return data
    },
  },
})
