import { defineStore } from 'pinia'
import { walletApi } from '@/api/wallet'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    wallet: null,
    buckets: [],
  }),

  actions: {
    async fetchWallet() {
      const { data } = await walletApi.getWallet()
      this.wallet = data
      return data
    },

    async fetchBuckets() {
      const { data } = await walletApi.getBuckets()
      this.buckets = data
      return data
    },

    async createBucket(bucketData) {
      const { data } = await walletApi.createBucket(bucketData)
      this.buckets.push(data)
      return data
    },

    async updateBucket(id, bucketData) {
      const { data } = await walletApi.updateBucket(id, bucketData)
      const index = this.buckets.findIndex((b) => b.id === id)
      if (index !== -1) this.buckets[index] = data
      return data
    },

    async deleteBucket(id) {
      await walletApi.deleteBucket(id)
      this.buckets = this.buckets.filter((b) => b.id !== id)
    },

    async charge(amount) {
      const { data } = await walletApi.charge(amount)
      // 백엔드 WalletResponse 필드명(totalBalance) 기준
      if (this.wallet) this.wallet.totalBalance = data.totalBalance
      else this.wallet = data
      return data
    },

    async transferBucket(fromBucketId, toBucketId, amount) {
      const { data } = await walletApi.transferBucket(fromBucketId, toBucketId, amount)
      return data
    },
  },
})
