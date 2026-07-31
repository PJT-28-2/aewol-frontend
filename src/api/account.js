import api from '@/api';
// baseURL(axios 인스턴스)이 이미 /api를 포함하므로 아래 경로에는 /api를 다시 붙이지 않는다

/**
 * 은행 목록 조회
 * GET /api/banks
 * result: [{ bankCode, bankName }]
 */
export function getBanks() {
  return api.get('/banks');
}

/**
 * 연동 계좌 목록 조회
 * GET /api/accounts
 * result: [{ accountId, bankCode, accountNumberMasked, balance, isPrimary }]
 */
export function getAccounts() {
  return api.get('/accounts');
}

/**
 * 1원 인증 요청 — 선택한 은행 계좌로 1원을 송금하고 입금자명 4자리를 발급
 * POST /api/accounts/verify-deposit
 * body: { bankCode, accountNumber }
 * result: { verificationId, maskedAccountNumber, expiresInSeconds }
 */
export function requestDepositVerification(payload) {
  return api.post('/accounts/verify-deposit', payload);
}

/**
 * 1원 인증 확인 — 사용자가 입력한 입금자명 4자리 검증
 * POST /api/accounts/verify-deposit/confirm
 * body: { verificationId, depositorName }
 * result: { verified: boolean }
 */
export function confirmDepositVerification(payload) {
  return api.post('/accounts/verify-deposit/confirm', payload);
}

/**
 * 계좌 등록 — 1원 인증 완료 후 실제 계좌 연동 확정
 * POST /api/accounts
 * body: { verificationId, bankCode, accountNumber }
 * result: { accountId, bankCode, accountNumberMasked, isPrimary }
 * ⚠️ 실제 백엔드 AccountResponse엔 balance가 없어요.
 * 등록 후 잔액이 필요하면 store에서 GET /api/accounts로 다시 조회해 채워요.
 */
export function registerAccount(payload) {
  return api.post('/accounts', payload);
}

/**
 * 대표 계좌 설정
 * PATCH /api/accounts/{accountId}
 * body: { isPrimary: true }
 */
export function setPrimaryAccount(accountId) {
  return api.patch(`/accounts/${accountId}`, { isPrimary: true });
}

/**
 * 계좌 연동 해제
 * DELETE /api/accounts/{accountId}
 */
export function unlinkAccount(accountId) {
  return api.delete(`/accounts/${accountId}`);
}