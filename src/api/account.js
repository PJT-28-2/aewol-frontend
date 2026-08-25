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
 * 간편 비밀번호 설정/재설정 — 최초 계좌 연동 시 1회, 이후에는 재설정할 때 호출해요.
 * POST /api/users/simple-password
 * body: { password, currentPassword? }
 * ⚠️ MemberController가 마이페이지 리팩토링 때 /api/members → /api/users로 이동했어요.
 * 이 파일이 예전 /members 경로로 되돌아가 있는 걸 재발견한 적 있으니, 404가 나면 가장
 * 먼저 이 경로부터 의심할 것(2026-08-11).
 * ⚠️ 아직 Notion API 명세서에 없는 엔드포인트예요. 명세 확정되면 경로/응답 다시 확인 필요.
 * currentPassword는 이미 PIN이 설정된 회원의 재설정일 때만 필요해요(서버
 * MemberServiceImpl.setSimplePassword가 기존 PIN 확인 없이 덮어쓰는 걸 막아요) — 최초
 * 설정(계좌 연동 직후)에는 넘기지 않아도 돼요.
 */
export function setSimplePassword(password, currentPassword) {
  return api.post(
    '/users/simple-password',
    currentPassword ? { password, currentPassword } : { password },
  );
}

/**
 * 간편 비밀번호 확인 — 재설정 전 현재 PIN이 맞는지 확인할 때 사용해요.
 * POST /api/users/simple-password/verify
 * body: { password }
 * result: { verified: boolean }
 */
export function verifySimplePassword(password) {
  return api.post('/users/simple-password/verify', { password });
}
