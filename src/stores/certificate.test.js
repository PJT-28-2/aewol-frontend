import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/certificates', () => ({
  certificatesApi: {
    getList: vi.fn(),
    getDetail: vi.fn(),
    uploadVaccination: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    verifyRegistration: vi.fn(),
  },
}))

vi.mock('@/api/pet', () => ({
  petApi: {
    getPets: vi.fn(),
  },
}))

import { certificatesApi } from '@/api/certificates'
import { petApi } from '@/api/pet'
import { useCertificateStore } from './certificate'

describe('useCertificateStore - 문서 목록 및 상세 조회', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchPets()는 펫 목록을 가져오고 첫 번째 펫을 selectedPetId로 동기화한다', async () => {
    petApi.getPets.mockResolvedValue({
      data: {
        result: [
          { petId: 'pet-1', name: '소로', species: 'DOG' },
          { petId: 'pet-2', name: '나비', species: 'CAT' },
        ],
      },
    })

    const store = useCertificateStore()
    await store.fetchPets()

    expect(store.pets).toHaveLength(2)
    expect(store.selectedPetId).toBe('pet-1')
    expect(store.selectedPet?.name).toBe('소로')
  })

  it('fetchPets() 결과가 비어있으면 selectedPetId는 null이 되고 문서를 초기화한다', async () => {
    petApi.getPets.mockResolvedValue({
      data: { result: [] },
    })

    const store = useCertificateStore()
    store.selectedPetId = 'pet-old'
    store.registrationDoc = { docId: 'doc-1' }

    await store.fetchPets()

    expect(store.pets).toHaveLength(0)
    expect(store.selectedPetId).toBeNull()
    expect(store.registrationDoc).toBeNull()
  })

  it('fetchCertificates()는 문서 목록을 조회하고 REGISTRATION, VACCINATION, MEDICAL_CONFIRMATION으로 분류한다', async () => {
    const mockDocs = [
      { docId: 'doc-1', petId: 'pet-1', docType: 'REGISTRATION', docName: '동물등록증' },
      { docId: 'doc-2', petId: 'pet-1', docType: 'VACCINATION', docName: '종합백신' },
      { docId: 'doc-3', petId: 'pet-1', docType: 'MEDICAL_CONFIRMATION', docName: '진료확인서' },
    ]
    certificatesApi.getList.mockResolvedValue({
      data: { result: mockDocs },
    })

    const store = useCertificateStore()
    store.selectedPetId = 'pet-1'

    await store.fetchCertificates('pet-1')

    expect(certificatesApi.getList).toHaveBeenCalledWith('pet-1')
    expect(store.documents).toEqual(mockDocs)
    expect(store.registrationDoc?.docId).toBe('doc-1')
    expect(store.vaccinationDocs).toHaveLength(1)
    expect(store.vaccinationDocs[0].docId).toBe('doc-2')
    expect(store.medicalDocs).toHaveLength(1)
    expect(store.medicalDocs[0].docId).toBe('doc-3')
  })

  it('fetchCertificates() 응답 도착 전 사용자가 다른 펫으로 전환한 경우 응답을 무시한다 (Race condition 방어)', async () => {
    certificatesApi.getList.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return {
        data: {
          result: [{ docId: 'doc-slow', petId: 'pet-1', docType: 'REGISTRATION' }],
        },
      }
    })

    const store = useCertificateStore()
    store.selectedPetId = 'pet-1'

    const fetchPromise = store.fetchCertificates('pet-1')

    // 사용자가 펫 2로 전환
    store.selectedPetId = 'pet-2'

    await fetchPromise

    // pet-1 응답은 버려져야 함
    expect(store.registrationDoc).toBeNull()
    expect(store.documents).toHaveLength(0)
  })

  it('uploadVaccination() 업로드 처리 도중 사용자가 다른 펫 탭으로 전환하면 fetchCertificates 가드에 걸려 목록 갱신이 조용히 무시된다 — 이 액션은 항상 "현재 선택된 펫 탭"에서 호출된다는 전제에 의존하므로, 그 전제가 깨지는 경우를 문서화해둔다', async () => {
    certificatesApi.uploadVaccination.mockResolvedValue({
      data: { result: { docId: 'doc-vac-1', petId: 'pet-1', docType: 'VACCINATION', docName: '광견병' } },
    })
    certificatesApi.getList.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return {
        data: {
          result: [{ docId: 'doc-vac-1', petId: 'pet-1', docType: 'VACCINATION', docName: '광견병' }],
        },
      }
    })

    const store = useCertificateStore()
    store.selectedPetId = 'pet-1'

    const uploadPromise = store.uploadVaccination('pet-1', new File([], 'vaccine.png'))

    // 업로드 완료 전 사용자가 펫 2 탭으로 전환
    store.selectedPetId = 'pet-2'

    await uploadPromise

    // pet-1 업로드는 서버에는 성공했지만, 재조회 응답이 도착했을 때 selectedPetId가 이미
    // pet-2라 가드에 걸려 store에는 반영되지 않는다
    expect(store.vaccinationDocs).toHaveLength(0)

    // 하지만 영구 유실은 아니다 — 사용자가 pet-1 탭으로 다시 돌아오면 selectPet()이
    // fetchCertificates를 새로 호출하고, 이번엔 selectedPetId가 다시 일치하므로
    // 서버에 이미 저장돼있던 업로드 결과가 정상적으로 반영된다
    await store.selectPet('pet-1')
    expect(store.vaccinationDocs).toHaveLength(1)
    expect(store.vaccinationDocs[0].docId).toBe('doc-vac-1')
  })

  it('fetchCertificateDetail()은 상세 정보를 조회하고 8자리 birthDate(20230512)를 YYYY-MM-DD 포맷으로 정규화한다', async () => {
    certificatesApi.getDetail.mockResolvedValue({
      data: {
        result: {
          docId: 'doc-reg-1',
          petId: 'pet-1',
          name: '소로',
          regNumber: '410000012345678',
          birthDate: '20230512',
          rfidCd: '410000012345678',
          rfidGubun: 'Y',
        },
      },
    })

    const store = useCertificateStore()
    const detail = await store.fetchCertificateDetail('pet-1', 'doc-reg-1')

    expect(certificatesApi.getDetail).toHaveBeenCalledWith('pet-1', 'doc-reg-1')
    expect(detail.birthDate).toBe('2023-05-12')
    expect(store.detail?.birthDate).toBe('2023-05-12')
  })

  it('selectPet()은 선택된 펫 ID를 바꾸고 해당 펫의 증명서 목록을 요청한다', async () => {
    certificatesApi.getList.mockResolvedValue({
      data: { result: [] },
    })

    const store = useCertificateStore()
    await store.selectPet('pet-2')

    expect(store.selectedPetId).toBe('pet-2')
    expect(certificatesApi.getList).toHaveBeenCalledWith('pet-2')
  })

  it('selectedPetId를 먼저 맞추지 않고 fetchCertificates()만 호출하면 응답이 버려진다 — 목록 화면을 거치지 않고 상세 화면에 직접 진입(새로고침 등)하는 화면은 fetchCertificates 대신 selectPet()을 써야 한다', async () => {
    certificatesApi.getList.mockResolvedValue({
      data: { result: [{ docId: 'doc-1', petId: 'pet-1', docType: 'REGISTRATION' }] },
    })

    const store = useCertificateStore()
    // 목록 화면을 거치지 않은 최초 진입 상태를 흉내 — selectedPetId가 아직 petId와 동기화되지 않음
    expect(store.selectedPetId).toBeNull()

    await store.fetchCertificates('pet-1')
    expect(store.documents).toHaveLength(0)

    // selectPet()은 selectedPetId 설정 + fetchCertificates 호출을 함께 처리하므로 정상 반영된다
    await store.selectPet('pet-1')
    expect(store.selectedPetId).toBe('pet-1')
    expect(store.documents).toHaveLength(1)
  })

  it('deleteDocument() 호출 후 증명서 목록을 다시 조회한다', async () => {
    certificatesApi.deleteDocument.mockResolvedValue({ data: { success: true } })
    certificatesApi.getList.mockResolvedValue({ data: { result: [] } })

    const store = useCertificateStore()
    store.selectedPetId = 'pet-1'
    await store.deleteDocument('pet-1', 'doc-2')

    expect(certificatesApi.deleteDocument).toHaveBeenCalledWith('pet-1', 'doc-2')
    expect(certificatesApi.getList).toHaveBeenCalledWith('pet-1')
  })
})
