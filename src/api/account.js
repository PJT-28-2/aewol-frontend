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
 * 1원 인증 요청 — 선택한 은행 계좌로 1원을 송금
 * POST /api/accounts/verify-deposit
 * body: { bankCode, accountNumber, accountHolder }
 * result: { transactionId }
 * ⚠️ maskedAccountNumber/expiresInSeconds는 서버가 안 내려줘요.
 * store(requestDepositAuth)에서 클라이언트가 직접 계산해서 채워요.
 */
export function requestDepositVerification(payload) {
  return api.post('/accounts/verify-deposit', payload);
}

/**
 * 1원 인증 확인 — 입금자명에 찍힌 랜덤 한글 4자(예: 파란애월) 검증
 * POST /api/accounts/verify-deposit/confirm
 * body: { transactionId, verificationCode }
 * result: { verified: boolean }
 */
export function confirmDepositVerification(payload) {
  return api.post('/accounts/verify-deposit/confirm', payload);
}

/**
 * 계좌 등록 — 1원 인증 완료 후 실제 계좌 연동 확정
 * POST /api/accounts
 * body: { transactionId }
 * result: { accountId, bankCode, bankName, accountNumber, isPrimary }
 * ⚠️ 실제 백엔드 응답엔 balance가 없어요.
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