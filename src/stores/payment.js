import { defineStore } from 'pinia'
import { recurringApi } from '@/api/recurring'
import { beginSessionTask, isCurrentSession } from '@/utils/sessionEpoch'

const PENDING_CREATE_KEY = 'pendingRecurringCreate'

// API 명세(recurringId/itemName/cycleDay/price/nextPaymentDate)를
// 화면이 쓰는 내부 필드명(id/merchantName/dayOfMonth/amount/nextPaymentLabel)으로 변환한다.
function nextPaymentDateToLabel(isoDate) {
  if (!isoDate) return ''
  const [, month, day] = isoDate.split('-').map(Number)
  return `다음 ${month}/${day}`
}

function fromApiShape(item) {
  return {
    // 백엔드 recurringId는 문자열이므로 화면/라우트 파라미터와 비교가 어긋나지 않도록 문자열로 통일한다.
    id: String(item.recurringId),
    merchantName: item.itemName,
    amount: item.price,
    dayOfMonth: item.cycleDay,
    nextPaymentLabel: nextPaymentDateToLabel(item.nextPaymentDate),
    // 상세 화면에서 "다음 결제일"을 날짜로 표기하기 위해 원본 값도 보관한다.
    nextPaymentDate: item.nextPaymentDate ?? null,
    category: item.category,
    // 반려동물을 지정해 등록한 정기결제는 목록에서 어떤 아이 것인지 이름을 보여준다.
    petId: item.petId != null ? String(item.petId) : null,
  }
}

function toApiPayload({ merchantName, amount, dayOfMonth, category, petId, idempotencyKey }) {
  const payload = {
    itemName: merchantName,
    price: amount,
    cycleDay: dayOfMonth,
    category,
    petId,
  }
  if (idempotencyKey) payload.idempotencyKey = idempotencyKey
  return payload
}

function readPendingCreate() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PENDING_CREATE_KEY))
    if (
      parsed
      && typeof parsed.key === 'string'
      && parsed.key
      && typeof parsed.signature === 'string'
    ) {
      return parsed
    }
  } catch {
    // 깨진 값은 버리고 새로 만든다.
  }
  sessionStorage.removeItem(PENDING_CREATE_KEY)
  return { key: null, signature: '' }
}

function writePendingCreate(key, signature) {
  sessionStorage.setItem(PENDING_CREATE_KEY, JSON.stringify({ key, signature }))
}

function clearPendingCreateStorage() {
  sessionStorage.removeItem(PENDING_CREATE_KEY)
}

export const usePaymentStore = defineStore('payment', {
  state: () => {
    const pending = readPendingCreate()
    return {
      recurringPayments: [],
      // recurringPayments.length로 재조회 여부를 판단하면, 마지막 항목을 해지해서
      // 배열이 비었을 때 조회를 반복하는 문제가 있어 별도 플래그로 관리한다.
      hasFetchedRecurringPayments: false,
      // 응답만 유실된 재시도에서 서버가 첫 회차를 두 번 받지 않도록
      // 같은 등록 내용에 묶인 멱등키를 성공 전까지 보관한다.
      // 새로고침 뒤에도 같은 키를 쓰기 위해 sessionStorage에도 둔다.
      pendingCreateKey: pending.key,
      pendingCreateSignature: pending.signature,
    }
  },

  getters: {
    findRecurringPayment: (state) => (id) =>
      state.recurringPayments.find((payment) => String(payment.id) === String(id)) ?? null,
  },

  actions: {
    async fetchRecurringPayments() {
      if (this.hasFetchedRecurringPayments) return
      const epoch = beginSessionTask()
      // 실패 시 flag를 세우지 않아 다음 진입에서 재시도한다.
      // 조회에 실패하면 목록은 비운 채로 두어 EmptyState가 노출되게 한다(가짜 데이터 금지).
      const { data } = await recurringApi.getRecurrings()
      if (!isCurrentSession(epoch)) return
      this.recurringPayments = (data.result ?? []).map(fromApiShape)
      this.hasFetchedRecurringPayments = true
    },

    async cancelRecurringPayment(id) {
      await recurringApi.deleteRecurring(id)
      this.recurringPayments = this.recurringPayments.filter(
        (payment) => String(payment.id) !== String(id),
      )
    },

    async createRecurringPayment(payload) {
      const idempotencyKey = this.resolveCreateKey(payload)
      const { data } = await recurringApi.createRecurring(
        toApiPayload({ ...payload, idempotencyKey }),
      )
      this.clearCreateKey()
      const created = fromApiShape(data.result)
      this.recurringPayments.push(created)
      return created
    },

    async updateRecurringPayment(id, payload) {
      const { data } = await recurringApi.updateRecurring(id, toApiPayload(payload))
      const updated = fromApiShape(data.result)
      const index = this.recurringPayments.findIndex(
        (payment) => String(payment.id) === String(id),
      )
      if (index !== -1) this.recurringPayments[index] = updated
      else this.recurringPayments.push(updated)
      return updated
    },

    /**
     * 같은 반려동물·상품·금액·결제일·카테고리로 다시 시도하면 이전 키를 그대로 쓴다.
     * 내용이 바뀌면 다른 등록이므로 새 키를 만든다.
     */
    resolveCreateKey(payload) {
      const signature = [
        payload.petId ?? '',
        payload.merchantName ?? '',
        payload.amount ?? '',
        payload.dayOfMonth ?? '',
        payload.category ?? '',
      ].join(':')
      if (this.pendingCreateKey && this.pendingCreateSignature === signature) {
        writePendingCreate(this.pendingCreateKey, signature)
        return this.pendingCreateKey
      }
      this.pendingCreateSignature = signature
      this.pendingCreateKey = globalThis.crypto?.randomUUID?.()
        ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      writePendingCreate(this.pendingCreateKey, this.pendingCreateSignature)
      return this.pendingCreateKey
    },

    clearCreateKey() {
      this.pendingCreateKey = null
      this.pendingCreateSignature = ''
      clearPendingCreateStorage()
    },
  },
})
