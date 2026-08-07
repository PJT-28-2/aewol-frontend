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
    hasSimplePassword: localStorage.getItem('hasSimplePassword') === 'true',
    // 완료 화면에서 "비밀번호 설정까지 완료됐어요" 문구를 이번 플로우에서만
    // 보여주기 위한 1회성 플래그. resetLinkingState()에서 함께 초기화돼요.
    justSetSimplePassword: false,

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
      this.linking.bankCode = bankCode;
    },

    // POST /api/accounts/verify-deposit — 목데이터 모드에선 아무 계좌번호나 넣어도 바로 통과
    // ⚠️ 실제 API는 transactionId만 내려주고 maskedAccountNumber/expiresInSeconds는
    // 안 내려주기 때문에, 두 값 다 클라이언트에서 직접 계산해서 채워요.
    async requestDepositAuth(accountNumber) {
      this.linking.accountNumber = accountNumber;

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
        return { verificationId: this.linking.verificationId };
      }

      return this._withRequestState(async () => {
        // 예금주명(accountHolder)은 더 이상 안 보내요(2026-08-06) — CODEF와 대조하지
        // 않고 저장만 하던 값이라 검증 효과가 없었어요.
        const { data } = await requestDepositVerification({
          bankCode: this.linking.bankCode,
          accountNumber,
        });
        this.linking.verificationId = data.result.transactionId;
        this.linking.maskedAccountNumber = masked;
        this.linking.expiresInSeconds = DEPOSIT_AUTH_TIMEOUT_SECONDS;
        this.linking.depositAuthExpiresAt = Date.now() + DEPOSIT_AUTH_TIMEOUT_SECONDS * 1000;
        this.linking.isConfirmLocked = false;
        // CODEF가 만든 입금자명 실제 길이 — 4자가 아닐 수 있어서 항상 이 값을 신뢰해요.
        this.linking.depositorNameLength = data.result.depositorNameLength || 4;
        return { verificationId: this.linking.verificationId };
      });
    },

    // POST /api/accounts/verify-deposit/confirm — 목데이터 모드에선 depositorNameLength만큼만 채우면 통과
    // verificationCode: 입금자명에 찍히는 랜덤 한글 단어 (예: 푸른애월)
    // { verified, reason } 형태로 반환해요 — 백엔드가 오답 5회 초과 시 verified=false에
    // reason="TOO_MANY_ATTEMPTS"를 내려주기 시작해서(2026-08-07), 단순 오타(MISMATCH)와
    // 구분해서 다른 안내 문구를 보여줄 수 있게 reason도 그대로 넘겨요.
    async confirmDepositAuth(verificationCode) {
      if (USE_MOCK_DATA) {
        const verified = verificationCode.length === this.linking.depositorNameLength;
        return { verified, reason: verified ? null : 'MISMATCH' };
      }
      return this._withRequestState(async () => {
        const { data } = await confirmDepositVerification({
          transactionId: this.linking.verificationId,
          verificationCode,
        });
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
      this.linking = {
        bankCode: null,
        accountNumber: '',
        verificationId: null,
        maskedAccountNumber: '',
        expiresInSeconds: 0,
        depositAuthExpiresAt: 0,
        isConfirmLocked: false,
        depositorNameLength: 4,
        password: '',
      };
      this.lastLinkedAccountId = null;
      this.justSetSimplePassword = false;
    },

    // 비밀번호 설정 화면에서 입력한 값을 확인 화면에서 비교할 수 있도록 잠깐 보관
    setPendingPassword(password) {
      this.linking.password = password;
    },

    // POST /api/members/simple-password — 확인 화면에서 재입력한 값이 최초 입력값과
    // 일치할 때만 호출해요. 목데이터 모드에선 API 호출 없이 바로 통과시켜요.
    async confirmSimplePassword(password) {
      if (password !== this.linking.password) {
        return false;
      }
      if (!USE_MOCK_DATA) {
        await this._withRequestState(async () => {
          await setSimplePassword(password);
        });
      }
      this.hasSimplePassword = true;
      this.justSetSimplePassword = true;
      localStorage.setItem('hasSimplePassword', 'true');
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