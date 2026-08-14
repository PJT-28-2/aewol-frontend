import { defineStore } from 'pinia'
import { walletApi } from '@/api/wallet'

const PENDING_WITHDRAWAL_KEY = 'pendingWalletWithdrawal'
const PENDING_TOSS_CHARGE_KEY = 'pendingTossCharge'
const COMPLETED_TOSS_CHARGE_KEY = 'completedTossCharge'

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

function readSessionItem(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key))
  } catch {
    sessionStorage.removeItem(key)
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
    pendingTossCharge: readSessionItem(PENDING_TOSS_CHARGE_KEY),
    completedTossCharge: readSessionItem(COMPLETED_TOSS_CHARGE_KEY),
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

    async prepareTossCharge({ amount, returnTo = 'wallet' }) {
      this.clearCompletedTossCharge()
      const { data } = await walletApi.prepareTossCharge(amount)
      const result = data.result ?? data
      const pendingCharge = {
        orderId: String(result.orderId),
        amount: Number(result.amount),
        returnTo,
      }
      this.pendingTossCharge = pendingCharge
      sessionStorage.setItem(PENDING_TOSS_CHARGE_KEY, JSON.stringify(pendingCharge))
      return pendingCharge
    },

    async confirmTossCharge({ paymentKey, orderId, amount }) {
      const normalizedOrderId = String(orderId)
      const normalizedAmount = Number(amount)
      if (
        !this.pendingTossCharge
        || this.pendingTossCharge.orderId !== normalizedOrderId
        || this.pendingTossCharge.amount !== normalizedAmount
      ) {
        throw new Error('충전 주문 정보가 일치하지 않습니다.')
      }

      const { data } = await walletApi.confirmTossCharge({
        paymentKey,
        orderId: normalizedOrderId,
        amount: normalizedAmount,
      })
      const wallet = normalizeWallet(data.result ?? data)
      this.wallet = wallet
      this.finishTossCharge({ orderId: normalizedOrderId, amount: normalizedAmount })
      return wallet
    },

    finishTossCharge({ orderId, amount }) {
      const completedCharge = {
        orderId: String(orderId),
        amount: Number(amount),
        walletBalance: Number(this.wallet?.totalBalance ?? 0),
        returnTo: this.pendingTossCharge?.returnTo ?? 'wallet',
      }
      this.completedTossCharge = completedCharge
      this.pendingTossCharge = null
      sessionStorage.setItem(COMPLETED_TOSS_CHARGE_KEY, JSON.stringify(completedCharge))
      sessionStorage.removeItem(PENDING_TOSS_CHARGE_KEY)
      return completedCharge
    },

    clearPendingTossCharge(orderId) {
      if (orderId && this.pendingTossCharge?.orderId !== String(orderId)) return
      this.pendingTossCharge = null
      sessionStorage.removeItem(PENDING_TOSS_CHARGE_KEY)
    },

    clearCompletedTossCharge() {
      this.completedTossCharge = null
      sessionStorage.removeItem(COMPLETED_TOSS_CHARGE_KEY)
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
