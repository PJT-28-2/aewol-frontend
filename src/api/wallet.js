import api from './index'

export const walletApi = {
  getWallet() {
    return api.get('/wallet')
  },

  // 충전 요청
  charge(accountId, amount) {
    return api.post('/wallet/charge', { accountId, amount })
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
