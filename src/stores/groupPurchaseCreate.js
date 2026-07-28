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
