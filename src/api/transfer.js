import api from './index'

// 송금(TransferView 등)에서 아직 실제 API를 호출하지 않고 mock으로만 동작 중이라
// 명세에 맞춰 모듈만 먼저 준비해둔다. 화면 연동은 백엔드 연동 시점에 진행.
export const transferApi = {
  // 송금 대상 예금주 조회
  // body: { bankCode, accountNumber } → result: { accountHolderName }
  verifyAccountHolder({ bankCode, accountNumber }) {
    return api.post('/transfer/verify', { bankCode, accountNumber })
  },

  // 송금 실행
  // body: { bankCode, accountNumber, amount, memo, password }
  // result: { transactionId, walletBalance, accountHolderName, transferredAt }
  transferMoney({ bankCode, accountNumber, amount, memo, password }) {
    return api.post('/transfer', { bankCode, accountNumber, amount, memo, password })
  },
}
