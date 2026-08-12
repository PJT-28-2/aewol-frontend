import { defineStore } from 'pinia'
import { walletApi } from '@/api/wallet'

const PENDING_WITHDRAWAL_KEY = 'pendingWalletWithdrawal'

// 백엔드 WalletResponse의 잔액 필드는 자바 필드명이 totalBalance지만
// @JsonProperty("walletBalance")가 붙어 있어 JSON 키는 walletBalance로 내려온다.
// 화면은 계속 totalBalance를 쓰므로 여기서 한 번만 맞춰준다.
function normalizeWallet(result) {
  if (!result) return null
  return { ...result, totalBalance: Number(result.walletBalance ?? result.totalBalance ?? 0) }
}

function readPendingWithdrawal() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_WITHDRAWAL_KEY))
  } catch {
    sessionStorage.removeItem(PENDING_WITHDRAWAL_KEY)
    return null
  }
}

function createIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `withdraw-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

function withdrawalFingerprint({ accountId, amount, memo }) {
  const normalizedMemo = memo?.trim() || '내 계좌로 출금'
  return JSON.stringify([String(accountId), Number(amount), normalizedMemo])
}

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    wallet: null,
    pendingWithdrawal: readPendingWithdrawal(),
  }),

  actions: {
    async fetchWallet() {
      try {
        // 백엔드 응답은 { status, message, result: WalletResponse } 래퍼라 data.result가 실제 지갑 정보
        const { data } = await walletApi.getWallet()
        this.wallet = normalizeWallet(data.result)
        return this.wallet
      } catch (error) {
        // 이전 화면에서 조회한 잔액을 최신 값처럼 노출하지 않는다.
        this.wallet = null
        throw error
      }
    },

    async charge(amount) {
      const { data } = await walletApi.charge(amount)
      this.wallet = normalizeWallet(data.result ?? data)
      return this.wallet
    },

    async verifySimplePassword(password) {
      const { data } = await walletApi.verifySimplePassword(password)
      return data.result?.verified === true
    },

    async withdraw({ accountId, amount, memo, password }) {
      const fingerprint = withdrawalFingerprint({ accountId, amount, memo })
      if (this.pendingWithdrawal?.fingerprint !== fingerprint) {
        this.pendingWithdrawal = {
          fingerprint,
          idempotencyKey: createIdempotencyKey(),
        }
        sessionStorage.setItem(
          PENDING_WITHDRAWAL_KEY,
          JSON.stringify(this.pendingWithdrawal),
        )
      }

      const { data } = await walletApi.withdraw({
        accountId,
        amount,
        memo,
        password,
        idempotencyKey: this.pendingWithdrawal.idempotencyKey,
      })
      const result = data.result ?? data

      this.wallet = {
        ...(this.wallet ?? {}),
        totalBalance: Number(result.walletBalance),
        walletBalance: Number(result.walletBalance),
      }
      this.pendingWithdrawal = null
      sessionStorage.removeItem(PENDING_WITHDRAWAL_KEY)
      return result
    },
  },
})
