import { defineStore } from 'pinia'
import { recurringApi } from '@/api/recurring'

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
    // 배열이 비었을 때 조회를 반복하는 문제가 있어 별도 플래그로 관리한다.
    hasFetchedRecurringPayments: false,
  }),

  getters: {
    findRecurringPayment: (state) => (id) =>
      state.recurringPayments.find((payment) => String(payment.id) === String(id)) ?? null,
  },

  actions: {
    async fetchRecurringPayments() {
      if (this.hasFetchedRecurringPayments) return
      // 실패 시 flag를 세우지 않아 다음 진입에서 재시도한다.
      // 조회에 실패하면 목록은 비운 채로 두어 EmptyState가 노출되게 한다(가짜 데이터 금지).
      const { data } = await recurringApi.getRecurrings()
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
      const { data } = await recurringApi.createRecurring(toApiPayload(payload))
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
  },
})
