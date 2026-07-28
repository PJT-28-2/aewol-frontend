import api from '@/api';

/**
 * 은행 목록 조회
 * GET /api/banks
 * result: [{ bankCode, bankName }]
 */
export function getBanks() {
  return api.get('/api/banks');
}

/**
 * 연동 계좌 목록 조회
 * GET /api/accounts
 * result: [{ accountId, bankCode, accountNumberMasked, balance, isPrimary }]
 */
export function getAccounts() {
  return api.get('/api/accounts');
}

/**
 * 1원 인증 요청 — 선택한 은행 계좌로 1원을 송금하고 입금자명 4자리를 발급
 * POST /api/accounts/verify-deposit
 * body: { bankCode, accountNumber }
 * result: { verificationId, maskedAccountNumber, expiresInSeconds }
 */
export function requestDepositVerification(payload) {
  return api.post('/api/accounts/verify-deposit', payload);
}

/**
 * 1원 인증 확인 — 사용자가 입력한 입금자명 4자리 검증
 * POST /api/accounts/verify-deposit/confirm
 * body: { verificationId, depositorName }
 * result: { verified: boolean }
 */
export function confirmDepositVerification(payload) {
  return api.post('/api/accounts/verify-deposit/confirm', payload);
}

/**
 * 계좌 등록 — 1원 인증 완료 후 실제 계좌 연동 확정
 * POST /api/accounts
 * body: { verificationId, bankCode, accountNumber }
 * result: { accountId, bankCode, accountNumberMasked, balance, isPrimary }
 */
export function registerAccount(payload) {
  return api.post('/api/accounts', payload);
}

/**
 * 대표 계좌 설정
 * PATCH /api/accounts/{accountId}
 * body: { isPrimary: true }
 */
export function setPrimaryAccount(accountId) {
  return api.patch(`/api/accounts/${accountId}`, { isPrimary: true });
}

/**
 * 계좌 연동 해제
 * DELETE /api/accounts/{accountId}
 */
export function unlinkAccount(accountId) {
  return api.delete(`/api/accounts/${accountId}`);
}
