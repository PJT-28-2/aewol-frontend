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

      // pendingTossCharge는 결제 화면 복원용 상태일 뿐 승인 여부의 신뢰 원천이 아니다.
      // 재시도나 저장소 유실로 값이 없거나 다른 주문으로 바뀌어도, 백엔드가 주문 소유권과
      // 금액을 검증하므로 Toss 콜백은 항상 서버 승인 API로 전달한다.
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
      const normalizedOrderId = String(orderId)
      const matchingPending = this.pendingTossCharge?.orderId === normalizedOrderId
        ? this.pendingTossCharge
        : null
      const completedCharge = {
        orderId: normalizedOrderId,
        amount: Number(amount),
        walletBalance: Number(this.wallet?.totalBalance ?? 0),
        returnTo: matchingPending?.returnTo ?? 'wallet',
      }
      this.completedTossCharge = completedCharge
      sessionStorage.setItem(COMPLETED_TOSS_CHARGE_KEY, JSON.stringify(completedCharge))
      // 다른 주문이 진행 중이면 그 주문의 복원 상태를 지우지 않는다.
      if (matchingPending) {
        this.pendingTossCharge = null
        sessionStorage.removeItem(PENDING_TOSS_CHARGE_KEY)
      }
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
