import api from './index'

export const insuranceApi = {
  // request: { petId, medicalHistoryCodes: string[], annualMedicalCostKrw?: number }
  //   petId만 보내면 서버가 petId로 pet을 조회한다. species/breed/age는 보내지 않는다
  //   (서버가 쓰지 않아 Jackson이 조용히 버림). annualMedicalCostKrw는 사용자가
  //   예상 연 의료비 슬라이더를 조정했을 때만 채워 보낸다.
  // response.data: ApiResponse<SimulationResponse>
  //   result: {
  //     assumptions: { annualExpectedVetCostKrw, assumptionSource, isUserAdjusted },
  //     preExistingConditionWarning,
  //     insuranceAdvice: { verdict: 'FAVORABLE'|'NEUTRAL'|'UNFAVORABLE', message },
  //     recommendedProducts: [{
  //       productId, companyName, productName, monthlyPremiumKrw,
  //       reimbursementStructure, reimbursementRatePct, reimbursementConfidence,
  //       reimbursementRateNote, reimbursementSourceUrl,
  //       deductibleKrw, deductibleBasis, deductibleApplied, annualLimitKrw,
  //       regulatoryCapWarning, breakEvenAvailable,
  //       breakEvenScenarios: [{ years, cumulativePremiumKrw, expectedReimbursementKrw, isFavorable, differenceKrw }]
  //     }]
  //   }
  simulate(data) {
    return api.post('/insurance/simulations', data)
  },

  // params: { petType: 'DOG'|'CAT', age?: number, sort?: string }
  // response.data: ApiResponse<ProductResponse[]>
  getProducts(params) {
    return api.get('/insurance/products', { params })
  },

  // petId: string (query param), receiptFile: File (multipart)
  // response.data: ApiResponse<ClaimResponse>
  submitClaim(petId, receiptFile) {
    const form = new FormData()
    form.append('receipt', receiptFile)
    return api.post('/insurance/claims', form, { params: { petId } })
  },

  getClaims(params) {
    return api.get('/insurance/claims', { params })
  },

  getClaim(id) {
    return api.get(`/insurance/claims/${id}`)
  },

  confirmClaim(id, correctedData) {
    return api.post(`/insurance/claims/${id}/confirm`, correctedData)
  },
}
