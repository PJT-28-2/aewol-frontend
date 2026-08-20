import { defineStore } from 'pinia'
import { certificatesApi } from '@/api/certificates'
import { petApi } from '@/api/pet'
import { USE_MOCK_DATA } from '@/mocks/config'
import { MOCK_PET_DOCUMENTS, MOCK_REGISTRATION_DETAIL } from '@/mocks/certificate'

// 백엔드가 birthDate를 digits(...)로 저장·응답해 "20230512"처럼 구분자 없는 8자리 숫자로 내려온다.
// 화면에서 쓰는 formatDateDot은 '-'만 '.'로 치환할 뿐이라 구분자가 없으면 그대로 노출돼버리므로,
// 응답을 받는 시점에 ISO(YYYY-MM-DD)로 정규화해서 저장해둔다
function normalizeRegistrationDetail(detail) {
  if (!detail?.birthDate || !/^\d{8}$/.test(detail.birthDate)) return detail
  const { birthDate } = detail
  return {
    ...detail,
    birthDate: `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`,
  }
}

// mock 모드의 펫 탭 목록은 MOCK_REGISTRATION_DETAIL에서 뽑아 쓴다(등록증 연동 여부와 무관하게
// 모든 펫이 하나씩 항목을 가지고 있음). 문서 상세 전용 필드(docId, rfidCd 등)는 제외한다
function toPetSummary(detail) {
  return {
    petId: detail.petId,
    memberId: detail.memberId,
    name: detail.name,
    species: detail.species,
    breed: detail.breed,
    birthDate: detail.birthDate,
    gender: detail.gender,
    weight: detail.weight,
    neutered: detail.neutered,
    regNumber: detail.regNumber,
    medicalHistory: detail.medicalHistory,
  }
}

