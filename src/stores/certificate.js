import { defineStore } from 'pinia'
import { certificatesApi } from '@/api/certificates'
import { petApi } from '@/api/pet'
import { USE_MOCK_DATA } from '@/mocks/config'
import { MOCK_PET_DOCUMENTS, MOCK_REGISTRATION_DETAIL } from '@/mocks/certificate'

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
        this.detail = data.result ?? null
        return this.detail
      })
    },

    // 동물등록증 조회 — 동물등록번호 + 신청인(보호자) 이름/생년월일로 국가동물보호정보시스템(APMS)에서
    // 조회. 외부 조회 API 연동(공공데이터포털 등)은 백엔드가 대신 처리하고, 프론트는 결과 후보
    // 목록만 그대로 받는다. 이름/생년월일 중 하나만 있어도 조회 가능하다는 전제.
    async requestApmsSimpleAuth({ regNumber, userName, birthDate }) {
      if (!regNumber?.trim() || (!userName?.trim() && !birthDate?.trim())) {
        throw new Error('동물등록번호와 이름 또는 생년월일을 입력해주세요.')
      }

      if (USE_MOCK_DATA) {
        // 조회 API 응답 지연 흉내
        await new Promise((resolve) => setTimeout(resolve, 800))

        const nowIso = new Date().toISOString().slice(0, 19)
        // 이미 연동된 동물등록증이 없는 펫들을 "신청인 명의로 조회된 동물"로 흉내냄
        const linkedPetIds = new Set(
          this.documents.filter((doc) => doc.docType === 'REGISTRATION').map((doc) => doc.petId),
        )
        const candidates = this.pets
          .filter((pet) => !linkedPetIds.has(pet.petId))
          .map((pet) => ({
            petId: pet.petId,
            regNumber: `41000001${String(Date.now()).slice(-8)}${pet.petId.slice(-1)}`,
            name: pet.name,
            breed: pet.breed,
            gender: pet.gender,
            neutered: pet.neutered,
            birthDate: pet.birthDate,
            rfidCd: `41000001${String(Date.now()).slice(-8)}${pet.petId.slice(-1)}`,
            rfidGubun: 'Y',
            orgNm: '제주특별자치도 제주시',
            officeTel: '064-728-2114',
            aprGbnNm: '승인완료',
            regTm: nowIso,
            aprTm: nowIso,
          }))

        return candidates
      }

      return this._withRequestState(async () => {
        const { data } = await certificatesApi.syncRegistration({ regNumber, userName, birthDate })
        return data.result ?? []
      })
    },

    // 동물등록증 연동 2단계 — 사용자가 매칭 결과 화면에서 선택한 후보들을 저장
    async confirmApmsLink(candidates) {
      if (!USE_MOCK_DATA) {
        return this._withRequestState(async () => {
          await certificatesApi.saveRegistrationLinks(candidates)
          if (this.selectedPetId) {
            await this.fetchCertificates(this.selectedPetId)
          }
        })
      }

      const today = new Date().toISOString().slice(0, 10)

      for (const candidate of candidates) {
        const pet = this.pets.find((p) => p.petId === candidate.petId)
        const docId = `doc-reg-${candidate.petId}`

        const detail = {
          docId,
          ...candidate,
          lastSyncedAt: today,
        }
        this.registrationDetails = { ...this.registrationDetails, [docId]: detail }

        if (pet) pet.regNumber = candidate.regNumber

        const newDoc = {
          docId,
          petId: candidate.petId,
          docName: `${candidate.name} · 동물등록증`,
          docType: 'REGISTRATION',
          fileUrl: '',
          issuedDate: today,
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents.filter((doc) => doc.docId !== docId)]
      }

      if (this.selectedPetId) {
        await this.fetchCertificates(this.selectedPetId)
      }
    },

    // 동물등록증 재동기화 — connectedId를 이미 확보한 상태(최초 연동 완료)라는 전제로,
    // 신원확인 폼 없이 바로 재조회한다는 흐름만 흉내냄. 값 자체는 크게 바뀌지 않고
    // lastSyncedAt만 갱신 — "정보가 바뀌면 자동 갱신"을 사용자가 수동으로 트리거하는 액션.
    async resyncRegistration(petId, docId) {
      if (USE_MOCK_DATA) {
        const existing = this.registrationDetails[docId]
        if (!existing) return null

        // 재인증 없이 바로 재조회한다는 전제라 대기 시간이 짧음
        await new Promise((resolve) => setTimeout(resolve, 800))

        const updated = { ...existing, lastSyncedAt: new Date().toISOString().slice(0, 10) }
        this.registrationDetails = { ...this.registrationDetails, [docId]: updated }
        if (this.detail?.docId === docId) this.detail = updated
        return updated
      }

      return this._withRequestState(async () => {
        const { data } = await certificatesApi.resyncRegistration(petId, docId)
        this.detail = data.result ?? null
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
        const uploaded = {
          ...data.result,
          docName: data.result?.docName || file.name,
        }
        const isUploadedDocument = (doc) =>
          doc.docId === uploaded.docId || (doc.petId === petId && doc.docType === 'VACCINATION')
        this.documents = [uploaded, ...this.documents.filter((doc) => !isUploadedDocument(doc))]
        this.vaccinationDocs = [
          uploaded,
          ...this.vaccinationDocs.filter((doc) => !isUploadedDocument(doc)),
        ]
        return uploaded
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
        await this.fetchCertificates(petId)
        return data.result
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
