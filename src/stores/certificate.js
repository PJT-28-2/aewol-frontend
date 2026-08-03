import { defineStore } from 'pinia'
import { certificatesApi } from '@/api/certificates'
import { usePetStore } from '@/stores/pet'
import { USE_MOCK_DATA } from '@/mocks/config'
import { MOCK_PET_DOCUMENTS, MOCK_REGISTRATION_DETAIL } from '@/mocks/pet'

export const useCertificateStore = defineStore('certificate', {
  state: () => ({
    // 반려동물 목록/선택은 usePetStore가 단일 소스 — 여기서는 마지막으로 조회한 petId만
    // 기록해뒀다가 연동/삭제 후 재조회(fetchCertificates)할 때 쓴다
    petId: null,

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

    // GET /api/certificates
    // 화면 재진입마다 다시 호출되므로, mock 문서 시딩은 documents가 비어있을 때만 — 그렇지 않으면
    // 세션 중 업로드/연동/삭제로 바뀐 documents/registrationDetails가 매번 초기화됨
    async fetchCertificates(petId) {
      this.petId = petId
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

    // 동물등록증 조회 — 신원 정보로 국가동물보호정보시스템(APMS)에서 신청인 명의 동물을 조회.
    // 외부 조회 API 연동(공공데이터포털 등)은 백엔드가 대신 처리하는 단건 요청/응답이라
    // 프론트는 결과 후보 목록만 그대로 받는다. 등록번호는 요청값이 아니라 응답값이라,
    // 조회만 하면 신청인 명의의 동물이 (여러 마리면 배열로) 돌아온다.
    async requestApmsSimpleAuth({ userName, birthDate, phoneNo }) {
      if (!userName?.trim() || !birthDate?.trim() || !phoneNo?.trim()) {
        throw new Error('이름, 생년월일, 전화번호를 모두 입력해주세요.')
      }

      if (USE_MOCK_DATA) {
        // 조회 API 응답 지연 흉내
        await new Promise((resolve) => setTimeout(resolve, 800))

        const nowIso = new Date().toISOString().slice(0, 19)
        // 이미 연동된 동물등록증이 없는 펫들을 "신청인 명의로 조회된 동물"로 흉내냄
        const linkedPetIds = new Set(
          this.documents.filter((doc) => doc.docType === 'REGISTRATION').map((doc) => doc.petId),
        )
        const candidates = usePetStore().pets
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
        const { data } = await certificatesApi.syncRegistration({ userName, birthDate, phoneNo })
        return data.result ?? []
      })
    },

    // 동물등록증 연동 2단계 — 사용자가 매칭 결과 화면에서 선택한 후보들을 저장
    async confirmApmsLink(candidates) {
      if (!USE_MOCK_DATA) {
        return this._withRequestState(async () => {
          await certificatesApi.saveRegistrationLinks(candidates)
          if (this.petId) {
            await this.fetchCertificates(this.petId)
          }
        })
      }

      const petStore = usePetStore()
      const today = new Date().toISOString().slice(0, 10)

      for (const candidate of candidates) {
        const pet = petStore.pets.find((p) => p.petId === candidate.petId)
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

      if (this.petId) {
        await this.fetchCertificates(this.petId)
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

        const pet = doc ? usePetStore().pets.find((p) => p.petId === doc.petId) : null
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

    // POST /api/pets/{petId}/documents (docType=VACCINATION)
    async uploadVaccination(petId, file) {
      if (USE_MOCK_DATA) {
        const newDoc = {
          docId: `doc-vac-${Date.now()}`,
          petId,
          docName: file.name,
          docType: 'VACCINATION',
          // 실제 백엔드가 없어서 서버 파일 URL 대신, 방금 고른 파일을 그 자리에서
          // 미리보기할 수 있도록 브라우저 로컬 objectURL을 사용함(새로고침하면 사라짐)
          fileUrl: URL.createObjectURL(file),
          issuedDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents]
        this.vaccinationDocs = [newDoc, ...this.vaccinationDocs]
        return newDoc
      }
      return this._withRequestState(async () => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('docType', 'VACCINATION')
        const { data } = await certificatesApi.uploadDocument(petId, formData)
        await this.fetchCertificates(petId)
        return data.result
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
