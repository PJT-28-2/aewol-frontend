import api from './index'

export const insuranceApi = {
  // request: { petId, species, breed, age, medicalHistoryCodes: string[] }
  // response.data: ApiResponse<SimulationResponse>
  //   result: {
  //     assumptions: { annualClaimCount, annualExpectedVetCostKrw, assumptionSource },
  //     preExistingConditionWarning,
  //     insuranceAdvice: { verdict: 'FAVORABLE'|'NEUTRAL'|'UNFAVORABLE', message },
  //     recommendedProducts: [{
  //       productId, companyName, productName, monthlyPremiumKrw,
  //       reimbursementStructure, reimbursementRatePct, reimbursementConfidence,
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
