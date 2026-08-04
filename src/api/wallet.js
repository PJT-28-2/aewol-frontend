import api from './index'

export const walletApi = {
  getWallet() {
    return api.get('/wallet')
  },

  // 지갑 충전 — 실제 백엔드(aewol-backend WalletController)는 amount를 쿼리 파라미터로 받는다
  charge(amount) {
    return api.post('/wallet/deposit', null, { params: { amount } })
  },
}
