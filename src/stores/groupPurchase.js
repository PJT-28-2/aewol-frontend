import { defineStore } from 'pinia'

// 상품등록 1~3단계가 공유하는 임시 작성 데이터 (등록 완료/이탈 시 reset)
export const useGroupPurchaseCreateStore = defineStore('groupPurchaseCreate', {
  state: () => ({
    photos: [],
    productName: '',
    category: '',
    originalPrice: '',
    groupPrice: '',
    targetQuantity: '2',
    deadline: '',
    deliveryMethod: '택배 배송',
    deliveryFee: '',
    deliveryEstimateDays: '3',
    description: '',
  }),

  getters: {
    // 1단계(상품 정보) 필수 입력이 모두 채워졌는지 - step2/step3 라우터 가드에서 사용
    isStep1Complete: (state) => {
      const parsePrice = (value) => Number(String(value).replace(/[^0-9]/g, '')) || 0
      const original = parsePrice(state.originalPrice)
      const group = parsePrice(state.groupPrice)
      return (
        state.photos.length > 0 &&
        state.productName.trim() !== '' &&
        state.category.trim() !== '' &&
        original > 0 &&
        group > 0 &&
        group <= original
      )
    },
    // 2단계(구매 조건) 필수 입력이 모두 채워졌는지 - step3 라우터 가드에서 사용
    isStep2Complete: (state) =>
      Number(state.targetQuantity) >= 1 &&
      state.deadline !== '' &&
      state.deliveryFee !== '' &&
      Number(state.deliveryEstimateDays) >= 1,
  },

  actions: {
    reset() {
      this.photos = []
      this.productName = ''
      this.category = ''
      this.originalPrice = ''
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
