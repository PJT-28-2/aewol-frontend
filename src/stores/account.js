import { defineStore } from 'pinia';
import {
  getBanks,
  getAccounts,
  requestDepositVerification,
  confirmDepositVerification,
  registerAccount,
  setPrimaryAccount,
  unlinkAccount,
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

    // 계좌 연동 플로우 진행 중 상태
    linking: {
      bankCode: null,
      accountNumber: '',
      accountHolder: '',
      verificationId: null,
      maskedAccountNumber: '',
      expiresInSeconds: 0,
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
    async requestDepositAuth(accountNumber, accountHolder) {
      this.linking.accountNumber = accountNumber;
      this.linking.accountHolder = accountHolder;

      const masked =
        accountNumber.length > 4
          ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
          : accountNumber;
      const DEPOSIT_AUTH_TIMEOUT_SECONDS = 180;

      if (USE_MOCK_DATA) {
        this.linking.verificationId = `mock-${Date.now()}`;
        this.linking.maskedAccountNumber = masked;
        this.linking.expiresInSeconds = DEPOSIT_AUTH_TIMEOUT_SECONDS;
        return { verificationId: this.linking.verificationId };
      }

      return this._withRequestState(async () => {
        const { data } = await requestDepositVerification({
          bankCode: this.linking.bankCode,
          accountNumber,
          accountHolder,
        });
        this.linking.verificationId = data.result.transactionId;
        this.linking.maskedAccountNumber = masked;
        this.linking.expiresInSeconds = DEPOSIT_AUTH_TIMEOUT_SECONDS;
        return { verificationId: this.linking.verificationId };
      });
    },

    // POST /api/accounts/verify-deposit/confirm — 목데이터 모드에선 4자리만 채우면 통과
    // verificationCode: 입금자명에 찍히는 랜덤 한글 4자 (예: 파란애월)
    async confirmDepositAuth(verificationCode) {
      if (USE_MOCK_DATA) {
        return verificationCode.length === 4;
      }
      return this._withRequestState(async () => {
        const { data } = await confirmDepositVerification({
          transactionId: this.linking.verificationId,
          verificationCode,
        });
        return data.result.verified;
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
          balance: 100000,
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
        // 등록(POST) 자체는 여기서 이미 성공이 확정돼요. 아래 목록 재조회가
        // 실패하더라도 이 성공을 실패로 되돌리면 안 돼요 — 재시도 시 이미 쓴
        // transactionId로 다시 요청하거나 계좌가 중복 등록될 수 있어요.
        this.lastLinkedAccountId = data.result.accountId;

        try {
          // 백엔드의 POST /api/accounts 응답(AccountResponse)엔 balance가 없어서
          // 등록 응답을 그대로 쓰면 완료 화면 잔액이 비어요.
          // GET /api/accounts로 다시 조회해서 balance가 포함된 완전한 데이터로 채워요.
          const { data: listData } = await getAccounts();
          this.accounts = listData.result ?? [];
        } catch (refreshErr) {
          // 목록 재조회 실패는 등록 성공과 별개의 문제예요. 등록된 계좌를
          // 등록 응답만으로라도 목록에 반영해두고(잔액은 다음 조회 때 채워짐),
          // 에러는 별도로 기록만 해서 흐름을 막지 않아요.
          if (!this.accounts.some((a) => a.accountId === this.lastLinkedAccountId)) {
            this.accounts = [...this.accounts, data.result];
          }
          this.error = refreshErr;
        }

        return this.accounts.find((a) => a.accountId === this.lastLinkedAccountId) ?? data.result;
      });
    },

    resetLinkingState() {
      this.linking = {
        bankCode: null,
        accountNumber: '',
        accountHolder: '',
        verificationId: null,
        maskedAccountNumber: '',
        expiresInSeconds: 0,
      };
      this.lastLinkedAccountId = null;
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