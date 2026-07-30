// TODO(backend): 보험 시뮬레이터용 반려동물 프로필 조회 GET API가 아직 없어 목업으로 대체.
// usePetStore는 이 화면에서 쓰지 않음 — 전용 API가 나오면 아래 목업을 그 호출로 교체.
export const mockSimulatorPets = [
  { id: 1, name: '포메', species: 'DOG', breed: '포메라니안', age: 3 },
]

// TODO(backend): recommendedProducts의 badge/joinAgeRange/coverages/productUrl은
// 요약 응답 스키마 확정 시 백엔드와 재확인 필요 (지금은 화면 검증용 목업 값)
export const mockSimulateResult = {
  expectedAnnualMedicalCost: 820000,
  annualPremium: 312000,
  breakEvenNote: '손익분기 지점: 자기부담금 포함 약 45만원 초과 시부터 이득',
  insuranceAdvice: {
    verdict: 'FAVORABLE',
    message: '가입하는 것이 유리해요',
  },
  recommendedProducts: [
    {
      productId: 1,
      companyName: '현대해상',
      productName:
        '(무)현대해상다이렉트꼼꼼우리펫보험(재가입용)(HI2605) 2종<반려묘>_표준플랜',
      premium: 28650,
      badge: '온라인가입',
      joinAgeRange: '1~19세',
      coverages: [
        '반려묘입원의료비 15백만원',
        '반려묘의료비확장보장(MRI/CT) 100만원',
      ],
      productUrl: 'https://example.com/products/1',
    },
    {
      productId: 2,
      companyName: '농협손보',
      productName: '(무)NH다이렉트펫앤미든든보험[2종<고양이>](2604)',
      premium: 29336,
      badge: '모바일가입',
      joinAgeRange: '2~20세',
      coverages: ['반려묘입원의료비 10백만원'],
      productUrl: 'https://example.com/products/2',
    },
  ],
}

// OCR 추출 결과 (실제 연동 전 임시 데이터)
export const mockOcrItems = [
  { key: 'date', label: '진료일', value: '2026.07.10', unit: '' },
  { key: 'hospital', label: '병원명', value: '24시 제주동물의료센터', unit: '' },
  { key: 'treatment', label: '진료 항목', value: '슬개골 탈구 치료', unit: '' },
  { key: 'fee', label: '진료비', value: '168,000원', unit: '원' },
]
