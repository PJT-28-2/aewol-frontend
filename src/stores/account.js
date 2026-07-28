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
    // GET /api/banks — API 연동 전엔 USE_MOCK_DATA로 바로 목데이터 사용
    async fetchBanks() {
      if (USE_MOCK_DATA) {
        this.banks = MOCK_BANKS;
        return;
      }
      const { data } = await getBanks();
      this.banks = data.result ?? [];
    },

    // GET /api/accounts — API 연동 전엔 USE_MOCK_DATA로 바로 목데이터 사용
    async fetchAccounts() {
      if (USE_MOCK_DATA) {
        this.accounts = structuredClone(MOCK_ACCOUNTS);
        return;
      }
      this.isLoading = true;
      this.error = null;
      try {
        const { data } = await getAccounts();
        this.accounts = data.result ?? [];
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.isLoading = false;
      }
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
            ? `${accountNumber.slice(0, 4)}${'*'.repeat(accountNumber.length - 4)}`
            : accountNumber;
        this.linking.verificationId = `mock-${Date.now()}`;
        this.linking.maskedAccountNumber = masked;
        this.linking.expiresInSeconds = 180;
        return { verificationId: this.linking.verificationId };
      }

      const { data } = await requestDepositVerification({
        bankCode: this.linking.bankCode,
        accountNumber,
      });
      this.linking.verificationId = data.result.verificationId;
      this.linking.maskedAccountNumber = data.result.maskedAccountNumber;
      this.linking.expiresInSeconds = data.result.expiresInSeconds;
      return data.result;
    },

    // POST /api/accounts/verify-deposit/confirm — 목데이터 모드에선 4자리만 채우면 통과
    async confirmDepositAuth(depositorName) {
      if (USE_MOCK_DATA) {
        return depositorName.length === 4;
      }
      const { data } = await confirmDepositVerification({
        verificationId: this.linking.verificationId,
        depositorName,
      });
      return data.result.verified;
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
      const { data } = await registerAccount({
        verificationId: this.linking.verificationId,
        bankCode: this.linking.bankCode,
        accountNumber: this.linking.accountNumber,
      });
      this.accounts.push(data.result);
      return data.result;
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

    async makePrimary(accountId) {
      if (!USE_MOCK_DATA) {
        await setPrimaryAccount(accountId);
      }
      this.accounts = this.accounts.map((a) => ({
        ...a,
        isPrimary: a.accountId === accountId,
      }));
    },

    openUnlinkConfirm(account) {
      this.pendingUnlinkAccount = account;
    },

    closeUnlinkConfirm() {
      this.pendingUnlinkAccount = null;
    },

    async confirmUnlink() {
      if (!this.pendingUnlinkAccount) return;
      if (!USE_MOCK_DATA) {
        await unlinkAccount(this.pendingUnlinkAccount.accountId);
      }
      this.accounts = this.accounts.filter(
        (a) => a.accountId !== this.pendingUnlinkAccount.accountId,
      );
    },
  },
});
