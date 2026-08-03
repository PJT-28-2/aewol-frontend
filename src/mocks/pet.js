// 반려동물 기본 목록 (선택 UI 등에서 사용)
export const mockPets = [
  { id: 1, name: '소로', species: 'DOG' },
  { id: 2, name: '나비', species: 'CAT' },
]

// 반려동물 상세 정보 (PetEditView 등에서 사용)
// TODO: 백엔드 API 연동 후 제거하고 실제 fetch로 교체
export const mockPetsById = {
  1: {
    id: 1,
    name: '소로',
    species: 'DOG',
    regNumber: '410000012345678',
    breed: '포메라니안',
    birthDate: '2023.05.12',
    neutered: true,
    medicalHistory: '슬개골 탈구 이력 있음',
    vaccinationFileName: '접종증명서.jpg',
  },
  2: {
    id: 2,
    name: '나비',
    species: 'CAT',
    regNumber: '',
    breed: '코리안숏헤어',
    birthDate: '2024.03.20',
    neutered: true,
    medicalHistory: '',
    vaccinationFileName: '',
  },
}

// 증명서 관리(목록/상세) 화면 목데이터 — ERD의 pet, pet_document 테이블 필드명을 camelCase로 매핑했어요.
export const MOCK_PETS = [
  {
    petId: 'pet-1',
    memberId: 'member-1',
    name: '소로',
    species: 'DOG',
    breed: '포메라니안',
    birthDate: '2023-05-12',
    gender: 'MALE',
    weight: 3.2,
    neutered: 'Y',
    regNumber: '410000012345678',
    medicalHistory: 'N',
    isActive: 1,
    createdAt: '2023-06-02T00:00:00',
    updatedAt: '2023-06-02T00:00:00',
  },
  {
    petId: 'pet-2',
    memberId: 'member-1',
    name: '나비',
    species: 'CAT',
    breed: '코리안숏헤어',
    birthDate: '2022-11-03',
    gender: 'FEMALE',
    weight: 3.8,
    neutered: 'Y',
    regNumber: '', // 아직 동물등록증이 연동되지 않은 케이스(빈 상태 확인용)
    medicalHistory: 'N',
    isActive: 1,
    createdAt: '2023-01-15T00:00:00',
    updatedAt: '2023-01-15T00:00:00',
  },
]

export const MOCK_PET_DOCUMENTS = [
  {
    docId: 'doc-reg-pet-1',
    petId: 'pet-1',
    docName: '소로 · 동물등록증',
    docType: 'REGISTRATION',
    fileUrl: '',
    issuedDate: '2023-06-02',
    createdAt: '2023-06-02T00:00:00',
  },
  {
    docId: 'doc-vac-1',
    petId: 'pet-1',
    docName: '종합백신(DHPPL) 접종증명서',
    docType: 'VACCINATION',
    fileUrl: '/mock/certificates/vaccination-dhppl.jpg',
    issuedDate: '2026-03-12',
    createdAt: '2026-03-12T09:00:00',
  },
  {
    docId: 'doc-vac-2',
    petId: 'pet-1',
    docName: '광견병 예방접종 증명서',
    docType: 'VACCINATION',
    fileUrl: '/mock/certificates/vaccination-rabies.jpg',
    issuedDate: '2026-01-20',
    createdAt: '2026-01-20T09:00:00',
  },
]

// GET /api/pets/{petId}/documents/{docId} 상세 응답 목데이터 (동물등록증 상세 전용, key: docId)
// 국가동물보호정보시스템(APMS) 동물등록번호 조회 결과를 담는 필드 구성이에요.
// 필드명은 ERD의 pet_registration 테이블 컬럼 기준(APMS 원본 필드명은 각 필드 주석 참고)
export const MOCK_REGISTRATION_DETAIL = {
  'doc-reg-pet-1': {
    docId: 'doc-reg-pet-1',
    petId: 'pet-1',
    regNumber: '410000012345678', // ← dogRegNo
    name: '소로', // ← dogNm
    breed: '포메라니안', // ← kindNm
    gender: 'MALE', // ← sexNm
    neutered: 'Y', // ← neuterYn
    birthDate: '2023-05-12', // ← birthDt, 포맷 미확정이라 String 유지
    rfidCd: '410000012345678', // 등록칩번호 ← rfidCd
    rfidGubun: 'Y', // 등록칩 구분: Y-내장, M-외장, N-인식표 ← rfidGubun
    orgNm: '제주특별자치도 제주시', // 관할기관 ← orgNm
    officeTel: '064-728-2114', // 관할기관 연락처 ← officeTel
    aprGbnNm: '승인완료', // 승인여부 ← aprGbnNm
    regTm: '2023-06-02T09:15:00', // 등록일시 ← regTm
    aprTm: '2023-06-02T10:40:00', // 승인일시 ← aprTm
    lastSyncedAt: '2026-07-15', // 자체 재동기화 시각
  },
}
