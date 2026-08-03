// 증명서(동물등록증) 도메인 전용 mock 데이터.
// usePetStore.pets(id 기준, src/mocks/pet.js)와는 별개로 관리한다 — 이 도메인만
// petId(문자열, 'pet-1' 등)와 등록증 관련 상세 필드(gender, weight, regNumber 등)가 필요하다.

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
//
// 펫 탭 목록(certificateStore.pets)도 이제 이 데이터에서 뽑아 쓴다. 소로(pet-1)는 실제 등록증
// 문서(docId)가 있어 docId를 key로 쓰지만, 나비(pet-2)는 아직 동물등록증이 연동되지 않아
// 실제 문서가 없다 — 그래도 펫 탭에는 계속 노출돼야 해서 petId를 key로 한 자리표시자를 둔다
// (등록증 관련 필드는 전부 빈 값, docId는 null).
export const MOCK_REGISTRATION_DETAIL = {
  'doc-reg-pet-1': {
    docId: 'doc-reg-pet-1',
    petId: 'pet-1',
    memberId: 'member-1',
    species: 'DOG',
    weight: 3.2,
    medicalHistory: 'N',
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
  'pet-2': {
    docId: null,
    petId: 'pet-2',
    memberId: 'member-1',
    species: 'CAT',
    weight: 3.8,
    medicalHistory: 'N',
    regNumber: '', // 아직 동물등록증이 연동되지 않은 케이스(빈 상태 확인용)
    name: '나비',
    breed: '코리안숏헤어',
    gender: 'FEMALE',
    neutered: 'Y',
    birthDate: '2022-11-03',
    rfidCd: '',
    rfidGubun: '',
    orgNm: '',
    officeTel: '',
    aprGbnNm: '',
    regTm: '',
    aprTm: '',
    lastSyncedAt: '',
  },
}