export const useCertificateStore = defineStore('certificate', {
  state: () => ({
    // 상단 펫 탭 — petId(문자열) 기준. usePetStore(id 기준)와는 별개로 이 도메인에서 자체 관리한다
    pets: [],
    selectedPetId: null,

    // mock 모드에서 세션 동안 유지되는 문서 전체 목록 (업로드/연동으로 추가된 항목 포함)
    documents: [],
    // GET /api/certificates/{doc_id} 상세 응답 목데이터, key: docId
    registrationDetails: {},

    registrationDoc: null,
    vaccinationDocs: [],
    medicalDocs: [],
    detail: null,

    pendingRequestCount: 0,
    error: null,
  }),

  getters: {
    isLoading: (state) => state.pendingRequestCount > 0,
    selectedPet: (state) => state.pets.find((pet) => pet.petId === state.selectedPetId) ?? null,
  },

  actions: {
    async _withRequestState(request) {
      this.pendingRequestCount += 1
      this.error = null
      try {
        return await request()
      } catch (err) {
        this.error = err
        throw err
      } finally {
        this.pendingRequestCount -= 1
      }
    },

    // 선택된 펫이 없어질 때(펫 전체 삭제, 계정 전환 등) 호출 — 이전 펫의 문서/등록증 상태가
    // 화면에 그대로 남는 것을 방지
    resetCertificates() {
      this.documents = []
      this.registrationDoc = null
      this.vaccinationDocs = []
      this.medicalDocs = []
    },

    // 사용자가 키우는 반려동물 전체를 상단 탭에 노출
    // 화면 재진입마다 다시 호출되므로, 목데이터 시딩은 최초 1회만 — 그렇지 않으면
    // 세션 중 업로드/연동/삭제로 바뀐 documents/registrationDetails가 매번 초기화됨
    async fetchPets() {
      if (USE_MOCK_DATA) {
        if (this.pets.length === 0) {
          this.registrationDetails = structuredClone(MOCK_REGISTRATION_DETAIL)
          this.pets = Object.values(this.registrationDetails).map(toPetSummary)
          this.documents = structuredClone(MOCK_PET_DOCUMENTS)
        }
        this._syncSelectedPetId()
        return
      }
      return this._withRequestState(async () => {
        const { data } = await petApi.getPets()
        this.pets = data.result ?? []
        this._syncSelectedPetId()
      })
    },

    // 새로 받아온 pets 기준으로 selectedPetId가 여전히 유효한지 확인.
    // 펫 삭제나 계정 전환 후 이전 목록의 ID가 남아있을 수 있어, 목록에 없으면 첫 번째 펫으로 재설정(없으면 null)
    _syncSelectedPetId() {
      const stillExists = this.pets.some((pet) => pet.petId === this.selectedPetId)
      if (!stillExists) {
        this.selectedPetId = this.pets[0]?.petId ?? null
        if (!this.selectedPetId) this.resetCertificates()
      }
    },

    async selectPet(petId) {
      this.selectedPetId = petId
      await this.fetchCertificates(petId)
    },

    // GET /api/certificates
    // 화면 재진입마다 다시 호출되므로, mock 문서 시딩은 documents가 비어있을 때만 — 그렇지 않으면
    // 세션 중 업로드/연동/삭제로 바뀐 documents/registrationDetails가 매번 초기화됨
    async fetchCertificates(petId) {
      if (USE_MOCK_DATA) {
        if (this.documents.length === 0) {
          this.documents = structuredClone(MOCK_PET_DOCUMENTS)
          this.registrationDetails = structuredClone(MOCK_REGISTRATION_DETAIL)
        }
        const docs = this.documents.filter((doc) => doc.petId === petId)
        this.registrationDoc = docs.find((doc) => doc.docType === 'REGISTRATION') ?? null
        this.vaccinationDocs = docs.filter((doc) => doc.docType === 'VACCINATION')
        this.medicalDocs = docs.filter((doc) => doc.docType === 'MEDICAL_CONFIRMATION')
        return
      }
      await this._withRequestState(async () => {
        const { data } = await certificatesApi.getList(petId)
        // 응답을 받는 사이 다른 펫 탭으로 전환해 selectedPetId가 바뀌었으면, 이 응답은 더 이상
        // 현재 선택된 펫의 것이 아니므로 버린다(빠른 탭 전환 시 이전 응답이 최신 상태를 덮어쓰는 것 방지)
        if (this.selectedPetId !== petId) return
        const docs = data.result ?? []
        // CertificateDetailView가 docId로 문서를 찾을 때 documents를 참조하므로 mock 모드와 동일하게 채워둔다
        this.documents = docs
        this.registrationDoc = docs.find((doc) => doc.docType === 'REGISTRATION') ?? null
        this.vaccinationDocs = docs.filter((doc) => doc.docType === 'VACCINATION')
        this.medicalDocs = docs.filter((doc) => doc.docType === 'MEDICAL_CONFIRMATION')
      })
    },

    // GET /api/pets/{petId}/documents/{docId} — 동물등록증 상세
    // APMS를 매번 라이브 호출하는 게 아니라, 연동 시점에 이미 DB에 저장해둔 값을 조회하는 API라는 전제
    async fetchCertificateDetail(petId, docId) {
      if (USE_MOCK_DATA) {
        this.detail = this.registrationDetails[docId] ?? null
        return this.detail
      }
      return this._withRequestState(async () => {
        const { data } = await certificatesApi.getDetail(petId, docId)
        this.detail = normalizeRegistrationDetail(data.result ?? null)
        return this.detail
      })
    },

    // 동물등록증 인증 — 이미 있는 반려동물(petId) 하나를 대상으로 동물등록번호 + 신청인(보호자)
    // 이름/생년월일을 검증하고, 성공하면 그 자리에서 바로 저장까지 된다(조회 전용 단계 없음).
    // 이미 연동된 반려동물에 다시 호출하면 재동기화(갱신)로 동작 — 별도 재동기화 액션이 필요 없다.
    // userName/birthDate는 최초 연동에서만 필수다(신청인 확인용) — 재동기화는 최초 연동 시
    // DB에 저장해둔 소유자 이름/생년월일을 백엔드가 그대로 재사용해 APMS를 다시 조회하므로,
    // regNumber만 넘기면 된다(handleResync가 이 방식으로 호출함). 최초 연동 화면(CertificateListView)
    // 쪽 "이름 또는 생년월일 중 하나 이상" 검증은 화면 자체에서 이미 하고 있어 여기서는 regNumber만 확인한다.
    async verifyRegistration(petId, { regNumber, userName, birthDate }) {
      if (!regNumber?.trim()) {
        throw new Error('동물등록번호를 입력해주세요.')
      }

      if (USE_MOCK_DATA) {
        // 인증 API 응답 지연 흉내
        await new Promise((resolve) => setTimeout(resolve, 800))

        const pet = this.pets.find((p) => p.petId === petId)
        const nowIso = new Date().toISOString().slice(0, 19)
        const docId = `doc-reg-${petId}`
        const detail = {
          docId,
          petId,
          regNumber,
          name: pet?.name ?? '',
          breed: pet?.breed ?? '',
          gender: pet?.gender ?? 'MALE',
          neutered: pet?.neutered ?? 'Y',
          birthDate: pet?.birthDate ?? '',
          rfidCd: regNumber,
          rfidGubun: 'Y',
          orgNm: '제주특별자치도 제주시',
          officeTel: '064-728-2114',
          aprGbnNm: '승인완료',
          regTm: nowIso,
          aprTm: nowIso,
          verified: true,
        }
        this.registrationDetails = { ...this.registrationDetails, [docId]: detail }
        if (pet) pet.regNumber = regNumber

        const newDoc = {
          docId,
          petId,
          docName: `${detail.name} · 동물등록증`,
          docType: 'REGISTRATION',
          fileUrl: '',
          issuedDate: nowIso.slice(0, 10),
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents.filter((doc) => doc.docId !== docId)]
        this.detail = detail
        if (this.selectedPetId === petId) await this.fetchCertificates(petId)
        return detail
      }

      return this._withRequestState(async () => {
        const { data } = await certificatesApi.verifyRegistration(petId, { regNumber, userName, birthDate })
        this.detail = normalizeRegistrationDetail(data.result ?? null)
        await this.fetchCertificates(petId)
        return this.detail
      })
    },

    // 동물등록증 연동 해제(삭제)
    async deleteRegistration(petId, docId) {
      if (USE_MOCK_DATA) {
        const doc = this.documents.find((d) => d.docId === docId)
        this.documents = this.documents.filter((d) => d.docId !== docId)

        const nextDetails = { ...this.registrationDetails }
        delete nextDetails[docId]
        this.registrationDetails = nextDetails

        const pet = doc ? this.pets.find((p) => p.petId === doc.petId) : null
        if (pet) pet.regNumber = ''

        if (this.registrationDoc?.docId === docId) this.registrationDoc = null
        if (this.detail?.docId === docId) this.detail = null
        return
      }

      return this._withRequestState(async () => {
        await certificatesApi.deleteDocument(petId, docId)
        await this.fetchCertificates(petId)
      })
    },

    // 업로드 POST 응답을 목록에 낙관적으로 반영 — 재조회(fetchCertificates) 없이도
    // 화면에 바로 보이게 한다. 업로드 도중 다른 펫 탭으로 전환된 경우(petId !== selectedPetId)는
    // 지금 보이는 목록이 다른 펫 것이므로 반영하지 않는다 — 이후 그 펫 탭으로 다시 돌아오면
    // selectPet()의 재조회가 서버에 이미 저장된 문서를 정상적으로 가져온다
    _addUploadedDocument(doc) {
      if (doc.petId !== this.selectedPetId) return
      this.documents = [doc, ...this.documents]
      if (doc.docType === 'VACCINATION') {
        this.vaccinationDocs = [doc, ...this.vaccinationDocs]
      } else if (doc.docType === 'MEDICAL_CONFIRMATION') {
        this.medicalDocs = [doc, ...this.medicalDocs]
      }
    },

    // POST /api/pets/{petId}/documents — file 필수, issuedDate 선택
    async uploadVaccination(petId, file, issuedDate) {
      if (USE_MOCK_DATA) {
        const newDoc = {
          docId: `doc-vac-${Date.now()}`,
          petId,
          docName: file.name,
          docType: 'VACCINATION',
          // 실제 백엔드가 없어서 서버 파일 URL 대신, 방금 고른 파일을 그 자리에서
          // 미리보기할 수 있도록 브라우저 로컬 objectURL을 사용함(새로고침하면 사라짐)
          fileUrl: URL.createObjectURL(file),
          issuedDate: issuedDate || new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents]
        this.vaccinationDocs = [newDoc, ...this.vaccinationDocs]
        return newDoc
      }
      return this._withRequestState(async () => {
        const { data } = await certificatesApi.uploadVaccination(petId, file, issuedDate)
        // data.result는 POST 응답 그대로라 docName 등이 비어있을 수 있어 폴백을 먼저 깔고 덮어쓴다
        const newDoc = {
          petId,
          docType: 'VACCINATION',
          docName: file.name,
          issuedDate: issuedDate || new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
          ...data.result,
        }
        this._addUploadedDocument(newDoc)
        // 재조회는 최신 상태로 보정하기 위한 보조 작업일 뿐, POST는 이미 성공했으므로 이 실패를
        // 업로드 실패로 취급하지 않는다 — 그렇지 않으면 사용자가 재시도해 서버에 중복 저장된다
        this.fetchCertificates(petId).catch(() => {})
        return newDoc
      })
    },

    // POST /api/pets/{petId}/documents (docType=MEDICAL_CONFIRMATION)
    async uploadMedicalConfirmation(petId, file) {
      if (USE_MOCK_DATA) {
        const newDoc = {
          docId: `doc-med-${Date.now()}`,
          petId,
          docName: file.name,
          docType: 'MEDICAL_CONFIRMATION',
          fileUrl: URL.createObjectURL(file),
          issuedDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents]
        this.medicalDocs = [newDoc, ...this.medicalDocs]
        return newDoc
      }
      return this._withRequestState(async () => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('docType', 'MEDICAL_CONFIRMATION')
        const { data } = await certificatesApi.uploadDocument(petId, formData)
        const newDoc = {
          petId,
          docType: 'MEDICAL_CONFIRMATION',
          docName: file.name,
          issuedDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
          ...data.result,
        }
        this._addUploadedDocument(newDoc)
        // 접종증명서와 동일한 이유로 재조회 실패를 업로드 실패로 전파하지 않는다
        this.fetchCertificates(petId).catch(() => {})
        return newDoc
      })
    },

    // 접종증명서/진료확인서 삭제 — 두 타입 다 문서 배열에서 제거하는 것만 하면 되는 단순한 구조라
    // 동물등록증 해제(deleteRegistration)와 달리 하나의 액션으로 공용 처리
    async deleteDocument(petId, docId) {
      if (USE_MOCK_DATA) {
        const doc = this.documents.find((d) => d.docId === docId)
        // 업로드 시 만든 blob: objectURL은 브라우저가 알아서 회수하지 않으므로 직접 해제
        if (doc?.fileUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(doc.fileUrl)
        }

        this.documents = this.documents.filter((d) => d.docId !== docId)
        this.vaccinationDocs = this.vaccinationDocs.filter((d) => d.docId !== docId)
        this.medicalDocs = this.medicalDocs.filter((d) => d.docId !== docId)
        return
      }

      return this._withRequestState(async () => {
        await certificatesApi.deleteDocument(petId, docId)
        await this.fetchCertificates(petId)
      })
    },
  },
})
