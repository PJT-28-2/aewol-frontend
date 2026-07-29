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
import { MOCK_BANKS, MOCK_ACCOUNTS, USE_MOCK_DATA } from '@/utils/mockData';

export const useAccountStore = defineStore('account', {
  state: () => ({
    banks: [],
    accounts: [],
    isLoading: false,
    error: null,

    // 계좌 연동 플로우 진행 중 상태
    linking: {
      bankCode: null,
      accountNumber: '',
      verificationId: null,
      maskedAccountNumber: '',
      expiresInSeconds: 0,
    },

    // 연동 해제 대상 (바텀시트에서 참조)
    pendingUnlinkAccount: null,
  }),

  getters: {
    primaryAccount: (state) => state.accounts.find((a) => a.isPrimary) ?? null,
  },

  actions: {
    // 실제 API 호출 구간에서 공통으로 쓰는 로딩·에러 상태 래퍼.
    // 목데이터 모드는 즉시 반환이라 실패 자체가 없으므로 각 액션에서 이 래퍼를 타지 않음.
    async _withRequestState(request) {
      this.isLoading = true;
      this.error = null;
      try {
        return await request();
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.isLoading = false;
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
    async requestDepositAuth(accountNumber) {
      this.linking.accountNumber = accountNumber;

      if (USE_MOCK_DATA) {
        const masked =
          accountNumber.length > 4
            ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
            : accountNumber;
        this.linking.verificationId = `mock-${Date.now()}`;
        this.linking.maskedAccountNumber = masked;
        this.linking.expiresInSeconds = 180;
        return { verificationId: this.linking.verificationId };
      }

      return this._withRequestState(async () => {
        const { data } = await requestDepositVerification({
          bankCode: this.linking.bankCode,
          accountNumber,
        });
        this.linking.verificationId = data.result.verificationId;
        this.linking.maskedAccountNumber = data.result.maskedAccountNumber;
        this.linking.expiresInSeconds = data.result.expiresInSeconds;
        return data.result;
      });
    },

    // POST /api/accounts/verify-deposit/confirm — 목데이터 모드에선 4자리만 채우면 통과
    async confirmDepositAuth(depositorName) {
      if (USE_MOCK_DATA) {
        return depositorName.length === 4;
      }
      return this._withRequestState(async () => {
        const { data } = await confirmDepositVerification({
          verificationId: this.linking.verificationId,
          depositorName,
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
        return mockAccount;
      }
      return this._withRequestState(async () => {
        const { data } = await registerAccount({
          verificationId: this.linking.verificationId,
          bankCode: this.linking.bankCode,
          accountNumber: this.linking.accountNumber,
        });
        this.accounts.push(data.result);
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
      };
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
    async confirmUnlink() {
      if (!this.pendingUnlinkAccount) return;

      if (USE_MOCK_DATA) {
        this.accounts = this.accounts.filter(
          (a) => a.accountId !== this.pendingUnlinkAccount.accountId,
        );
        return;
      }

      await this._withRequestState(async () => {
        await unlinkAccount(this.pendingUnlinkAccount.accountId);
        this.accounts = this.accounts.filter(
          (a) => a.accountId !== this.pendingUnlinkAccount.accountId,
        );
      });
    },
  },
});