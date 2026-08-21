import { defineStore } from 'pinia';
import {
  getBanks,
  getAccounts,
  requestDepositVerification,
  confirmDepositVerification,
  registerAccount,
  setPrimaryAccount,
  unlinkAccount,
  setSimplePassword,
} from '@/api/account';
import { getBankMeta } from '@/utils/bankMeta';
import { MOCK_BANKS, MOCK_ACCOUNTS } from '@/mocks/account';
import { USE_MOCK_DATA } from '@/mocks/config';

// 계좌 연동 진행 상태(linking)에 대한 요청 세대 토큰. Pinia reactive state에 넣지 않고
// emergency.js의 latestRequestId/AbortController와 같은 방식으로 스토어 밖(모듈 스코프)에
// 둔다 — selectBankToLink/resetLinkingState가 필드를 초기화해도, 그 전에 이미 날아간
// requestDepositAuth/confirmDepositAuth의 응답이 늦게 도착하면 오래된 값으로 state를
// 다시 채워버릴 수 있다(CodeRabbit 지적, 2026-08-08). 초기화할 때마다 세대를 올리고,
// 응답을 반영하기 직전에 같은 세대인지 확인해서 오래된 응답은 무시한다.
let linkingRequestGeneration = 0;

export const useAccountStore = defineStore('account', {
  state: () => ({
    banks: [],
    accounts: [],
    // isLoading은 아래 getter로 계산돼요. 동시에 여러 요청이 겹칠 때
    // 먼저 끝난 요청의 finally가 아직 진행 중인 다른 요청의 로딩 상태를
    // 꺼버리지 않도록, 단순 boolean 대신 진행 중인 요청 수를 센 뒤 0일 때만 false예요.
    pendingRequestCount: 0,
    error: null,

    // 간편 비밀번호는 계정당 하나만 존재해요. 최초 계좌 연동 때 한 번만 설정하고
    // 이후 계좌 연동부터는 이 값으로 설정 단계 자체를 건너뛰어요.
    // 실제 비밀번호 값은 저장하지 않고, "설정된 적이 있는지" 여부만 남겨요.
    // ⚠️ 이 초기값은 새로고침 사이 깜빡임을 줄이기 위한 임시값일 뿐이에요 — 진짜 기준은
    // 서버(GET /api/users/me의 hasSimplePassword)예요. member.js의 fetchProfile()이
    // 로그인/새로고침마다 setHasSimplePassword()로 이 값을 서버 기준으로 덮어써요.
    // localStorage만 믿으면 새 기기·새 브라우저나 같은 브라우저에서 다른 계정으로
    // 로그인했을 때 서버 상태와 어긋나서, 이미 PIN이 있는데도 설정 화면으로 보내려다
    // 백엔드가 기존 PIN 확인을 요구하며 막는 문제가 있었다(2026-08-13 코드리뷰 지적).
    hasSimplePassword: localStorage.getItem('hasSimplePassword') === 'true',

    // 계좌 연동 플로우 진행 중 상태
    linking: {
      bankCode: null,
      accountNumber: '',
      verificationId: null,
      maskedAccountNumber: '',
      expiresInSeconds: 0,
      // 남은 시간 계산용 절대 만료 시각(epoch ms). setInterval로 세는 숫자 대신 이걸 기준으로
      // 계산해야 화면을 나갔다 들어와도(컴포넌트 재마운트) 실제 경과 시간이 정확히 반영돼요.
      depositAuthExpiresAt: 0,
      // 오답 5회 초과(TOO_MANY_ATTEMPTS) 잠금 여부. store에 둬서 나갔다 들어와도 유지돼요
      // (2026-08-07) — 화면 로컬 상태였을 땐 재마운트하면 풀린 것처럼 보였지만, 서버 쪽
      // 제한은 그대로라 사용자만 혼란스러웠어요.
      isConfirmLocked: false,
      // CODEF inPrintType=1(랜덤 한글 단어)이라 4~6자로 들쭉날쭉해요. 목데이터 모드나
      // 응답이 없는 경우를 대비해 기본값 4를 둬요.
      depositorNameLength: 4,
      // 백엔드가 verify-deposit 응답에 실어서 보내는 시연용 입금자명
      // (DepositVerificationResponse.depositorNameForTest). CODEF 데모 서버에 붙어 있고
      // local/test 프로파일이거나 demo.expose-depositor-name이 켜져 있을 때만 값이 와요
      // (#290). 실제 1원이 오가는 정식 서버에서는 어떤 설정이든 항상 null이라,
      // AccountAuthOneWon.vue의 알림 카드도 자연히 뜨지 않아요.
      depositorNameForTest: null,
      // 비밀번호 설정 화면에서 입력한 값을 확인 화면으로 넘길 때까지만 메모리에 잠깐 보관
      password: '',
    },

    // 연동 해제 대상 (바텀시트에서 참조)
    pendingUnlinkAccount: null,

    // 방금 연동 완료된 계좌 ID — AccountLinkComplete.vue에서 "배열의 마지막 항목"
    // 같은 불안정한 추측 대신 이 값으로 정확히 그 계좌를 찾아요.
    lastLinkedAccountId: null,
  }),

  getters: {
    primaryAccount: (state) => state.accounts.find((a) => a.isPrimary) ?? null,
    isLoading: (state) => state.pendingRequestCount > 0,
  },

  actions: {
    // 실제 API 호출 구간에서 공통으로 쓰는 로딩·에러 상태 래퍼.
    // 목데이터 모드는 즉시 반환이라 실패 자체가 없으므로 각 액션에서 이 래퍼를 타지 않음.
    async _withRequestState(request) {
      this.pendingRequestCount += 1;
      this.error = null;
      try {
        return await request();
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.pendingRequestCount -= 1;
      }
    },

    // member.js의 fetchProfile()(로그인 시 + 새로고침 후 첫 진입 시)과 auth.js의
    // clearSession()(로그아웃 시)에서 호출해서, PIN 설정 여부를 항상 서버 기준으로
    // 맞춘다. localStorage는 새로고침 사이 깜빡임 방지용 캐시일 뿐이라 여기서 같이 갱신한다.
    setHasSimplePassword(value) {
      this.hasSimplePassword = !!value;
      if (this.hasSimplePassword) {
        localStorage.setItem('hasSimplePassword', 'true');
      } else {
        localStorage.removeItem('hasSimplePassword');
      }
    },

    // GET /api/banks — API 연동 전엔 USE_MOCK_DATA로 바로 목데이터 사용
    async fetchBanks() {
      if (USE_MOCK_DATA) {
        this.banks = MOCK_BANKS;
        return;
      }
      await this._withRequestState(async () => {
        const { data } = await getBanks();
        this.banks = data.result ?? [];
      });
    },

    // GET /api/accounts — API 연동 전엔 USE_MOCK_DATA로 바로 목데이터 사용
    async fetchAccounts() {
      if (USE_MOCK_DATA) {
        this.accounts = structuredClone(MOCK_ACCOUNTS);
        return;
      }
      await this._withRequestState(async () => {
        const { data } = await getAccounts();
        this.accounts = data.result ?? [];
      });
    },

    selectBankToLink(bankCode) {
      // 은행을 바꿀 때 이전 은행에서 진행 중이던 1원 인증 상태를 그대로 두면,
      // AccountAuthOneWon.vue의 onMounted 복원 로직이 새 은행 화면에서도
      // 이전 verificationId(=transactionId)를 그대로 이어써서, 인증에 성공하면
      // 화면에 보이는 은행이 아니라 이전에 선택했던 은행 계좌가 연결될 수 있다
      // (리뷰 지적, 2026-08-08). 은행이 바뀌면 이전 인증 관련 상태를 초기화한다.
      if (this.linking.bankCode !== bankCode) {
        linkingRequestGeneration += 1;
        this.linking.accountNumber = '';
        this.linking.verificationId = null;
        this.linking.maskedAccountNumber = '';
        this.linking.expiresInSeconds = 0;
        this.linking.depositAuthExpiresAt = 0;
        this.linking.isConfirmLocked = false;
        this.linking.depositorNameLength = 4;
        this.linking.depositorNameForTest = null;
      }
      this.linking.bankCode = bankCode;
    },

    // POST /api/accounts/verify-deposit — 목데이터 모드에선 아무 계좌번호나 넣어도 바로 통과
    // ⚠️ 실제 API는 transactionId만 내려주고 maskedAccountNumber/expiresInSeconds는
    // 안 내려주기 때문에, 두 값 다 클라이언트에서 직접 계산해서 채워요.
    async requestDepositAuth(accountNumber) {
      this.linking.accountNumber = accountNumber;
      const requestGeneration = linkingRequestGeneration;

      const masked =
        accountNumber.length > 4
          ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
          : accountNumber;
      const DEPOSIT_AUTH_TIMEOUT_SECONDS = 180;

      if (USE_MOCK_DATA) {
        this.linking.verificationId = `mock-${Date.now()}`;
        this.linking.maskedAccountNumber = masked;
        this.linking.expiresInSeconds = DEPOSIT_AUTH_TIMEOUT_SECONDS;
        this.linking.depositAuthExpiresAt = Date.now() + DEPOSIT_AUTH_TIMEOUT_SECONDS * 1000;
        this.linking.isConfirmLocked = false;
        this.linking.depositorNameLength = 4;
        this.linking.depositorNameForTest = null;
        return { verificationId: this.linking.verificationId };
      }

      return this._withRequestState(async () => {
        // 예금주명(accountHolder)은 더 이상 안 보내요(2026-08-06) — CODEF와 대조하지
        // 않고 저장만 하던 값이라 검증 효과가 없었어요.
        const { data } = await requestDepositVerification({
          bankCode: this.linking.bankCode,
          accountNumber,
        });
        if (requestGeneration !== linkingRequestGeneration) {
          // 응답이 오는 사이 은행이 바뀌었거나 상태가 초기화됨 — 이전 시도의 응답이므로
          // 현재 linking state에 반영하지 않는다.
          return { verificationId: data.result.transactionId };
        }
        this.linking.verificationId = data.result.transactionId;
        this.linking.maskedAccountNumber = masked;
        this.linking.expiresInSeconds = DEPOSIT_AUTH_TIMEOUT_SECONDS;
        this.linking.depositAuthExpiresAt = Date.now() + DEPOSIT_AUTH_TIMEOUT_SECONDS * 1000;
        this.linking.isConfirmLocked = false;
        // CODEF가 만든 입금자명 실제 길이 — 4자가 아닐 수 있어서 항상 이 값을 신뢰해요.
        this.linking.depositorNameLength = data.result.depositorNameLength || 4;
        // 시연 노출 조건이 아니면 응답 자체에 필드가 없거나 null이라, 여기서도
        // 항상 null로 정규화돼요 — AccountAuthOneWon.vue는 이 값이 있을 때만 알림 카드를 띄워요.
        this.linking.depositorNameForTest = data.result.depositorNameForTest ?? null;
        return { verificationId: this.linking.verificationId };
      });
    },

    // POST /api/accounts/verify-deposit/confirm — 목데이터 모드에선 depositorNameLength만큼만 채우면 통과
    // verificationCode: 입금자명에 찍히는 랜덤 한글 단어 (예: 푸른애월)
    // { verified, reason } 형태로 반환해요 — 백엔드가 오답 5회 초과 시 verified=false에
    // reason="TOO_MANY_ATTEMPTS"를 내려주기 시작해서(2026-08-07), 단순 오타(MISMATCH)와
    // 구분해서 다른 안내 문구를 보여줄 수 있게 reason도 그대로 넘겨요.
    async confirmDepositAuth(verificationCode) {
      const requestGeneration = linkingRequestGeneration;
      if (USE_MOCK_DATA) {
        const verified = verificationCode.length === this.linking.depositorNameLength;
        return { verified, reason: verified ? null : 'MISMATCH' };
      }
      return this._withRequestState(async () => {
        const { data } = await confirmDepositVerification({
          transactionId: this.linking.verificationId,
          verificationCode,
        });
        if (requestGeneration !== linkingRequestGeneration) {
          // 응답이 오는 사이 은행이 바뀌었거나 상태가 초기화됨 — 이전 시도의 응답이라
          // isConfirmLocked 등 state를 건드리지 않고, 계좌 연동도 진행되지 않게
          // 실패로 처리한다(완료 화면에서 이전 은행의 transactionId를 쓰는 것 방지).
          return { verified: false, reason: 'STALE_REQUEST' };
        }
        const reason = data.result.reason ?? null;
        if (reason === 'TOO_MANY_ATTEMPTS') {
          this.linking.isConfirmLocked = true;
        }
        return { verified: data.result.verified, reason };
      });
    },

    // POST /api/accounts — 목데이터 모드에선 로컬로 계좌를 바로 추가
    async completeAccountLink() {
      if (USE_MOCK_DATA) {
        const bankMeta = getBankMeta(this.linking.bankCode);
        const mockAccount = {
          accountId: Date.now(),
          bankCode: this.linking.bankCode,
          accountNumberMasked: this.linking.maskedAccountNumber || bankMeta.name,
          isPrimary: this.accounts.length === 0,
        };
        this.accounts.push(mockAccount);
        this.lastLinkedAccountId = mockAccount.accountId;
        return mockAccount;
      }
      return this._withRequestState(async () => {
        // 명세서 요구사항: body는 transactionId 하나뿐. bankCode/accountNumber는
        // 이미 인증 단계(transactionId)로 서버가 알고 있어서 다시 보낼 필요 없어요.
        const { data } = await registerAccount({
          transactionId: this.linking.verificationId,
        });
        // 등록 응답(AccountResponse)에 목록 화면이 필요로 하는 값(bankName 포함)이
        // 이미 다 들어있어서(balance 제거 후 GET과 필드가 동일해짐), GET /api/accounts로
        // 다시 조회할 필요 없이 이 응답을 그대로 목록에 반영해요.
        this.lastLinkedAccountId = data.result.accountId;
        this.accounts = [...this.accounts, data.result];

        return data.result;
      });
    },

    resetLinkingState() {
      linkingRequestGeneration += 1;
      this.linking = {
        bankCode: null,
        accountNumber: '',
        verificationId: null,
        maskedAccountNumber: '',
        expiresInSeconds: 0,
        depositAuthExpiresAt: 0,
        isConfirmLocked: false,
        depositorNameLength: 4,
        depositorNameForTest: null,
        password: '',
      };
      this.lastLinkedAccountId = null;
    },

    // 비밀번호 설정 화면에서 입력한 값을 확인 화면에서 비교할 수 있도록 잠깐 보관
    setPendingPassword(password) {
      this.linking.password = password;
    },

    // POST /api/users/simple-password — 확인 화면에서 재입력한 값이 최초 입력값과
    // 일치할 때만 호출해요. 목데이터 모드에선 API 호출 없이 바로 통과시켜요.
    // ⚠️ 이 액션은 hasSimplePassword가 false일 때(=최초 설정)만 호출돼요
    // (AccountAuthOneWon.vue가 hasSimplePassword가 true면 이 화면 자체를 건너뛰어요).
    // 그래서 서버가 기존 PIN 재설정 시 요구하는 currentPassword는 여기서 보낼 필요가
    // 없어요 — hasSimplePassword가 서버와 어긋나 있지 않은 한(그래서 setHasSimplePassword로
    // 항상 서버 값과 동기화하는 게 중요함).
    async confirmSimplePassword(password) {
      if (password !== this.linking.password) {
        return false;
      }
      if (!USE_MOCK_DATA) {
        await this._withRequestState(async () => {
          await setSimplePassword(password);
        });
      }
      this.setHasSimplePassword(true);
      this.linking.password = '';
      return true;
    },

    // PATCH /api/accounts/{accountId}
    async makePrimary(accountId) {
      if (USE_MOCK_DATA) {
        this.accounts = this.accounts.map((a) => ({
          ...a,
          isPrimary: a.accountId === accountId,
        }));
        return;
      }
      await this._withRequestState(async () => {
        await setPrimaryAccount(accountId);
        this.accounts = this.accounts.map((a) => ({
          ...a,
          isPrimary: a.accountId === accountId,
        }));
      });
    },

    openUnlinkConfirm(account) {
      this.pendingUnlinkAccount = account;
    },

    closeUnlinkConfirm() {
      this.pendingUnlinkAccount = null;
    },

    // DELETE /api/accounts/{accountId}
    // pendingUnlinkAccount는 상태라 도중에 바뀌거나 비워질 수 있으므로,
    // 요청 시작 시점에 대상 accountId를 지역 변수로 캡처해서 끝까지 그 값만 사용해요.
    async confirmUnlink() {
      const targetAccountId = this.pendingUnlinkAccount?.accountId;
      if (!targetAccountId) return;

      if (USE_MOCK_DATA) {
        this.accounts = this.accounts.filter((a) => a.accountId !== targetAccountId);
        return;
      }

      await this._withRequestState(async () => {
        await unlinkAccount(targetAccountId);
        this.accounts = this.accounts.filter((a) => a.accountId !== targetAccountId);
      });
    },
  },
});
