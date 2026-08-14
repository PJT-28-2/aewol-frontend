import api from './index'

export const walletApi = {
  getWallet() {
    return api.get('/wallet')
  },

  prepareTossCharge(amount) {
    return api.post('/wallet/toss-charge/prepare', { amount })
  },

  confirmTossCharge({ paymentKey, orderId, amount }) {
    return api.post('/wallet/toss-charge', { paymentKey, orderId, amount })
  },

  verifySimplePassword(password) {
    return api.post('/users/simple-password/verify', { password })
  },

  withdraw({ accountId, amount, memo, password, idempotencyKey }) {
    return api.post(
      '/wallet/withdraw',
      { accountId: String(accountId), amount, memo, password },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
  },
}
