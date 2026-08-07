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
 * body: { bankCode, accountNumber }
 * result: { transactionId }
 * ⚠️ maskedAccountNumber/expiresInSeconds는 서버가 안 내려줘요.
 * store(requestDepositAuth)에서 클라이언트가 직접 계산해서 채워요.
 */
export function requestDepositVerification(payload) {
  return api.post('/accounts/verify-deposit', payload);
}

/**
 * 1원 인증 확인 — 입금자명에 찍힌 랜덤 한글 단어(예: 푸른애월) 검증
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
 * body: { transactionId, isPrimary? }
 * result: { accountId, bankCode, bankName, accountNumber, isPrimary, status }
 * 실시간 잔액 조회(CODEF Connected ID)는 지원하지 않아요 — 사용자의 인터넷뱅킹
 * 아이디/비밀번호를 제3자에 넘겨야 해서 신뢰 문제가 있고, 앱 핵심 기능은 어차피
 * 내부 지갑 잔액만 쓰기 때문에 기능 자체를 제거했어요(2026-08-06).
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

/**
 * 간편 비밀번호 설정 — 최초 계좌 연동 시 1회만 호출 (계정당 하나)
 * POST /api/members/simple-password
 * body: { password }
 * ⚠️ 아직 Notion API 명세서에 없는 엔드포인트예요. 명세 확정되면 경로/응답 다시 확인 필요.
 */
export function setSimplePassword(password) {
  return api.post('/members/simple-password', { password });
}