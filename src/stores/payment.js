import { defineStore } from 'pinia'
import { recurringApi } from '@/api/recurring'
import { MOCK_RECURRING_PAYMENTS } from '@/utils/mockData'

// API 명세(recurringId/itemName/cycleDay/price/nextPaymentDate)를
// 화면이 쓰는 내부 필드명(id/merchantName/dayOfMonth/amount/nextPaymentLabel)으로 변환한다.
function nextPaymentDateToLabel(isoDate) {
  if (!isoDate) return ''
  const [, month, day] = isoDate.split('-').map(Number)
  return `다음 ${month}/${day}`
}

function fromApiShape(item) {
  return {
    id: item.recurringId,
    merchantName: item.itemName,
    amount: item.price,
    dayOfMonth: item.cycleDay,
    nextPaymentLabel: nextPaymentDateToLabel(item.nextPaymentDate),
    category: item.category,
  }
}

function toApiPayload({ merchantName, amount, dayOfMonth, category, petId }) {
  return {
    itemName: merchantName,
    price: amount,
    cycleDay: dayOfMonth,
    category,
    petId,
  }
}

export const usePaymentStore = defineStore('payment', {
  state: () => ({
    recurringPayments: [],
    // recurringPayments.length로 재조회 여부를 판단하면, 마지막 항목을 해지해서
    // 배열이 비었을 때 다시 mock 데이터로 채워지는 문제가 있어 별도 플래그로 관리한다.
    hasFetchedRecurringPayments: false,
  }),

  getters: {
    findRecurringPayment: (state) => (id) =>
      state.recurringPayments.find((payment) => payment.id === Number(id)) ?? null,
  },

  actions: {
    async fetchRecurringPayments() {
      if (this.hasFetchedRecurringPayments) return
      try {
        const { data } = await recurringApi.getRecurrings()
        const result = data.result ?? data ?? []
        this.recurringPayments = result.map(fromApiShape)
      } catch {
        // 정기결제 API 연동 전이라 조회가 실패할 수 있어요. 목록은 최소한 보이도록 폴백
      }
      if (!this.recurringPayments.length) {
        this.recurringPayments = structuredClone(MOCK_RECURRING_PAYMENTS)
      }
      this.hasFetchedRecurringPayments = true
    },

    async cancelRecurringPayment(id) {
      try {
        await recurringApi.deleteRecurring(id)
      } catch {
        // 정기결제 API 연동 전이라 실패할 수 있어요. 로컬 상태에서는 그대로 제거
      }
      this.recurringPayments = this.recurringPayments.filter(
        (payment) => payment.id !== Number(id),
      )
    },

    async createRecurringPayment(payload) {
      try {
        const { data } = await recurringApi.createRecurring(toApiPayload(payload))
        const created = fromApiShape(data.result ?? data)
        this.recurringPayments.push(created)
        return created
      } catch {
        // 정기결제 API 연동 전이라 실패할 수 있어요. 로컬 상태에만 우선 추가
        const created = { id: Date.now(), ...payload }
        this.recurringPayments.push(created)
        return created
      }
    },
  },
})
