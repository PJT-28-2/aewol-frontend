import { defineStore } from 'pinia'
import { getDeadlineTimestamp } from '@/utils/date'

// 상품등록 1~3단계가 공유하는 임시 작성 데이터 (등록 완료/이탈 시 reset)
export const useGroupPurchaseCreateStore = defineStore('groupPurchaseCreate', {
  state: () => ({
    image: null,
    productName: '',
    category: '',
    unitPrice: '',
    groupPrice: '',
    targetQuantity: '2',
    deadline: '',
    deliveryMethod: '택배 배송',
    deliveryFee: '',
    // DB의 delivery_date(실제 날짜)는 deadline + deliveryEstimateDays로 백엔드에서 계산한다고 가정. 프론트는 일수만 보관
    deliveryEstimateDays: '3',
    description: '',
  }),

  getters: {
    // 1단계(상품 정보) 필수 입력이 모두 채워졌는지 - step2/step3 라우터 가드에서 사용
    isStep1Complete: (state) => {
      const parsePrice = (value) => Number(String(value).replace(/[^0-9]/g, '')) || 0
      const original = parsePrice(state.unitPrice)
      const group = parsePrice(state.groupPrice)
      return (
        state.image !== null &&
        state.productName.trim() !== '' &&
        state.category.trim() !== '' &&
        original > 0 &&
        group > 0 &&
        group <= original
      )
    },
  },

  actions: {
    // 2단계(구매 조건) 필수 입력이 모두 채워졌는지 - step3 라우터 가드와 제출 직전 재검사에서 사용.
    // deadline이 비어있지 않은지만 보면 달력에서 고른 날짜가 지난 뒤(작성 중 방치, 재진입 등)에도
    // 완료로 판정돼 D-0/D--1 표시와 제출을 허용하게 되므로, 아직 마감 전인지도 함께 확인한다.
    // getters(Vue computed)로 두면 Date.now()가 반응형 의존성이 아니라서, 마감 전에 한 번
    // true로 계산된 뒤 다른 상태 변화 없이 시간만 지나도 캐시된 true가 그대로 남는다 —
    // 그래서 매 호출마다 새로 평가되는 action(일반 함수)으로 둔다
    isStep2Complete() {
      return (
        Number(this.targetQuantity) >= 1 &&
        this.deadline !== '' &&
        Date.now() < getDeadlineTimestamp(this.deadline) &&
        this.deliveryFee !== '' &&
        Number(this.deliveryEstimateDays) >= 1
      )
    },
    reset() {
      this.image = null
      this.productName = ''
      this.category = ''
      this.unitPrice = ''
      this.groupPrice = ''
      this.targetQuantity = '2'
      this.deadline = ''
      this.deliveryMethod = '택배 배송'
      this.deliveryFee = ''
      this.deliveryEstimateDays = '3'
      this.description = ''
    },
  },
})
