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

  it('uploadVaccination() 업로드 처리 도중 사용자가 다른 펫 탭으로 전환하면 _addUploadedDocument의 petId 체크에 걸려 목록에 반영되지 않는다 — 이 액션은 항상 "현재 선택된 펫 탭"에서 호출된다는 전제에 의존하므로, 그 전제가 깨지는 경우를 문서화해둔다', async () => {
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

    // POST 응답이 돌아온 시점(uploadPromise 내부)에 _addUploadedDocument가 doc.petId('pet-1')와
    // this.selectedPetId('pet-2')를 직접 비교해 반영을 건너뛴다 — 뒤이어 백그라운드로 도는
    // fetchCertificates('pet-1')의 자체 가드도 나중에 같은 이유로 한 번 더 막지만,
    // vaccinationDocs가 비어있는 결과는 이미 이 시점에 확정된다
    expect(store.vaccinationDocs).toHaveLength(0)

    // 하지만 영구 유실은 아니다 — 사용자가 pet-1 탭으로 다시 돌아오면 selectPet()이
    // fetchCertificates를 새로 호출하고, 이번엔 selectedPetId가 다시 일치하므로
    // 서버에 이미 저장돼있던 업로드 결과가 정상적으로 반영된다
    await store.selectPet('pet-1')
    expect(store.vaccinationDocs).toHaveLength(1)
    expect(store.vaccinationDocs[0].docId).toBe('doc-vac-1')
  })

  it('uploadVaccination()은 펫 탭을 유지한 정상 케이스에서 재조회(getList) 완료를 기다리지 않고 업로드 직후 바로 vaccinationDocs에 반영한다', async () => {
    certificatesApi.uploadVaccination.mockResolvedValue({
      data: { result: { docId: 'doc-vac-2', petId: 'pet-1', docType: 'VACCINATION', docName: '광견병' } },
    })
    // getList를 의도적으로 응답하지 않는 상태로 묶어둔다 — 이 promise가 아직 안 풀렸는데도
    // uploadVaccination이 끝나 있어야 "재조회를 기다리지 않는다"가 증명된다
    certificatesApi.getList.mockImplementation(() => new Promise(() => {}))

    const store = useCertificateStore()
    store.selectedPetId = 'pet-1'

    await store.uploadVaccination('pet-1', new File([], 'vaccine.png'))

    expect(store.vaccinationDocs).toHaveLength(1)
    expect(store.vaccinationDocs[0].docId).toBe('doc-vac-2')
  })

  it('uploadVaccination()은 POST가 성공했다면 뒤이은 fetchCertificates(재조회)가 실패해도 reject하지 않는다 — 재조회 실패를 업로드 실패로 취급하면 사용자가 재시도해 서버에 문서가 중복 저장될 수 있기 때문', async () => {
    certificatesApi.uploadVaccination.mockResolvedValue({
      data: { result: { docId: 'doc-vac-3', petId: 'pet-1', docType: 'VACCINATION', docName: '광견병' } },
    })
    certificatesApi.getList.mockRejectedValue(new Error('network error'))

    const store = useCertificateStore()
    store.selectedPetId = 'pet-1'

    await expect(
      store.uploadVaccination('pet-1', new File([], 'vaccine.png')),
    ).resolves.toMatchObject({ docId: 'doc-vac-3' })
    expect(store.vaccinationDocs).toHaveLength(1)
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

  it('verifyRegistration()은 regNumber만 있어도 통과한다 — 재동기화는 최초 연동 시 저장된 소유자 정보를 백엔드가 재사용하므로 userName/birthDate가 필요 없다', async () => {
    certificatesApi.verifyRegistration.mockResolvedValue({
      data: { result: { docId: 'doc-reg-1', petId: 'pet-1', regNumber: '410000012345678' } },
    })
    // verifyRegistration 성공 후 내부적으로 fetchCertificates(petId)를 호출하므로 같이 mock한다
    certificatesApi.getList.mockResolvedValue({ data: { result: [] } })

    const store = useCertificateStore()
    await store.verifyRegistration('pet-1', { regNumber: '410000012345678' })

    expect(certificatesApi.verifyRegistration).toHaveBeenCalledWith('pet-1', {
      regNumber: '410000012345678',
      userName: undefined,
      birthDate: undefined,
    })
  })

  it('verifyRegistration()은 regNumber가 없으면 API를 호출하지 않고 에러를 던진다', async () => {
    const store = useCertificateStore()

    await expect(store.verifyRegistration('pet-1', {})).rejects.toThrow(
      '동물등록번호를 입력해주세요.',
    )
    expect(certificatesApi.verifyRegistration).not.toHaveBeenCalled()
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
