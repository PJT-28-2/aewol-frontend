import api from './index'

export const walletApi = {
  getWallet() {
    return api.get('/wallet')
  },

  // 지갑 충전 — 실제 백엔드(aewol-backend WalletController)는 amount를 쿼리 파라미터로 받는다
  charge(amount) {
    return api.post('/wallet/deposit', null, { params: { amount } })
  },

  getBuckets() {
    return api.get('/wallet/buckets')
  },

  createBucket(data) {
    return api.post('/wallet/buckets', data)
  },

  updateBucket(id, data) {
    return api.put(`/wallet/buckets/${id}`, data)
  },

  deleteBucket(id) {
    return api.delete(`/wallet/buckets/${id}`)
  },

  transferBucket(fromBucketId, toBucketId, amount) {
    return api.post('/wallet/buckets/transfer', { fromBucketId, toBucketId, amount })
  },
}
