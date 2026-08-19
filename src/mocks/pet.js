// 반려동물 기본 목록 (선택 UI 등에서 사용)
export const mockPets = [
  {
    id: 1,
    name: '포리',
    species: 'DOG',
    breed: '포메라니안',
    birthDate: '2023-05-12',
    neutered: true,
  },
  {
    id: 2,
    name: '나비',
    species: 'CAT',
    breed: '코리안숏헤어',
    birthDate: '2024-03-20',
    neutered: true,
  },
]

// 반려동물 상세 정보 (PetEditView 등에서 사용)
// TODO: 백엔드 API 연동 후 제거하고 실제 fetch로 교체
export const mockPetsById = {
  1: {
    id: 1,
    name: '포리',
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
