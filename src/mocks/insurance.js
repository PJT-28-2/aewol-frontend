// TODO(backend): 보험 시뮬레이터용 반려동물 프로필 조회 GET API가 아직 없어 목업으로 대체.
// usePetStore는 이 화면에서 쓰지 않음 — 전용 API가 나오면 아래 목업을 그 호출로 교체.
export const mockSimulatorPets = [
  { id: 1, name: '포메', species: 'DOG', breed: '포메라니안', age: 3 },
]

// OCR 추출 결과 (실제 연동 전 임시 데이터)
export const mockOcrItems = [
  { key: 'date', label: '진료일', value: '2026.07.10', unit: '' },
  { key: 'hospital', label: '병원명', value: '24시 제주동물의료센터', unit: '' },
  { key: 'treatment', label: '진료 항목', value: '슬개골 탈구 치료', unit: '' },
  { key: 'fee', label: '진료비', value: '168,000원', unit: '원' },
]
